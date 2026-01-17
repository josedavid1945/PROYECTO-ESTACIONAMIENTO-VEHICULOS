import { 
  Controller, Post, Get, Body, Query, Param, 
  UploadedFiles, UseInterceptors, Logger 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiOrchestratorService } from '../ai/ai-orchestrator.service';
import { McpToolsService } from './mcp-tools.service';

class ChatMessageDto {
  sessionId?: string;
  message: string;
}

@ApiTags('MCP')
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(
    private readonly aiOrchestrator: AiOrchestratorService,
    private readonly mcpTools: McpToolsService,
  ) {}

  @Post('chat')
  @ApiOperation({ 
    summary: 'Enviar mensaje al chatbot',
    description: 'Procesa un mensaje de texto y opcionalmente archivos adjuntos'
  })
  @ApiResponse({ status: 200, description: 'Respuesta del chatbot' })
  async chat(@Body() dto: ChatMessageDto) {
    const session = this.aiOrchestrator.getOrCreateSession(dto.sessionId);
    
    const response = await this.aiOrchestrator.processMessage(
      session.id,
      dto.message,
    );

    return {
      sessionId: session.id,
      message: response,
    };
  }

  @Post('chat/multimodal')
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  @ApiOperation({ 
    summary: 'Chat con archivos adjuntos',
    description: 'Envía mensaje con imágenes o PDFs para análisis'
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Respuesta del chatbot con análisis de archivos' })
  async chatWithFiles(
    @Body() dto: ChatMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const session = this.aiOrchestrator.getOrCreateSession(dto.sessionId);

    const processedFiles = files?.map(f => ({
      buffer: f.buffer,
      filename: f.originalname,
      mimeType: f.mimetype,
    }));

    const response = await this.aiOrchestrator.processMessage(
      session.id,
      dto.message,
      processedFiles,
    );

    return {
      sessionId: session.id,
      message: response,
      attachmentsProcessed: files?.length || 0,
    };
  }

  @Get('session/:id/history')
  @ApiOperation({ summary: 'Obtener historial de chat' })
  @ApiResponse({ status: 200, description: 'Historial de mensajes de la sesión' })
  getHistory(@Param('id') sessionId: string) {
    return {
      sessionId,
      messages: this.aiOrchestrator.getSessionHistory(sessionId),
    };
  }

  @Get('tools')
  @ApiOperation({ summary: 'Listar herramientas MCP disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de herramientas' })
  getTools() {
    return {
      tools: this.mcpTools.getToolsDefinition(),
      count: this.mcpTools.getToolsDefinition().length,
    };
  }

  @Post('tools/:name/execute')
  @ApiOperation({ summary: 'Ejecutar herramienta MCP directamente' })
  @ApiResponse({ status: 200, description: 'Resultado de la herramienta' })
  async executeTool(
    @Param('name') toolName: string,
    @Body() params: Record<string, any>,
  ) {
    return this.mcpTools.executeTool(toolName, params);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas del servicio MCP' })
  @ApiResponse({ status: 200, description: 'Estadísticas' })
  getStats() {
    return this.aiOrchestrator.getStats();
  }

  @Post('session/new')
  @ApiOperation({ summary: 'Crear nueva sesión de chat' })
  @ApiResponse({ status: 201, description: 'Nueva sesión creada' })
  createSession() {
    const session = this.aiOrchestrator.getOrCreateSession();
    return {
      sessionId: session.id,
      createdAt: session.createdAt,
    };
  }
}
