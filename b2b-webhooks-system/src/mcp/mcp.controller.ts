import { 
  Controller, Post, Get, Body, Query, Param, 
  UploadedFiles, UseInterceptors, Logger 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AiOrchestratorService } from '../ai/ai-orchestrator.service';
import { McpToolsService } from './mcp-tools.service';

class ChatMessageDto {
  @ApiProperty({ required: false, description: 'ID de la sesión de chat' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ required: false, description: 'Mensaje del usuario' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ required: false, description: 'Contenido del mensaje (alias)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ required: false, description: 'Rol del usuario (admin, operator, user)' })
  @IsOptional()
  @IsString()
  userRole?: string;

  @ApiProperty({ required: false, description: 'ID del usuario autenticado' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: 'Email del usuario autenticado' })
  @IsOptional()
  @IsString()
  userEmail?: string;
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
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  }))
  @ApiOperation({ 
    summary: 'Enviar mensaje al chatbot',
    description: 'Procesa un mensaje de texto y opcionalmente archivos adjuntos'
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 200, description: 'Respuesta del chatbot' })
  async chat(
    @Body() dto: ChatMessageDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    try {
      const session = this.aiOrchestrator.getOrCreateSession(dto.sessionId);
      const messageContent = dto.message || dto.content || '';
      
      // Contexto del usuario para filtrar herramientas
      const userContext = {
        role: dto.userRole || 'user',
        userId: dto.userId,
        userEmail: dto.userEmail,
      };
      
      // Procesar archivos si existen
      const processedFiles = files?.length ? files.map(f => ({
        buffer: f.buffer,
        filename: f.originalname,
        mimeType: f.mimetype,
      })) : undefined;

      const response = await this.aiOrchestrator.processMessage(
        session.id,
        messageContent,
        processedFiles,
        userContext,
      );

      return {
        success: true,
        sessionId: session.id,
        message: response,
        attachmentsProcessed: files?.length || 0,
      };
    } catch (error: any) {
      this.logger.error(`Error en chat: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Error procesando mensaje',
      };
    }
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
