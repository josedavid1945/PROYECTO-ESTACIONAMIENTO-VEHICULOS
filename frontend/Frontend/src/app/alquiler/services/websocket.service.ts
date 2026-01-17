import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, timer, switchMap, tap, catchError, of, retry, delay } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces basadas en el servidor Go
export interface DashboardData {
  espacios_disponibles: number;
  espacios_ocupados: number;
  total_espacios: number;
  dinero_recaudado_hoy: number;
  dinero_recaudado_mes: number;
  vehiculos_activos: number;
  timestamp: string;
}

export interface EspacioDetalle {
  id: string;
  numero: string;
  estado: boolean;
  seccion_letra: string;
  vehiculo_placa?: string;
  hora_ingreso?: string;
}

export interface EspaciosPorSeccion {
  seccion_letra: string;
  total_espacios: number;
  espacios_disponibles: number;
  espacios_ocupados: number;
  espacios: EspacioDetalle[];
}

export interface EspacioOcupadoEvent {
  espacio_id: string;
  numero: string;
  vehiculo_placa: string;
  hora_ingreso: string;
}

export interface EspacioLiberadoEvent {
  espacio_id: string;
  numero: string;
  monto_pagado: number;
  hora_salida: string;
}

interface WebSocketMessage {
  type: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly destroyRef = inject(DestroyRef);
  
  // WebSocket configuration from environment
  private readonly WS_URL = environment.websocketUrl;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = environment.websocketReconnectAttempts;
  private readonly RECONNECT_DELAY = environment.websocketReconnectDelay;

  // Signals para datos en tiempo real
  readonly dashboardData = signal<DashboardData | null>(null);
  readonly espaciosPorSeccion = signal<EspaciosPorSeccion[]>([]);
  readonly espaciosDisponibles = signal<EspacioDetalle[]>([]);
  readonly isConnected = signal(false);
  readonly isReconnecting = signal(false);
  readonly connectionError = signal<string | null>(null);

  // Subjects para eventos
  private readonly espacioOcupadoSubject = new Subject<EspacioOcupadoEvent>();
  private readonly espacioLiberadoSubject = new Subject<EspacioLiberadoEvent>();
  
  readonly espacioOcupado$ = this.espacioOcupadoSubject.asObservable();
  readonly espacioLiberado$ = this.espacioLiberadoSubject.asObservable();

  constructor() {
    this.connect();
    
    this.destroyRef.onDestroy(() => {
      this.disconnect();
    });
  }

  /**
   * Coneccion al server de WebSocket
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket ya está conectado');
      return;
    }

    try {
      console.log('🔌 Conectando a WebSocket:', this.WS_URL);
      this.ws = new WebSocket(this.WS_URL);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket conectado');
        this.isConnected.set(true);
        this.isReconnecting.set(false);
        this.connectionError.set(null);
        this.reconnectAttempts = 0;
        
        this.requestDashboardData();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parseando mensaje WebSocket:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.connectionError.set('Error de conexión con el servidor');
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket cerrado:', event.code, event.reason);
        this.isConnected.set(false);
        
        // Intentar reconectar si no fue cierre intencional
        if (event.code !== 1000 && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.reconnect();
        } else if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
          this.connectionError.set('No se pudo reconectar al servidor. Por favor, recargue la página.');
        }
      };
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.connectionError.set('Error al iniciar conexión');
      this.reconnect();
    }
  }

  /**
   * Desconecta del servidor WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      console.log('👋 Cerrando conexión WebSocket');
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
      this.isConnected.set(false);
    }
  }

  /**
   * Intenta reconectar al WebSocket
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting.set(true);
    
    console.log(`🔄 Reintentando conexión (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`);
    
    timer(this.RECONNECT_DELAY).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.connect();
    });
  }

  /**
   * Maneja mensajes recibidos del servidor
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'dashboard_update':
        this.dashboardData.set(message.data);
        break;
        
      case 'espacios_por_seccion':
        this.espaciosPorSeccion.set(message.data);
        break;
        
      case 'espacios_disponibles':
        this.espaciosDisponibles.set(message.data);
        break;
        
      case 'espacio_ocupado':
        this.espacioOcupadoSubject.next(message.data);
        // Actualizar dashboard
        this.requestDashboardData();
        break;
        
      case 'espacio_liberado':
        this.espacioLiberadoSubject.next(message.data);
        // Actualizar dashboard
        this.requestDashboardData();
        break;
        
      case 'error':
        console.error('Error del servidor:', message.data);
        break;
        
      default:
        console.warn('Tipo de mensaje desconocido:', message.type);
    }
  }

  /**
   * Envía un mensaje al servidor WebSocket
   */
  private sendMessage(type: string, data?: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, data };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket no está conectado. No se puede enviar mensaje:', type);
    }
  }

  /**
   * Solicita datos del dashboard
   */
  requestDashboardData(): void {
    this.sendMessage('get_dashboard');
  }

  /**
   * Solicita espacios por sección
   */
  requestEspaciosPorSeccion(): void {
    this.sendMessage('get_espacios_por_seccion');
  }

  /**
   * Solicita espacios disponibles
   */
  requestEspaciosDisponibles(): void {
    this.sendMessage('get_espacios_disponibles');
  }

  /**
   * Solicita tickets activos
   */
  requestTicketsActivos(): void {
    this.sendMessage('get_tickets_activos');
  }
}
