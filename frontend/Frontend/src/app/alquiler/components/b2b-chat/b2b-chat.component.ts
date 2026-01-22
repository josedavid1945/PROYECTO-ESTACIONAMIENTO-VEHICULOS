import { Component, OnInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { B2bChatService, ChatMessage } from './b2b-chat.service';

@Component({
  selector: 'app-b2b-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './b2b-chat.component.html',
  styleUrls: ['./b2b-chat.component.css']
})
export class B2bChatComponent implements OnInit {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  messages = signal<ChatMessage[]>([]);
  inputMessage = signal('');
  isLoading = signal(false);
  selectedFiles = signal<File[]>([]);
  sessionId = signal<string | null>(null);
  
  // Sugerencias rápidas para el usuario
  quickActions = [
    { label: 'Espacios', prompt: '¿Cuántos espacios de estacionamiento hay disponibles?' },
    { label: 'Recaudación', prompt: 'Dame un resumen de la recaudación de hoy' },
    { label: 'Tickets activos', prompt: '¿Cuántos tickets activos hay en el sistema?' },
    { label: 'Partners', prompt: 'Lista los partners B2B registrados' },
    { label: 'Eventos', prompt: 'Muéstrame las estadísticas de eventos webhook' },
    { label: 'Herramientas', prompt: '¿Qué herramientas tienes disponibles?' },
  ];

  hasMessages = computed(() => this.messages().length > 0);

  constructor(private chatService: B2bChatService) {}

  ngOnInit(): void {
    // Mensaje de bienvenida
    this.messages.update(msgs => [...msgs, {
      role: 'assistant',
      content: `Hola, soy el asistente del sistema B2B de estacionamiento.

Puedo ayudarte con:
• **Consultar espacios** disponibles y ocupados
• **Ver tickets** y información de vehículos
• **Gestionar partners B2B** y sus webhooks
• **Analizar recaudación** y estadísticas
• **Simular eventos** para testing
• **Diagnosticar webhooks** con problemas

También puedo analizar **imágenes** (placas, tickets) y **documentos PDF**.

¿En qué puedo ayudarte?`,
      timestamp: new Date()
    }]);
  }

  async sendMessage(): Promise<void> {
    const message = this.inputMessage().trim();
    const files = this.selectedFiles();
    
    if (!message && files.length === 0) return;

    // Agregar mensaje del usuario
    this.messages.update(msgs => [...msgs, {
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: files.map(f => f.name)
    }]);

    this.inputMessage.set('');
    this.isLoading.set(true);

    try {
      const response = await this.chatService.sendMessage(
        message,
        this.sessionId(),
        files.length > 0 ? files : undefined
      );

      this.sessionId.set(response.sessionId);

      this.messages.update(msgs => [...msgs, {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }]);

      this.clearFiles();
      this.scrollToBottom();
    } catch (error: any) {
      this.messages.update(msgs => [...msgs, {
        role: 'assistant',
        content: `Error: ${error.message || 'No se pudo procesar tu mensaje'}`,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      this.isLoading.set(false);
    }
  }

  useQuickAction(prompt: string): void {
    this.inputMessage.set(prompt);
    this.sendMessage();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      const validFiles = files.filter(f => 
        f.type.startsWith('image/') || 
        f.type === 'application/pdf'
      );
      
      if (validFiles.length !== files.length) {
        alert('Solo se permiten imágenes y archivos PDF');
      }
      
      this.selectedFiles.set(validFiles);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.messages.set([]);
    this.sessionId.set(null);
    this.ngOnInit(); // Reiniciar con mensaje de bienvenida
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messageContainer) {
        const el = this.messageContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }

  formatMessage(content: string): string {
    // Convertir markdown básico a HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
}
