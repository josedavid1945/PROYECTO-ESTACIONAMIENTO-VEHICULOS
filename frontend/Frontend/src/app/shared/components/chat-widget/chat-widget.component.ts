import { Component, inject, signal, ViewChild, ElementRef, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../../core/services/chat.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Botón flotante del chat -->
    <button 
      *ngIf="!chatService.isChatOpen()"
      (click)="chatService.openChat()"
      class="chat-fab"
      [class.has-unread]="chatService.unreadCount() > 0"
    >
      <svg class="chat-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span *ngIf="chatService.unreadCount() > 0" class="unread-badge">
        {{ chatService.unreadCount() }}
      </span>
    </button>

    <!-- Ventana del chat -->
    <div 
      *ngIf="chatService.isChatOpen()"
      class="chat-window"
      [class.minimized]="isMinimized()"
    >
      <!-- Header -->
      <div class="chat-header">
        <div class="header-info">
          <div class="assistant-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            </svg>
          </div>
          <div class="assistant-info">
            <span class="assistant-name">Asistente IA</span>
            <span class="assistant-status">
              <span class="status-dot" [class.active]="!chatService.isLoading()"></span>
              {{ chatService.isLoading() ? 'Procesando...' : 'En línea' }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button (click)="toggleMinimize()" class="header-btn" [title]="isMinimized() ? 'Expandir' : 'Minimizar'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="isMinimized()" d="M18 15l-6-6-6 6"></path>
              <path *ngIf="!isMinimized()" d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
          <button (click)="startNewChat()" class="header-btn" title="Nueva conversación">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M8 16H3v5"></path>
            </svg>
          </button>
          <button (click)="chatService.closeChat()" class="header-btn close-btn" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mensajes -->
      <div 
        *ngIf="!isMinimized()"
        class="chat-messages" 
        #messagesContainer
      >
        <div 
          *ngFor="let message of chatService.messages()" 
          class="message"
          [class.user]="message.role === 'user'"
          [class.assistant]="message.role === 'assistant'"
          [class.tool]="message.role === 'tool'"
          [class.loading]="message.isLoading"
        >
          <!-- Avatar -->
          <div class="message-avatar" [class.user-avatar]="message.role === 'user'">
            <svg *ngIf="message.role === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <svg *ngIf="message.role !== 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            </svg>
          </div>
          
          <!-- Contenido -->
          <div class="message-content">
            <!-- Loading indicator -->
            <div *ngIf="message.isLoading" class="typing-indicator">
              <span></span><span></span><span></span>
            </div>

            <!-- Texto del mensaje -->
            <div *ngIf="!message.isLoading" class="message-text" [innerHTML]="formatMessage(message.content)">
            </div>

            <!-- Adjuntos -->
            <div *ngIf="message.attachments?.length" class="message-attachments">
              <div *ngFor="let att of message.attachments" class="attachment">
                <span class="att-icon">{{ getAttachmentIcon(att.type) }}</span>
                <span class="att-name">{{ att.name }}</span>
              </div>
            </div>

            <!-- Info de herramienta ejecutada -->
            <div *ngIf="message.toolExecution" class="tool-info">
              <details>
                <summary>{{ message.toolExecution.toolName }} ({{ message.toolExecution.duration }}ms)</summary>
                <pre>{{ message.toolExecution.output | json }}</pre>
              </details>
            </div>

            <!-- Timestamp -->
            <div class="message-time">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div *ngIf="!isMinimized()" class="chat-input">
        <!-- Archivos seleccionados -->
        <div *ngIf="selectedFiles().length > 0" class="selected-files">
          <div *ngFor="let file of selectedFiles(); let i = index" class="selected-file">
            <span>{{ file.name }}</span>
            <button (click)="removeFile(i)" class="remove-file">×</button>
          </div>
        </div>

        <div class="input-container">
          <button 
            (click)="fileInput.click()" 
            class="attach-btn"
            title="Adjuntar archivo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          
          <input 
            #fileInput
            type="file"
            multiple
            accept="image/*,.pdf,.txt"
            (change)="onFileSelect($event)"
            style="display: none"
          >
          
          <textarea
            [(ngModel)]="inputMessage"
            (keydown.enter)="onEnterKey($any($event))"
            placeholder="Escribe un mensaje..."
            rows="1"
            [disabled]="chatService.isLoading()"
          ></textarea>
          
          <button 
            (click)="sendMessage()"
            class="send-btn"
            [disabled]="chatService.isLoading() || (!inputMessage.trim() && selectedFiles().length === 0)"
          >
            <svg *ngIf="!chatService.isLoading()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
            <div *ngIf="chatService.isLoading()" class="loading-spinner"></div>
          </button>
        </div>

        <!-- Sugerencias rápidas -->
        <div class="quick-actions">
          <button (click)="quickAction('¿Cuántos espacios hay disponibles?')">Espacios</button>
          <button (click)="quickAction('Muéstrame el reporte de hoy')">Reporte</button>
          <button (click)="quickAction('¿Cuáles son las tarifas?')">Tarifas</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Botón flotante - Dark Mode */
    .chat-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 9999;
    }

    .chat-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 30px rgba(59, 130, 246, 0.25);
      border-color: rgba(59, 130, 246, 0.5);
    }

    .chat-fab.has-unread {
      animation: pulse-glow 2s infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.15); }
      50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(59, 130, 246, 0.4); }
    }

    .chat-icon-svg {
      width: 24px;
      height: 24px;
      color: #3b82f6;
    }

    .unread-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      min-width: 20px;
      height: 20px;
      border-radius: 10px;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      padding: 0 6px;
    }

    /* Ventana del chat - Dark Mode */
    .chat-window {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 380px;
      max-width: calc(100vw - 48px);
      height: 560px;
      max-height: calc(100vh - 100px);
      background: #0f172a;
      border-radius: 16px;
      border: 1px solid rgba(59, 130, 246, 0.2);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      z-index: 10000;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }

    .chat-window.minimized {
      height: auto;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Header - Dark Mode */
    .chat-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-bottom: 1px solid rgba(59, 130, 246, 0.15);
      color: white;
      padding: 14px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .assistant-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .assistant-avatar svg {
      width: 22px;
      height: 22px;
      color: white;
    }

    .assistant-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .assistant-name {
      font-weight: 600;
      font-size: 14px;
      color: #f1f5f9;
    }

    .assistant-status {
      font-size: 12px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #64748b;
    }

    .status-dot.active {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }

    .header-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      color: #94a3b8;
    }

    .header-btn svg {
      width: 16px;
      height: 16px;
    }

    .header-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f1f5f9;
    }

    .close-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }

    /* Mensajes - Dark Mode */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      background: #0f172a;
    }

    .chat-messages::-webkit-scrollbar {
      width: 5px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.3);
      border-radius: 3px;
    }

    .message {
      display: flex;
      gap: 10px;
      max-width: 85%;
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message.assistant {
      align-self: flex-start;
    }

    .message.tool {
      align-self: flex-start;
      opacity: 0.7;
      font-size: 12px;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
    }

    .message-avatar.user-avatar {
      background: linear-gradient(135deg, #334155 0%, #475569 100%);
    }

    .message-avatar svg {
      width: 18px;
      height: 18px;
      color: white;
    }

    .message-content {
      background: #1e293b;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .message.user .message-content {
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      border: none;
    }

    .message-text {
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: #e2e8f0;
      font-size: 14px;
    }

    .message.user .message-text {
      color: white;
    }

    .message-time {
      font-size: 10px;
      color: #64748b;
      margin-top: 6px;
      text-align: right;
    }

    .message.user .message-time {
      color: rgba(255, 255, 255, 0.6);
    }

    /* Typing indicator */
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }

    .typing-indicator span {
      width: 6px;
      height: 6px;
      background: #3b82f6;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Attachments */
    .message-attachments {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .attachment {
      background: rgba(59, 130, 246, 0.15);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      color: #94a3b8;
    }

    .tool-info {
      margin-top: 8px;
      font-size: 11px;
    }

    .tool-info details {
      background: rgba(0, 0, 0, 0.3);
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .tool-info summary {
      cursor: pointer;
      font-weight: 500;
      color: #64748b;
    }

    .tool-info pre {
      margin-top: 8px;
      padding: 8px;
      background: #020617;
      color: #94a3b8;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 10px;
      max-height: 120px;
    }

    /* Input - Dark Mode */
    .chat-input {
      border-top: 1px solid rgba(59, 130, 246, 0.15);
      padding: 12px;
      background: #1e293b;
    }

    .selected-files {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }

    .selected-file {
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .remove-file {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: #ef4444;
      line-height: 1;
      padding: 0;
    }

    .input-container {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }

    .attach-btn, .send-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .attach-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
    }

    .attach-btn svg {
      width: 18px;
      height: 18px;
    }

    .attach-btn:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: #3b82f6;
    }

    .send-btn {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
    }

    .send-btn svg {
      width: 18px;
      height: 18px;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .loading-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    textarea {
      flex: 1;
      resize: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 10px 14px;
      font-family: inherit;
      font-size: 14px;
      max-height: 100px;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.2);
      color: #e2e8f0;
      transition: all 0.2s;
    }

    textarea::placeholder {
      color: #64748b;
    }

    textarea:focus {
      outline: none;
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    /* Quick actions */
    .quick-actions {
      display: flex;
      gap: 6px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .quick-actions button {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-actions button:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.3);
      color: #93c5fd;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .chat-window {
        width: 100%;
        height: 100%;
        max-height: 100vh;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }

      .chat-fab {
        bottom: 16px;
        right: 16px;
      }
    }
  `]
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  chatService = inject(ChatService);
  
  inputMessage = '';
  selectedFiles = signal<File[]>([]);
  isMinimized = signal(false);

  private shouldScroll = false;

  ngOnInit(): void {
    // Iniciar sesión si está vacía
    if (this.chatService.messages().length === 0) {
      this.chatService.startNewSession();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleMinimize(): void {
    this.isMinimized.update(v => !v);
  }

  startNewChat(): void {
    if (confirm('¿Iniciar nueva conversación? Se borrará el historial actual.')) {
      this.chatService.startNewSession();
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.selectedFiles.update(files => [...files, ...newFiles]);
    }
    input.value = ''; // Reset para permitir seleccionar el mismo archivo
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  onEnterKey(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage(): Promise<void> {
    const content = this.inputMessage.trim();
    const files = this.selectedFiles();

    if (!content && files.length === 0) return;

    this.inputMessage = '';
    this.selectedFiles.set([]);
    this.shouldScroll = true;

    await this.chatService.sendMessage(content, files.length > 0 ? files : undefined);
    this.shouldScroll = true;
  }

  quickAction(message: string): void {
    this.inputMessage = message;
    this.sendMessage();
  }

  formatMessage(content: string): string {
    if (!content) return '';
    
    // Convertir saltos de línea
    let formatted = content.replace(/\n/g, '<br>');
    
    // Convertir listas con bullets
    formatted = formatted.replace(/• /g, '&#8226; ');
    
    // Convertir emojis de markdown básico
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return formatted;
  }

  formatTime(timestamp: Date | string): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  getAttachmentIcon(type: string): string {
    if (type?.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type?.startsWith('audio/')) return '🎵';
    if (type?.startsWith('text/')) return '📝';
    return '📎';
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch { }
  }
}
