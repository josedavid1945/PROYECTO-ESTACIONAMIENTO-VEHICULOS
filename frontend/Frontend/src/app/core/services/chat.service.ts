import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, catchError, of, tap } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { TicketPdfService, TicketData } from './ticket-pdf.service';
import { environment } from '../../../environments/environment';

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
  isLoading?: boolean;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
}

export interface SendMessageResponse {
  success: boolean;
  message?: ChatMessage;
  sessionId?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = `${environment.b2bApiUrl}/mcp`;
  private authService = inject(AuthService);
  private ticketPdfService = inject(TicketPdfService);
  
  // Signal para almacenar el último ticket generado (para descarga posterior)
  private _lastGeneratedTicket = signal<TicketData | null>(null);
  lastGeneratedTicket = computed(() => this._lastGeneratedTicket());
  
  // Signals para estado reactivo
  private _messages = signal<ChatMessage[]>([]);
  private _isLoading = signal(false);
  private _isChatOpen = signal(false);
  private _sessionId = signal<string | null>(null);
  private _unreadCount = signal(0);

  // Computed signals
  messages = computed(() => this._messages());
  isLoading = computed(() => this._isLoading());
  isChatOpen = computed(() => this._isChatOpen());
  sessionId = computed(() => this._sessionId());
  unreadCount = computed(() => this._unreadCount());

  // Subject para nuevos mensajes
  private newMessage$ = new Subject<ChatMessage>();

  constructor(private http: HttpClient) {
    // Cargar sesión previa si existe
    this.loadSession();
  }

