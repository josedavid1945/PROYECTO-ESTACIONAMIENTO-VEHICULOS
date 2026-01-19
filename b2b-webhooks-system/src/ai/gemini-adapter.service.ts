import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel, Content, Part, SchemaType } from '@google/generative-ai';

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  functionCall?: {
    name: string;
    arguments: Record<string, any>;
  };
  functionResult?: {
    name: string;
    result: any;
  };
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface LlmResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  finishReason: string;
}

/**
 * GeminiAdapter - Adaptador para Google Gemini AI
 */
@Injectable()
export class GeminiAdapterService implements OnModuleInit {
  private readonly logger = new Logger(GeminiAdapterService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private backupGenAI: GoogleGenerativeAI | null = null;
  
  // Circuit breaker
  private failures = 0;
  private lastFailure: Date | null = null;
  private readonly maxFailures = 3;
  private readonly resetTimeMs = 60000;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    const backupApiKey = this.configService.get<string>('GEMINI_API_KEY_BACKUP');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY no configurada - el chatbot no funcionará');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    if (backupApiKey) {
      this.backupGenAI = new GoogleGenerativeAI(backupApiKey);
      this.logger.log('API Key de respaldo configurada');
    }

    this.logger.log('Gemini AI inicializado correctamente');
  }

  /**
   * Genera una respuesta con soporte de herramientas
   */
  async generateResponse(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
    systemPrompt?: string,
  ): Promise<LlmResponse> {
    if (!this.model) {
      throw new Error('Gemini no está inicializado');
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      if (this.backupGenAI) {
        this.logger.warn('Usando API de respaldo debido a fallos');
        return this.generateWithBackup(messages, tools, systemPrompt);
      }
      throw new Error('Servicio temporalmente no disponible');
    }

    try {
      const result = await this.executeWithRetry(
        () => this.doGenerate(messages, tools, systemPrompt),
        3,
      );
      
      this.resetCircuit();
      return result;
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
    // Construir historial de conversación
    const contents: Content[] = [];
    
    // Agregar system prompt como primer mensaje de usuario si existe
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
    let modelWithTools = this.model;
    
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

      modelWithTools = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [toolsConfig],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
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

    // Procesar respuesta
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
      throw new Error('No hay API de respaldo disponible');
    }

    const backupModel = this.backupGenAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    // Simplificar para backup (sin herramientas)
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const result = await backupModel.generateContent(prompt);
    
    return {
      content: result.response.text(),
      finishReason: 'stop',
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
          await this.sleep(Math.pow(2, i) * 1000); // Exponential backoff
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

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('test');
      return !!result.response.text();
    } catch {
      return false;
    }
  }
}
