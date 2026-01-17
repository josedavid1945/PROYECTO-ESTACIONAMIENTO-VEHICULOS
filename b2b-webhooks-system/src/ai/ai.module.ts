import { Module, forwardRef } from '@nestjs/common';
import { GeminiAdapterService } from './gemini-adapter.service';
import { MultimodalProcessorService } from './multimodal-processor.service';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { McpModule } from '../mcp/mcp.module';

@Module({
  imports: [forwardRef(() => McpModule)],
  providers: [
    GeminiAdapterService,
    MultimodalProcessorService,
    AiOrchestratorService,
  ],
  exports: [
    GeminiAdapterService,
    MultimodalProcessorService,
    AiOrchestratorService,
  ],
})
export class AiModule {}
