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
  userContext?: UserContext;
}

export interface UserContext {
  role: string;
  userId?: string;
  userEmail?: string;
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
1. Gestionar el estacionamiento (buscar espacios, registrar ingresos/salidas, ver tickets)
2. Administrar clientes y vehículos (buscar por placa, email o nombre)
3. Procesar pagos y consultar tarifas
4. Administrar partners B2B (registrar, listar, configurar webhooks)
5. Monitorear eventos y webhooks (estadísticas, diagnósticos)
6. Generar reportes operativos y de recaudación
7. Registrar multas por infracciones

Tienes acceso a las siguientes herramientas que DEBES usar cuando sea necesario:

📍 ESTACIONAMIENTO:
- buscar_espacios: Buscar espacios de estacionamiento disponibles por zona o tipo
- registrar_ingreso: Registrar entrada de un vehículo al estacionamiento
- registrar_salida: Registrar salida y calcular cobro del vehículo
- ver_ticket: Ver información detallada de un ticket activo
- consultar_tarifas: Ver tarifas activas del estacionamiento

👤 CLIENTES Y VEHÍCULOS:
- buscar_cliente: Buscar cliente por email, nombre o placa de vehículo
- historial_tickets: Ver historial de tickets de un cliente

💰 PAGOS Y REPORTES:
- procesar_pago: Procesar el pago de un ticket
- resumen_recaudacion: Ver resumen de ventas/recaudación por periodo
- reporte_operativo: Resumen operativo del día (ocupación, ingresos, rotación)

🚫 MULTAS:
- registrar_multa: Registrar una multa por infracción

🔗 B2B PARTNERS:
- registrar_partner: Registrar un nuevo partner B2B
- listar_partners: Listar todos los partners activos
- simular_evento_partner: Simular un evento webhook para un partner
- estadisticas_eventos: Ver estadísticas de webhooks enviados
- diagnosticar_webhook: Analizar webhooks fallidos

🖼️ CAPACIDADES MULTIMODALES:
- Puedo analizar imágenes de tickets, placas vehiculares, facturas y documentos
- Puedo extraer texto de PDFs (contratos, facturas, reportes)
- Si el usuario sube una foto de una placa, puedo leerla y buscar el vehículo
- Si sube un ticket, puedo extraer los datos y consultar su estado

Cuando el usuario pregunte algo que puedas resolver con una herramienta, ÚSALA.
Si el usuario sube una imagen o PDF, analiza su contenido para ayudarlo.
Responde siempre en español y de forma concisa pero útil.
Si no puedes hacer algo, explica por qué y sugiere alternativas.
Cuando muestres datos monetarios, usa el formato "Bs. XX.XX" para bolivianos.`;

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
    userContext?: UserContext,
  ): Promise<ChatMessage> {
    const session = this.getOrCreateSession(sessionId);
    
    // Guardar contexto de usuario en la sesión
    if (userContext) {
      session.userContext = userContext;
    }
    
    const startTime = Date.now();

    // Procesar archivos adjuntos si existen
    let processedFiles: ProcessedInput[] = [];
    let attachmentsInfo: ChatMessage['attachments'] = [];

    if (files && files.length > 0) {
      this.logger.log(`📁 Procesando ${files.length} archivos adjuntos`);
      for (const file of files) {
        this.logger.log(`📎 Archivo: ${file.filename} (${file.mimeType}, ${file.buffer.length} bytes)`);
        const processed = await this.multimodalProcessor.processFile(
          file.buffer,
          file.filename,
          file.mimeType,
        );
        this.logger.log(`✅ Procesado: tipo=${processed.type}, texto=${processed.extractedText?.length || 0} chars, error=${processed.error || 'ninguno'}`);
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
      
      // Detectar si hay PDFs para agregar instrucciones específicas
      const hasPdf = processedFiles.some(f => f.type === 'pdf');
      const pdfInstruction = hasPdf 
        ? '\n\n⚠️ INSTRUCCIÓN IMPORTANTE: El PDF ya fue procesado y su contenido está arriba. NO pidas el PDF en base64. Usa los datos extraídos (Nº Ticket, Placa, etc.) para buscar el ticket con la herramienta ver_ticket usando el ticketId o placa.'
        : '';
      
      userContent = `${content}\n\n--- Contenido de archivos adjuntos ---\n${fileContents}${pdfInstruction}`;
      
      this.logger.log(`📝 Mensaje construido con archivos (${userContent.length} chars)`);
      this.logger.log(`📄 Contenido extraído: ${fileContents.substring(0, 300)}...`);
    }

    // Agregar mensaje del usuario a la sesión (con contenido procesado de archivos)
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userContent, // Usar userContent que incluye el texto extraído de PDFs
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

    // Log del último mensaje que se enviará al LLM
    const lastMsg = llmMessages[llmMessages.length - 1];
    this.logger.log(`🤖 Último mensaje para LLM (${lastMsg.content.length} chars): ${lastMsg.content.substring(0, 400)}...`);

    // Obtener definiciones de herramientas según el rol del usuario
    const userRole = session.userContext?.role || 'user';
    const tools = this.mcpTools.getToolsDefinition(userRole);
    
    // Obtener system prompt dinámico según rol
    const systemPrompt = this.getSystemPromptForRole(userRole, session.userContext);

    // Generar respuesta inicial
    let response = await this.geminiAdapter.generateResponse(
      llmMessages,
      tools,
      systemPrompt,
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
        systemPrompt,
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
   * Genera system prompt según el rol del usuario
   */
  private getSystemPromptForRole(role: string, userContext?: UserContext): string {
    const isAdmin = role === 'admin' || role === 'operator';
    
    if (isAdmin) {
      return `Eres un asistente de administración para el Sistema de Gestión de Estacionamiento.

Tu rol es ayudar a los ADMINISTRADORES a:
1. **Reservar espacios** por placa de vehículo (registrar_ingreso)
2. **Desocupar espacios** y procesar salidas (registrar_salida)
3. Gestionar tickets y pagos
4. Buscar clientes y vehículos
5. Generar reportes operativos
6. Registrar multas
7. Administrar partners B2B
8. **Verificar tickets desde PDFs adjuntos**

HERRAMIENTAS DISPONIBLES PARA ADMIN:

🚗 GESTIÓN DE ESTACIONAMIENTO:
- registrar_ingreso: Reservar un espacio para un vehículo por su PLACA
- registrar_salida: Desocupar espacio y procesar el cobro
- buscar_espacios: Ver espacios disponibles por zona
- ver_ticket: Consultar detalles de un ticket

👤 CLIENTES Y VEHÍCULOS:
- buscar_cliente: Buscar cliente por email, nombre o placa
- historial_tickets: Ver historial completo de tickets

💰 PAGOS Y REPORTES:
- procesar_pago: Procesar pagos de tickets
- consultar_tarifas: Ver tarifas vigentes
- reporte_operativo: Resumen del día (ocupación, ingresos, etc.)

🚫 MULTAS:
- registrar_multa: Registrar multa por infracción

🔗 B2B PARTNERS:
- registrar_partner, listar_partners, estadisticas_eventos

📄 DOCUMENTOS PDF:
- verificar_ticket_pdf: Lee un PDF de ticket y valida contra la BD
- analizar_documento_pdf: Analiza documentos (licencias, registros, comprobantes)

IMPORTANTE PARA ARCHIVOS PDF:
- Cuando el usuario suba un PDF, el contenido ya está extraído en el mensaje.
- Si el PDF contiene datos de ticket (ID, placa, fecha, monto), extrae esos datos y usa ver_ticket o historial_tickets para verificar.
- NO pidas que envíen el PDF en base64 manualmente, ya tienes el contenido.

Cuando el admin diga "reservar [placa]" o "ingreso [placa]" → usa registrar_ingreso
Cuando diga "desocupar [placa]" o "salida [placa]" → usa registrar_salida
Cuando suba un PDF de ticket → extrae los datos y verifica con ver_ticket

Responde en español, de forma profesional y concisa.
Cuando muestres montos, usa "Bs. XX.XX"`;
    }
    
    // Usuario normal
    const userEmail = userContext?.userEmail ? ` (${userContext.userEmail})` : '';
    return `Eres un asistente amigable para usuarios del estacionamiento.

El usuario actual es: ${userContext?.userId || 'invitado'}${userEmail}

Tu rol es ayudar al USUARIO a:
1. **Ver espacios disponibles** en el estacionamiento
2. **Ver sus reservas actuales** (tickets activos)
3. **Consultar historial** de reservas anteriores
4. **Ver tarifas** del estacionamiento
5. **Verificar tickets** desde PDFs adjuntos

HERRAMIENTAS DISPONIBLES PARA USUARIO:

🅿️ ESPACIOS:
- buscar_espacios: Ver espacios disponibles por zona

📋 MIS RESERVAS:
- mis_reservas_activas: Ver reservas/tickets actuales del usuario
- mi_historial: Ver historial de reservas anteriores

💰 TARIFAS:
- consultar_tarifas: Ver precios del estacionamiento

📄 DOCUMENTOS:
- verificar_ticket_pdf: Verificar un ticket desde PDF adjunto

IMPORTANTE PARA ARCHIVOS PDF:
- Cuando el usuario suba un PDF, el contenido ya está extraído en el mensaje.
- Si el PDF contiene datos de ticket, extrae el ID o placa y verifica con mis_reservas_activas o mi_historial.
- NO pidas que envíen el PDF en base64 manualmente, ya tienes el contenido.

IMPORTANTE:
- NO puedes reservar espacios directamente, eso lo hace el admin
- Puedes ver TUS reservas, no las de otros usuarios
- Si el usuario quiere reservar, explica que debe ir a la entrada del estacionamiento

Responde en español, de forma amigable y útil.
Cuando muestres montos, usa "Bs. XX.XX"`;
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
