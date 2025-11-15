import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebSocketService } from '../../../alquiler/services/websocket.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, CommonModule],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly wsService = inject(WebSocketService);

  // Señales del WebSocket
  readonly dashboardData = this.wsService.dashboardData;
  readonly isConnected = this.wsService.isConnected;
  readonly isReconnecting = this.wsService.isReconnecting;
  readonly connectionError = this.wsService.connectionError;

  // Computadas para mostrar datos formateados
  readonly espaciosDisponibles = computed(() => 
    this.dashboardData()?.espacios_disponibles ?? 0
  );

  readonly espaciosOcupados = computed(() => 
    this.dashboardData()?.espacios_ocupados ?? 0
  );

  readonly totalEspacios = computed(() => 
    this.dashboardData()?.total_espacios ?? 0
  );

  readonly dineroHoy = computed(() => 
    this.dashboardData()?.dinero_recaudado_hoy ?? 0
  );

  readonly dineroMes = computed(() => 
    this.dashboardData()?.dinero_recaudado_mes ?? 0
  );

  readonly vehiculosActivos = computed(() => 
    this.dashboardData()?.vehiculos_activos ?? 0
  );

  readonly porcentajeOcupacion = computed(() => {
    const total = this.totalEspacios();
    if (total === 0) return 0;
    return Math.round((this.espaciosOcupados() / total) * 100);
  });

  constructor() {
    // Efecto para mostrar notificaciones de eventos
    effect(() => {
      const data = this.dashboardData();
      if (data) {
        console.log('📊 Dashboard actualizado:', data);
      }
    });

    // Suscribirse a eventos de espacios
    this.wsService.espacioOcupado$.subscribe(event => {
      console.log('🚗 Espacio ocupado:', event);
      // Aquí podrías mostrar una notificación toast
    });

    this.wsService.espacioLiberado$.subscribe(event => {
      console.log('✅ Espacio liberado:', event);
      // Aquí podrías mostrar una notificación toast
    });
  }

  /**
   * Reintenta la conexión manualmente
   */
  retryConnection(): void {
    this.wsService.connect();
  }

  /**
   * Formatea un número como moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}
