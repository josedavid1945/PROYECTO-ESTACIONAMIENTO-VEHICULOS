import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  ILlmProvider, 
  LlmMessage, 
  LlmToolDefinition, 
  LlmResponse 
} from './llm-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

export type LlmProviderType = 'gemini' | 'openai' | 'anthropic';

export interface LlmStrategyConfig {
  primaryProvider: LlmProviderType;
  fallbackOrder: LlmProviderType[];
  enableAutoFallback: boolean;
}

/**
 * LlmStrategyService - Contexto del patrón Strategy para proveedores de LLM
 * 
 * Este servicio gestiona múltiples proveedores de IA y permite:
 * 1. Cambiar dinámicamente entre proveedores
 * 2. Fallback automático cuando un proveedor falla
 * 3. Selección de proveedor basada en configuración
 * 
 * PATRÓN STRATEGY: Define una familia de algoritmos (proveedores de LLM),
 * encapsula cada uno y los hace intercambiables.
 */
@Injectable()
export class LlmStrategyService implements OnModuleInit {
  private readonly logger = new Logger(LlmStrategyService.name);
  
  // Mapa de proveedores disponibles
  private providers = new Map<LlmProviderType, ILlmProvider>();
  
  // Proveedor activo actual
  private currentProvider: LlmProviderType = 'gemini';
  
  // Configuración de estrategia
  private config: LlmStrategyConfig = {
    primaryProvider: 'gemini',
    fallbackOrder: ['openai', 'anthropic'],
    enableAutoFallback: true,
  };

  // Estadísticas de uso
  private stats = {
    totalRequests: 0,
    requestsByProvider: new Map<string, number>(),
    fallbacksTriggered: 0,
    errors: 0,
  };

  constructor(
    private configService: ConfigService,
    private geminiProvider: GeminiProvider,
    private openaiProvider: OpenAIProvider,
    private anthropicProvider: AnthropicProvider,
  ) {}

  onModuleInit() {
    // Registrar todos los proveedores
    this.providers.set('gemini', this.geminiProvider);
    this.providers.set('openai', this.openaiProvider);
    this.providers.set('anthropic', this.anthropicProvider);

    // Configurar desde variables de entorno
    const primaryProvider = this.configService.get<string>('LLM_PRIMARY_PROVIDER', 'gemini') as LlmProviderType;
    const fallbackOrder = this.configService.get<string>('LLM_FALLBACK_ORDER', 'openai,anthropic')
      .split(',')
      .map(p => p.trim()) as LlmProviderType[];
    const enableAutoFallback = this.configService.get<boolean>('LLM_AUTO_FALLBACK', true);

    this.config = {
      primaryProvider,
      fallbackOrder,
      enableAutoFallback,
    };

    this.currentProvider = primaryProvider;

    // Log de proveedores disponibles
    const availableProviders = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isInitialized())
      .map(([name, _]) => name);

    this.logger.log(`Proveedores LLM disponibles: ${availableProviders.join(', ')}`);
    this.logger.log(`Proveedor primario: ${this.currentProvider}`);
    this.logger.log(`Auto-fallback: ${this.config.enableAutoFallback ? 'habilitado' : 'deshabilitado'}`);
  }

  /**
   * Obtiene el proveedor activo actual
   */
  getCurrentProvider(): ILlmProvider {
    const provider = this.providers.get(this.currentProvider);
    if (!provider || !provider.isInitialized()) {
      throw new Error(`Proveedor ${this.currentProvider} no está disponible`);
    }
    return provider;
  }

  /**
   * Cambia el proveedor activo
   */
  setProvider(providerType: LlmProviderType): void {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Proveedor ${providerType} no existe`);
    }
    if (!provider.isInitialized()) {
      throw new Error(`Proveedor ${providerType} no está inicializado`);
    }
    
    this.currentProvider = providerType;
    this.logger.log(`Proveedor cambiado a: ${providerType}`);
  }

  /**
   * Genera una respuesta usando el proveedor activo con fallback automático
   */
  async generateResponse(
    messages: LlmMessage[],
    tools?: LlmToolDefinition[],
    systemPrompt?: string,
  ): Promise<LlmResponse> {
    this.stats.totalRequests++;

    // Obtener orden de intento (proveedor actual + fallbacks)
    const providersToTry: LlmProviderType[] = [
      this.currentProvider,
      ...(this.config.enableAutoFallback ? this.config.fallbackOrder.filter(p => p !== this.currentProvider) : []),
    ];

    let lastError: Error | null = null;

    for (const providerType of providersToTry) {
      const provider = this.providers.get(providerType);
      
      if (!provider || !provider.isInitialized()) {
        this.logger.debug(`Proveedor ${providerType} no disponible, saltando...`);
        continue;
      }

      try {
        this.logger.debug(`Intentando con proveedor: ${providerType}`);
        const response = await provider.generateResponse(messages, tools, systemPrompt);
        
        // Actualizar estadísticas
        const count = this.stats.requestsByProvider.get(providerType) || 0;
        this.stats.requestsByProvider.set(providerType, count + 1);
        
        if (providerType !== this.currentProvider) {
          this.stats.fallbacksTriggered++;
          this.logger.warn(`Fallback usado: ${providerType} (primario: ${this.currentProvider})`);
        }

        return response;
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Error en proveedor ${providerType}: ${error.message}`);
        
        if (!this.config.enableAutoFallback) {
          break;
        }
      }
    }

    this.stats.errors++;
    throw new Error(`Todos los proveedores de LLM fallaron. Último error: ${lastError?.message || 'desconocido'}`);
  }

  /**
   * Verifica la salud de todos los proveedores
   */
  async checkHealth(): Promise<Map<LlmProviderType, boolean>> {
    const health = new Map<LlmProviderType, boolean>();

    for (const [name, provider] of this.providers.entries()) {
      try {
        health.set(name, await provider.isHealthy());
      } catch {
        health.set(name, false);
      }
    }

    return health;
  }

  /**
   * Obtiene estadísticas de uso
   */
  getStats(): {
    totalRequests: number;
    requestsByProvider: Record<string, number>;
    fallbacksTriggered: number;
    errors: number;
    currentProvider: string;
    availableProviders: string[];
  } {
    return {
      totalRequests: this.stats.totalRequests,
      requestsByProvider: Object.fromEntries(this.stats.requestsByProvider),
      fallbacksTriggered: this.stats.fallbacksTriggered,
      errors: this.stats.errors,
      currentProvider: this.currentProvider,
      availableProviders: Array.from(this.providers.entries())
        .filter(([_, p]) => p.isInitialized())
        .map(([name, _]) => name),
    };
  }

  /**
   * Lista todos los proveedores registrados
   */
  listProviders(): Array<{
    name: LlmProviderType;
    providerName: string;
    initialized: boolean;
    isCurrent: boolean;
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      providerName: provider.providerName,
      initialized: provider.isInitialized(),
      isCurrent: name === this.currentProvider,
    }));
  }

  /**
   * Registra un proveedor personalizado
   */
  registerProvider(name: LlmProviderType, provider: ILlmProvider): void {
    this.providers.set(name, provider);
    this.logger.log(`Proveedor personalizado registrado: ${name}`);
  }
}
