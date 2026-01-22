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
 * AnthropicProvider - Implementación del patrón Strategy para Anthropic Claude
 * 
 * Este proveedor implementa la interfaz ILlmProvider para Claude,
 * permitiendo usar Claude como alternativa a Gemini u OpenAI.
 */
@Injectable()
export class AnthropicProvider implements ILlmProvider, OnModuleInit {
  private readonly logger = new Logger(AnthropicProvider.name);
  readonly providerName = 'Anthropic Claude';
  
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
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxOutputTokens: 2048,
  };

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (apiKey) {
      this.initialize({ apiKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY no configurada - Anthropic Claude no estará disponible');
    }
  }

  initialize(config: LlmProviderConfig): void {
    if (!config.apiKey) {
      this.logger.warn('API Key no proporcionada para Anthropic');
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
      throw new Error('Anthropic Claude no está inicializado');
    }

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new Error('Servicio Anthropic temporalmente no disponible');
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
    // Construir mensajes en formato Anthropic
    const anthropicMessages: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        anthropicMessages.push({
          role: 'user',
          content: msg.content,
        });
      } else if (msg.role === 'assistant') {
        anthropicMessages.push({
          role: 'assistant',
          content: msg.content,
        });
      } else if (msg.role === 'function' && msg.functionResult) {
        anthropicMessages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: msg.functionResult.name,
              content: JSON.stringify(msg.functionResult.result),
            }
          ],
        });
      }
    }

    // Preparar herramientas en formato Anthropic
    const anthropicTools = tools?.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));

    // Llamar a la API de Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxOutputTokens,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: anthropicTools?.length ? anthropicTools : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Procesar contenido
    let content = '';
    const toolCalls: Array<{ name: string; arguments: Record<string, any> }> = [];

    for (const block of data.content) {
      if (block.type === 'text') {
        content += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          name: block.name,
          arguments: block.input,
        });
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
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
    // Anthropic no tiene endpoint de health check simple,
    // verificamos si la API key está configurada
    return this.apiKey !== null;
  }
}
