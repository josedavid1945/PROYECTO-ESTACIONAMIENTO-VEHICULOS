import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[];
  isError?: boolean;
}

export interface ChatResponse {
  sessionId: string;
  message: string;
  attachmentsProcessed?: number;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class B2bChatService {
  private readonly apiUrl: string;

  constructor(private http: HttpClient) {
    // URL del servicio B2B (puerto 3001)
    this.apiUrl = environment.b2bApiUrl || 'http://localhost:3001';
  }

  /**
   * Enviar mensaje de texto al chatbot
   */
  async sendMessage(
    message: string, 
    sessionId?: string | null,
    files?: File[]
  ): Promise<ChatResponse> {
    if (files && files.length > 0) {
      return this.sendMultimodalMessage(message, sessionId, files);
    }

    const response = await firstValueFrom(
      this.http.post<ChatResponse>(`${this.apiUrl}/mcp/chat`, {
        message,
        sessionId: sessionId || undefined
      })
    );

    return response;
  }

  /**
   * Enviar mensaje con archivos adjuntos
   */
  private async sendMultimodalMessage(
    message: string,
    sessionId: string | null | undefined,
    files: File[]
  ): Promise<ChatResponse> {
    const formData = new FormData();
    formData.append('message', message);
    
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    files.forEach(file => {
      formData.append('files', file, file.name);
    });

    const response = await firstValueFrom(
      this.http.post<ChatResponse>(`${this.apiUrl}/mcp/chat/multimodal`, formData)
    );

    return response;
  }

  /**
   * Obtener historial de una sesión
   */
  async getHistory(sessionId: string): Promise<{ sessionId: string; messages: any[] }> {
    return firstValueFrom(
      this.http.get<{ sessionId: string; messages: any[] }>(
        `${this.apiUrl}/mcp/session/${sessionId}/history`
      )
    );
  }

  /**
   * Crear nueva sesión
   */
  async createSession(): Promise<{ sessionId: string; createdAt: string }> {
    return firstValueFrom(
      this.http.post<{ sessionId: string; createdAt: string }>(
        `${this.apiUrl}/mcp/session/new`, 
        {}
      )
    );
  }

  /**
   * Obtener herramientas disponibles
   */
  async getTools(): Promise<{ tools: Tool[]; count: number }> {
    return firstValueFrom(
      this.http.get<{ tools: Tool[]; count: number }>(`${this.apiUrl}/mcp/tools`)
    );
  }

  /**
   * Ejecutar herramienta directamente
   */
  async executeTool(name: string, params: Record<string, any>): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/mcp/tools/${name}/execute`, params)
    );
  }

  /**
   * Obtener estadísticas del servicio
   */
  async getStats(): Promise<any> {
    return firstValueFrom(
      this.http.get(`${this.apiUrl}/mcp/stats`)
    );
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<{ status: string; services: any }> {
    return firstValueFrom(
      this.http.get<{ status: string; services: any }>(`${this.apiUrl}/health`)
    );
  }
}
