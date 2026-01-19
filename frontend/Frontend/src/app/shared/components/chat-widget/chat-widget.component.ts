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
      <span class="chat-icon">💬</span>
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
          <span class="assistant-avatar">🤖</span>
          <div class="assistant-info">
            <span class="assistant-name">Asistente de Estacionamiento</span>
            <span class="assistant-status">{{ chatService.isLoading() ? 'Escribiendo...' : 'En línea' }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button (click)="toggleMinimize()" class="header-btn" title="Minimizar">
            {{ isMinimized() ? '🔼' : '🔽' }}
          </button>
          <button (click)="startNewChat()" class="header-btn" title="Nueva conversación">
            🔄
          </button>
          <button (click)="chatService.closeChat()" class="header-btn close-btn" title="Cerrar">
            ✕
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
          <div class="message-avatar">
            {{ message.role === 'user' ? '👤' : '🤖' }}
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
                <summary>🔧 {{ message.toolExecution.toolName }} ({{ message.toolExecution.duration }}ms)</summary>
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
            <span>{{ getAttachmentIcon(file.type) }} {{ file.name }}</span>
            <button (click)="removeFile(i)" class="remove-file">✕</button>
          </div>
        </div>

        <div class="input-container">
          <button 
            (click)="fileInput.click()" 
            class="attach-btn"
            title="Adjuntar archivo"
          >
            📎
          </button>
          
          <input 
            #fileInput
            type="file"
            multiple
            accept="image/*,.pdf,.txt"
            (change)="onFileSelect($event)"
            style="display: none"
            class="text-gray-600"
          >
          
          <textarea
          
            [(ngModel)]="inputMessage"
            (keydown.enter)="onEnterKey($any($event))"
            placeholder="Escribe un mensaje..."
            rows="1"
            [disabled]="chatService.isLoading()"
            class="text-gray-600"
          ></textarea>
          
          <button 
            (click)="sendMessage()"
            class="send-btn"
            [disabled]="chatService.isLoading() || (!inputMessage.trim() && selectedFiles().length === 0)"
          >
            {{ chatService.isLoading() ? '⏳' : '📤' }}
          </button>
        </div>

        <!-- Sugerencias rápidas -->
        <div class="quick-actions">
          <button (click)="quickAction('¿Cuántos espacios hay disponibles?')" class="text-gray-600">🅿️ Espacios</button>
          <button (click)="quickAction('Muéstrame el reporte de hoy')" class="text-gray-600">📊 Reporte</button>
          <button (click)="quickAction('¿Cuáles son las tarifas?')" class="text-gray-600">💰 Tarifas</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Botón flotante */
    .chat-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s, box-shadow 0.3s;
      z-index: 9999;
    }

    .chat-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
    }

    .chat-fab.has-unread {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .chat-icon {
      font-size: 28px;
    }

    .unread-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #ef4444;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    /* Ventana del chat */
    .chat-window {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 400px;
      max-width: calc(100vw - 48px);
      height: 600px;
      max-height: calc(100vh - 100px);
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
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

    /* Header */
    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
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
      font-size: 32px;
    }

    .assistant-info {
      display: flex;
      flex-direction: column;
    }

    .assistant-name {
      font-weight: 600;
      font-size: 14px;
    }

    .assistant-status {
      font-size: 12px;
      opacity: 0.9;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .header-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .header-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .close-btn:hover {
      background: rgba(239, 68, 68, 0.8);
    }

    /* Mensajes */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #f8fafc;
    }

    .message {
      display: flex;
      gap: 12px;
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
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .message-content {
      background: white;
      padding: 12px 16px;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      color: #4b5563; /* text-gray-600 */
    }

    .message.user .message-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .message-text {
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: #4b5563; /* text-gray-600 */
    }

    .message-time {
      font-size: 10px;
      opacity: 0.6;
      margin-top: 6px;
      text-align: right;
    }

    /* Typing indicator */
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 8px 0;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #667eea;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Attachments */
    .message-attachments {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .attachment {
      background: rgba(0, 0, 0, 0.05);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .tool-info {
      margin-top: 8px;
      font-size: 11px;
    }

    .tool-info details {
      background: #f1f5f9;
      padding: 6px 10px;
      border-radius: 6px;
    }

    .tool-info summary {
      cursor: pointer;
      font-weight: 500;
    }

    .tool-info pre {
      margin-top: 8px;
      padding: 8px;
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 10px;
      max-height: 150px;
    }

    /* Input */
    .chat-input {
      border-top: 1px solid #e2e8f0;
      padding: 12px;
      background: white;
    }

    .selected-files {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }

    .selected-file {
      background: #e0e7ff;
      color: #4338ca;
      padding: 4px 10px;
      border-radius: 16px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .remove-file {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      opacity: 0.7;
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
      font-size: 18px;
      transition: all 0.2s;
    }

    .attach-btn {
      background: #f1f5f9;
    }

    .attach-btn:hover {
      background: #e2e8f0;
    }

    .send-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    textarea {
      flex: 1;
      resize: none;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      font-family: inherit;
      font-size: 14px;
      max-height: 100px;
      overflow-y: auto;
    }

    textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    /* Quick actions */
    .quick-actions {
      display: flex;
      gap: 6px;
      margin-top: 10px;
      flex-wrap: wrap;
    }

    .quick-actions button {
      background: #f1f5f9;
      border: none;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quick-actions button:hover {
      background: #e0e7ff;
      color: #4338ca;
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
