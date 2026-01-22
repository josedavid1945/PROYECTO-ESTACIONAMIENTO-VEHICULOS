import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiAdapterService } from './gemini-adapter.service';
import { MultimodalProcessorService } from './multimodal-processor.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { McpModule } from '../mcp/mcp.module';
// Nuevos proveedores con patron Strategy
import { LlmStrategyService } from './llm-strategy.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

/**
 * AiModule - Modulo de Inteligencia Artificial
 * 
 * Este modulo implementa el patron Strategy para proveedores de LLM,
 * permitiendo intercambiar entre Gemini, OpenAI y Anthropic de forma
 * transparente con fallback automatico.
 * 
 * Componentes principales:
 * - GeminiAdapterService: Adaptador legacy para compatibilidad
 * - LlmStrategyService: Contexto del patron Strategy
 * - Providers: GeminiProvider, OpenAIProvider, AnthropicProvider
 * - MultimodalProcessorService: Procesamiento de imagenes, PDFs, OCR
 * - AiOrchestratorService: Orquestador del chatbot MCP
 */
@Module({
  imports: [
    ConfigModule,
    forwardRef(() => McpModule),
  ],
  providers: [
    // Adaptador legacy (mantiene compatibilidad)
    GeminiAdapterService,
    MultimodalProcessorService,
    AiOrchestratorService,
    // Nuevos proveedores con patron Strategy
    GeminiProvider,
    OpenAIProvider,
    AnthropicProvider,
    LlmStrategyService,
  ],
  exports: [
    GeminiAdapterService,
    MultimodalProcessorService,
    AiOrchestratorService,
    // Exportar servicio de estrategia
    LlmStrategyService,
    GeminiProvider,
    OpenAIProvider,
    AnthropicProvider,
  ],
})
export class AiModule {}
