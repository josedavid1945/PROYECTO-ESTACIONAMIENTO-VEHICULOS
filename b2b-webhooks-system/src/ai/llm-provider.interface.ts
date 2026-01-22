/**
 * Interfaz abstracta para proveedores de LLM (Patrón Strategy)
 * 
 * Esta interfaz define el contrato que todos los proveedores de IA deben implementar,
 * permitiendo intercambiar proveedores sin modificar el código cliente.
 */

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
  provider?: string; // Indica qué proveedor generó la respuesta
}

export interface LlmProviderConfig {
  apiKey: string;
  backupApiKey?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

/**
 * Interfaz Strategy para proveedores de LLM
 * 
 * Cada proveedor (Gemini, OpenAI, Anthropic, etc.) debe implementar esta interfaz
 */
export interface ILlmProvider {
  /**
   * Nombre del proveedor (para logging y diagnóstico)
   */
  readonly providerName: string;

  /**
   * Inicializa el proveedor con la configuración
   */
  initialize(config: LlmProviderConfig): void;

  /**
   * Genera una respuesta con soporte opcional de herramientas
   */
  generateResponse(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
    systemPrompt?: string,
  ): Promise<LlmResponse>;

  /**
   * Verifica si el proveedor está disponible y funcionando
   */
  isHealthy(): Promise<boolean>;

  /**
   * Indica si el proveedor está inicializado correctamente
   */
  isInitialized(): boolean;
}

/**
 * Token de inyección para el proveedor de LLM activo
 */
export const LLM_PROVIDER = 'LLM_PROVIDER';

/**
 * Token de inyección para proveedores de respaldo
 */
export const LLM_FALLBACK_PROVIDERS = 'LLM_FALLBACK_PROVIDERS';
