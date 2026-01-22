import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ILlmProvider, 
  LlmMessage, 
  LlmToolDefinition, 
  LlmResponse, 
  LlmProviderConfig 
} from '../llm-provider.interface';

/**
 * OpenAIProvider - Implementación del patrón Strategy para OpenAI (GPT-4, GPT-3.5)
 * 
 * Este proveedor implementa la interfaz ILlmProvider para OpenAI,
 * permitiendo usar GPT como alternativa a Gemini.
 */
@Injectable()
export class OpenAIProvider implements ILlmProvider, OnModuleInit {
  private readonly logger = new Logger(OpenAIProvider.name);
  readonly providerName = 'OpenAI';
  
  private apiKey: string | null = null;
  private initialized = false;
  
  // Circuit breaker
  private failures = 0;
  private lastFailure: Date | null = null;
  private readonly maxFailures = 3;
  private readonly resetTimeMs = 60000;

  // Configuración
  private config: LlmProviderConfig = {
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxOutputTokens: 2048,
  };

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey) {
      this.initialize({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY no configurada - OpenAI no estará disponible');
    }
  }

  initialize(config: LlmProviderConfig): void {
    if (!config.apiKey) {
      this.logger.warn('API Key no proporcionada para OpenAI');
      return;
    }

    this.config = { ...this.config, ...config };
    this.apiKey = config.apiKey;
    this.initialized = true;
    this.logger.log(`${this.providerName} inicializado correctamente`);
  }

  isInitialized(): boolean {
    return this.initialized && this.apiKey !== null;
  }

  async generateResponse(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
    systemPrompt?: string,
  ): Promise<LlmResponse> {
    if (!this.apiKey) {
      throw new Error('OpenAI no está inicializado');
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new Error('Servicio OpenAI temporalmente no disponible');
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
    // Construir mensajes en formato OpenAI
    const openaiMessages: any[] = [];

    if (systemPrompt) {
      openaiMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    for (const msg of messages) {
      if (msg.role === 'user') {
        openaiMessages.push({
          role: 'user',
          content: msg.content,
        });
      } else if (msg.role === 'assistant') {
        openaiMessages.push({
          role: 'assistant',
          content: msg.content,
        });
      } else if (msg.role === 'function' && msg.functionResult) {
        openaiMessages.push({
          role: 'tool',
          tool_call_id: msg.functionResult.name,
          content: JSON.stringify(msg.functionResult.result),
        });
      }
    }

    // Preparar herramientas en formato OpenAI
    const openaiTools = tools?.map(t => ({
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    // Llamar a la API de OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: openaiMessages,
        tools: openaiTools?.length ? openaiTools : undefined,
        temperature: this.config.temperature,
        max_tokens: this.config.maxOutputTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    const message = choice.message;

    // Procesar tool calls si existen
    const toolCalls = message.tool_calls?.map((tc: any) => ({
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    }));

    return {
      content: message.content || '',
      toolCalls,
      finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' : 'stop',
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
    if (!this.apiKey) return false;
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