  /**
   * Carga sesión de localStorage
   */
  private loadSession(): void {
    const savedSession = localStorage.getItem('chat_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        this._sessionId.set(session.id);
        this._messages.set(session.messages || []);
      } catch {
        localStorage.removeItem('chat_session');
      }
    }
  }

  /**
   * Guarda sesión en localStorage
   */
  private saveSession(): void {
    const session = {
      id: this._sessionId(),
      messages: this._messages(),
      lastActivity: new Date()
    };
    localStorage.setItem('chat_session', JSON.stringify(session));
  }

  /**
   * Abre/cierra el chat
   */
  toggleChat(): void {
    this._isChatOpen.update(v => !v);
    if (this._isChatOpen()) {
      this._unreadCount.set(0);
    }
  }

  openChat(): void {
    this._isChatOpen.set(true);
    this._unreadCount.set(0);
  }

  closeChat(): void {
    this._isChatOpen.set(false);
  }

  /**
   * Envía un mensaje al asistente
   */
  async sendMessage(content: string, files?: File[]): Promise<void> {
    if (!content.trim() && (!files || files.length === 0)) return;

    this._isLoading.set(true);

    // Agregar mensaje del usuario inmediatamente
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      attachments: files?.map(f => ({
        type: f.type,
        name: f.name
      }))
    };
    
    this._messages.update(msgs => [...msgs, userMessage]);

    // Agregar mensaje de carga del asistente
    const loadingMessage: ChatMessage = {
      id: `loading_${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    this._messages.update(msgs => [...msgs, loadingMessage]);

    try {
      // Preparar FormData para archivos
      const formData = new FormData();
      formData.append('content', content.trim());
      
      if (this._sessionId()) {
        formData.append('sessionId', this._sessionId()!);
      }

      // Enviar rol del usuario para filtrar herramientas
      const userRole = this.authService.userRole() || 'user';
      const userId = this.authService.currentUser()?.id;
      const userEmail = this.authService.currentUser()?.email;
      
      formData.append('userRole', userRole);
      if (userId) formData.append('userId', userId);
      if (userEmail) formData.append('userEmail', userEmail);

      if (files) {
        files.forEach(file => formData.append('files', file));
      }

      // Llamar al endpoint del chatbot
      const response = await this.http.post<any>(
        `${this.apiUrl}/chat`,
        formData
      ).toPromise();

      // Remover mensaje de carga
      this._messages.update(msgs => 
        msgs.filter(m => m.id !== loadingMessage.id)
      );

      if (response.success && response.message) {
        // Agregar respuesta del asistente
        const assistantMessage: ChatMessage = {
          ...response.message,
          timestamp: new Date(response.message.timestamp)
        };
        
        this._messages.update(msgs => [...msgs, assistantMessage]);
        this._sessionId.set(response.sessionId);

        // 🎫 Detectar si fue un registro de vehículo exitoso y generar PDF
        this.checkAndGenerateTicketPdf(response);

        // Notificar si el chat está cerrado
        if (!this._isChatOpen()) {
          this._unreadCount.update(n => n + 1);
        }

        this.newMessage$.next(assistantMessage);
      } else {
        // Error en respuesta
        this.addErrorMessage(response.error || 'Error desconocido');
      }

      this.saveSession();

    } catch (error: any) {
      // Remover mensaje de carga
      this._messages.update(msgs => 
        msgs.filter(m => m.id !== loadingMessage.id)
      );

      this.addErrorMessage(
        error.error?.message || 
        error.message || 
        'No se pudo conectar con el asistente'
      );
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Agrega mensaje de error
   */
  private addErrorMessage(errorText: string): void {
    const errorMessage: ChatMessage = {
      id: `error_${Date.now()}`,
      role: 'assistant',
      content: `⚠️ ${errorText}. Por favor intenta de nuevo.`,
      timestamp: new Date()
    };
    this._messages.update(msgs => [...msgs, errorMessage]);
  }

  /**
   * Limpia el historial de chat
   */
  clearHistory(): void {
    this._messages.set([]);
    this._sessionId.set(null);
    localStorage.removeItem('chat_session');
  }

  /**
   * Crea nueva sesión
   */
  async startNewSession(): Promise<void> {
    this.clearHistory();
    
    const isAdmin = this.authService.isAdmin() || this.authService.isOperator();
    
    // Mensaje de bienvenida según rol
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: isAdmin 
        ? `Hola, soy tu asistente de administración de estacionamiento.

Puedo ayudarte con:
• **Reservar espacios** por placa de vehículo
• **Desocupar espacios** y registrar salidas
• Ver y gestionar todos los tickets
• Procesar pagos
• Buscar información de clientes
• Generar reportes operativos
• Analizar imágenes de placas o tickets
• Registrar multas

¿En qué puedo ayudarte?`
        : `Hola, soy tu asistente de estacionamiento.

Puedo ayudarte con:
• **Ver espacios disponibles**
• **Ver tus reservas actuales**
• **Consultar tu historial** de reservas anteriores
• Consultar tarifas

¿En qué puedo ayudarte?`,
      timestamp: new Date()
    };
    
    this._messages.set([welcomeMessage]);
  }

  /**
   * Observable para suscribirse a nuevos mensajes
   */
  onNewMessage(): Observable<ChatMessage> {
    return this.newMessage$.asObservable();
  }

  /**
   * Envía mensaje rápido (sin archivos)
   */
  async quickMessage(content: string): Promise<void> {
    return this.sendMessage(content);
  }

  /**
   * Detecta si la respuesta contiene un registro de vehículo exitoso y genera el PDF
   */
  private checkAndGenerateTicketPdf(response: any): void {
    try {
      // Verificar si hay toolExecution con registrar_ingreso exitoso
      const toolExec = response.message?.toolExecution;
      
      if (toolExec?.toolName === 'registrar_ingreso' && toolExec?.output?.success) {
        const ticketData = this.ticketPdfService.extractTicketDataFromResponse(toolExec.output);
        
        if (ticketData) {
          // Guardar el ticket para posible descarga posterior
          this._lastGeneratedTicket.set(ticketData);
          
          // Generar y descargar el PDF automáticamente
          this.ticketPdfService.generateTicketPdf(ticketData);
          
          // Agregar mensaje informando que se descargó el PDF
          const pdfMessage: ChatMessage = {
            id: `pdf_${Date.now()}`,
            role: 'assistant',
            content: `📄 **Ticket PDF generado automáticamente**\n\nSe ha descargado el ticket de ingreso para el vehículo **${ticketData.placa}** en el espacio **${ticketData.espacio}**.\n\n_Si no se descargó automáticamente, puedes escribir "descargar ticket" para obtenerlo nuevamente._`,
            timestamp: new Date()
          };
          
          this._messages.update(msgs => [...msgs, pdfMessage]);
        }
      }
    } catch (error) {
      console.error('Error al generar PDF del ticket:', error);
    }
  }

  /**
   * Descarga el último ticket generado
   */
  downloadLastTicket(): boolean {
    const ticket = this._lastGeneratedTicket();
    if (ticket) {
      this.ticketPdfService.generateTicketPdf(ticket);
      return true;
    }
    return false;
  }
}
