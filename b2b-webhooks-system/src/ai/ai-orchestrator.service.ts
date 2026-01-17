import { Injectable, Logger } from '@nestjs/common';
import { GeminiAdapterService, LlmMessage, LlmResponse } from './gemini-adapter.service';
import { MultimodalProcessorService, ProcessedInput } from './multimodal-processor.service';
import { McpToolsService } from '../mcp/mcp-tools.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: string;
    name: string;
    extractedContent?: string;
  }>;
  toolExecution?: {
    toolName: string;
    input: Record<string, any>;
    output: any;
    duration: number;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
}

/**
 * AiOrchestratorService - Orquesta el chatbot MCP multimodal
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private sessions = new Map<string, ChatSession>();
  
  private readonly systemPrompt = `Eres un asistente inteligente para el Sistema de Gestión de Estacionamiento B2B.

Tu rol es ayudar a los usuarios a:
1. Gestionar el estacionamiento (buscar espacios, ver tickets, procesar pagos)
2. Administrar partners B2B (registrar, listar, configurar webhooks)
3. Monitorear eventos y webhooks (estadísticas, diagnósticos)
4. Simular flujos de prueba para integraciones

Tienes acceso a las siguientes herramientas que DEBES usar cuando sea necesario:
- buscar_espacios: Buscar espacios de estacionamiento disponibles
- ver_ticket: Ver información de un ticket o reserva
- crear_reserva: Crear una nueva reserva
- procesar_pago: Procesar el pago de un ticket
- resumen_recaudacion: Ver resumen de ventas/recaudación
- registrar_partner: Registrar un nuevo partner B2B
- listar_partners: Listar todos los partners
- simular_evento_partner: Simular un evento para un partner
- estadisticas_eventos: Ver estadísticas de webhooks
- diagnosticar_webhook: Analizar webhooks fallidos

Cuando el usuario pregunte algo que puedas resolver con una herramienta, ÚSALA.
Si el usuario sube una imagen o PDF, analiza su contenido para ayudarlo.
Responde siempre en español y de forma concisa pero útil.
Si no puedes hacer algo, explica por qué y sugiere alternativas.`;

  constructor(
    private geminiAdapter: GeminiAdapterService,
    private multimodalProcessor: MultimodalProcessorService,
    private mcpTools: McpToolsService,
  ) {}

  /**
   * Crea una nueva sesión de chat
   */
  createSession(): ChatSession {
    const session: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Obtiene o crea una sesión
   */
  getOrCreateSession(sessionId?: string): ChatSession {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastActivity = new Date();
      return session;
    }
    return this.createSession();
  }

  /**
   * Procesa un mensaje del usuario (puede incluir archivos)
   */
  async processMessage(
    sessionId: string,
    content: string,
    files?: Array<{ buffer: Buffer; filename: string; mimeType: string }>,
  ): Promise<ChatMessage> {
    const session = this.getOrCreateSession(sessionId);
    const startTime = Date.now();

    // Procesar archivos adjuntos si existen
    let processedFiles: ProcessedInput[] = [];
    let attachmentsInfo: ChatMessage['attachments'] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const processed = await this.multimodalProcessor.processFile(
          file.buffer,
          file.filename,
          file.mimeType,
        );
        processedFiles.push(processed);
        attachmentsInfo.push({
          type: processed.type,
          name: file.filename,
          extractedContent: processed.extractedText?.substring(0, 200),
        });
      }
    }

    // Construir mensaje del usuario
    let userContent = content;
    if (processedFiles.length > 0) {
      const fileContents = processedFiles
        .map((f, i) => `[Archivo ${i + 1}: ${files![i].filename}]\n${f.extractedText || f.error}`)
        .join('\n\n');
      userContent = `${content}\n\n--- Contenido de archivos adjuntos ---\n${fileContents}`;
    }

    // Agregar mensaje del usuario a la sesión
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content,
      timestamp: new Date(),
      attachments: attachmentsInfo.length > 0 ? attachmentsInfo : undefined,
    };
    session.messages.push(userMessage);

    // Construir historial para el LLM
    const llmMessages: LlmMessage[] = session.messages.map(m => ({
      role: m.role === 'tool' ? 'function' : m.role,
      content: m.content,
      ...(m.toolExecution && {
        functionResult: {
          name: m.toolExecution.toolName,
          result: m.toolExecution.output,
        },
      }),
    }));

    // Obtener definiciones de herramientas
    const tools = this.mcpTools.getToolsDefinition();

    // Generar respuesta inicial
    let response = await this.geminiAdapter.generateResponse(
      llmMessages,
      tools,
      this.systemPrompt,
    );

    // Ejecutar herramientas si se solicitan (hasta 5 iteraciones)
    let iterations = 0;
    const maxIterations = 5;

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < maxIterations) {
      iterations++;
      this.logger.debug(`Ejecutando ${response.toolCalls.length} herramientas (iteración ${iterations})`);

      for (const toolCall of response.toolCalls) {
        const toolResult = await this.mcpTools.executeTool(toolCall.name, toolCall.arguments);
        
        // Agregar resultado de herramienta a la sesión
        const toolMessage: ChatMessage = {
          id: `tool_${Date.now()}`,
          role: 'tool',
          content: JSON.stringify(toolResult.data || { error: toolResult.error }),
          timestamp: new Date(),
          toolExecution: {
            toolName: toolCall.name,
            input: toolCall.arguments,
            output: toolResult.data || { error: toolResult.error },
            duration: toolResult.duration,
          },
        };
        session.messages.push(toolMessage);

        // Agregar al historial del LLM
        llmMessages.push({
          role: 'function',
          content: JSON.stringify(toolResult.data || { error: toolResult.error }),
          functionResult: {
            name: toolCall.name,
            result: toolResult.data || { error: toolResult.error },
          },
        });
      }

      // Generar siguiente respuesta
      response = await this.geminiAdapter.generateResponse(
        llmMessages,
        tools,
        this.systemPrompt,
      );
    }

    // Crear mensaje de respuesta del asistente
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response.content || 'No pude generar una respuesta.',
      timestamp: new Date(),
    };
    session.messages.push(assistantMessage);

    const duration = Date.now() - startTime;
    this.logger.log(`Mensaje procesado en ${duration}ms (${iterations} llamadas a herramientas)`);

    return assistantMessage;
  }

  /**
   * Obtiene el historial de una sesión
   */
  getSessionHistory(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  /**
   * Limpia sesiones antiguas (más de 1 hora sin actividad)
   */
  cleanupSessions(): number {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let cleaned = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.lastActivity.getTime() < oneHourAgo) {
        this.sessions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Limpiadas ${cleaned} sesiones inactivas`);
    }

    return cleaned;
  }

  /**
   * Estadísticas del servicio
   */
  getStats(): {
    activeSessions: number;
    totalMessages: number;
    toolsAvailable: number;
  } {
    let totalMessages = 0;
    for (const session of this.sessions.values()) {
      totalMessages += session.messages.length;
    }

    return {
      activeSessions: this.sessions.size,
      totalMessages,
      toolsAvailable: this.mcpTools.getToolsDefinition().length,
    };
  }
}
