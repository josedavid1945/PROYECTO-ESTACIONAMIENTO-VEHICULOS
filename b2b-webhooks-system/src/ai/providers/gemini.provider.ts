import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, Content, SchemaType } from '@google/generative-ai';
import { 
  ILlmProvider, 
  LlmMessage, 
  LlmToolDefinition, 
  LlmResponse, 
  LlmProviderConfig 
} from '../llm-provider.interface';

/**
 * GeminiProvider - Implementación del patrón Strategy para Google Gemini AI
 * 
 * Este proveedor implementa la interfaz ILlmProvider, permitiendo su uso
 * intercambiable con otros proveedores de IA.
 */
@Injectable()
export class GeminiProvider implements ILlmProvider, OnModuleInit {
  private readonly logger = new Logger(GeminiProvider.name);
  readonly providerName = 'Google Gemini';
  
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private backupGenAI: GoogleGenerativeAI | null = null;
  private initialized = false;
  
  // Circuit breaker
  private failures = 0;
  private lastFailure: Date | null = null;
  private readonly maxFailures = 3;
  private readonly resetTimeMs = 60000;

  // Configuración
  private config: LlmProviderConfig = {
    apiKey: '',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxOutputTokens: 2048,
    topK: 40,
    topP: 0.95,
  };

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Inicialización automática desde variables de entorno
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const backupApiKey = this.configService.get<string>('GEMINI_API_KEY_BACKUP');

    if (apiKey) {
      this.initialize({ apiKey, backupApiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY no configurada - Gemini no estará disponible');
    }
  }

  initialize(config: LlmProviderConfig): void {
    if (!config.apiKey) {
      this.logger.warn('API Key no proporcionada para Gemini');
      return;
    }

    this.config = { ...this.config, ...config };

    try {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.config.model || 'gemini-2.5-flash',
        generationConfig: {
          temperature: this.config.temperature,
          topK: this.config.topK,
          topP: this.config.topP,
          maxOutputTokens: this.config.maxOutputTokens,
        },
      });

      if (config.backupApiKey) {
        this.backupGenAI = new GoogleGenerativeAI(config.backupApiKey);
        this.logger.log('API Key de respaldo configurada para Gemini');
      }

      this.initialized = true;
      this.logger.log(`${this.providerName} inicializado correctamente`);
    } catch (error: any) {
      this.logger.error(`Error inicializando Gemini: ${error.message}`);
      this.initialized = false;
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.model !== null;
  }

  async generateResponse(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
    systemPrompt?: string,
  ): Promise<LlmResponse> {
    if (!this.model || !this.genAI) {
      throw new Error('Gemini no está inicializado');
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      if (this.backupGenAI) {
        this.logger.warn('Usando API de respaldo de Gemini debido a fallos');
        return this.generateWithBackup(messages, tools, systemPrompt);
      }
      throw new Error('Servicio Gemini temporalmente no disponible');
    }

    try {
      const result = await this.executeWithRetry(
        () => this.doGenerate(messages, tools, systemPrompt),
        3,
      );

      this.resetCircuit();
      return { ...result, provider: this.providerName };
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private async doGenerate(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
    systemPrompt?: string,
  ): Promise<LlmResponse> {
    const contents: Content[] = [];

    // Agregar system prompt como primer mensaje
    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `[Sistema]: ${systemPrompt}\n\n[Usuario]: ${messages[0]?.content || ''}` }],
      });
      messages = messages.slice(1);
    }

    for (const msg of messages) {
      if (msg.role === 'user') {
        contents.push({
          role: 'user',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'assistant') {
        contents.push({
          role: 'model',
          parts: [{ text: msg.content }],
        });
      } else if (msg.role === 'function' && msg.functionResult) {
        contents.push({
          role: 'user',
          parts: [{
            text: `[Resultado de herramienta ${msg.functionResult.name}]: ${JSON.stringify(msg.functionResult.result)}`
          }],
        });
      }
    }

    // Configurar herramientas si están disponibles
    let modelWithTools = this.model!;

    if (tools && tools.length > 0) {
      const toolsConfig = {
        functionDeclarations: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: {
            type: SchemaType.OBJECT,
            properties: Object.entries(t.parameters.properties).reduce((acc, [key, value]: [string, any]) => {
              acc[key] = {
                type: (value.type?.toUpperCase() || 'STRING') as any,
                description: value.description,
                ...(value.enum && { enum: value.enum }),
              };
              return acc;
            }, {} as Record<string, any>),
            required: t.parameters.required,
          },
        })),
      };

      modelWithTools = this.genAI!.getGenerativeModel({
        model: this.config.model || 'gemini-2.5-flash',
        tools: [toolsConfig],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
        },
      });
    }

    // Generar respuesta
    const chat = modelWithTools.startChat({
      history: contents.slice(0, -1),
    });

    const lastMessage = contents[contents.length - 1];
    const result = await chat.sendMessage(lastMessage?.parts?.[0]?.text || '');
    const response = result.response;

    const text = response.text();
    const functionCalls = response.functionCalls();

    return {
      content: text,
      toolCalls: functionCalls?.map(fc => ({
        name: fc.name,
        arguments: fc.args as Record<string, any>,
      })),
      finishReason: functionCalls?.length ? 'tool_calls' : 'stop',
    };
  }

  private async generateWithBackup(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
    systemPrompt?: string,
  ): Promise<LlmResponse> {
    if (!this.backupGenAI) {
      throw new Error('No hay API de respaldo disponible para Gemini');
    }

    const backupModel = this.backupGenAI.getGenerativeModel({
      model: this.config.model || 'gemini-2.5-flash',
    });

    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = await backupModel.generateContent(prompt);

    return {
      content: result.response.text(),
      finishReason: 'stop',
      provider: `${this.providerName} (Backup)`,
    };
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Intento ${i + 1}/${maxRetries} falló: ${error.message}`);

        if (i < maxRetries - 1) {
          await this.sleep(Math.pow(2, i) * 1000);
        }
      }
    }

    throw lastError!;
  }

  private isCircuitOpen(): boolean {
    if (this.failures < this.maxFailures) return false;
    if (!this.lastFailure) return false;
    return Date.now() - this.lastFailure.getTime() < this.resetTimeMs;
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
  }

  private resetCircuit(): void {
    this.failures = 0;
    this.lastFailure = null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async isHealthy(): Promise<boolean> {
    if (!this.model) return false;
    try {
      const result = await this.model.generateContent('test');
      return !!result.response.text();
    } catch {
      return false;
    }
  }
}
