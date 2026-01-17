import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/services/auth.service';

interface Ticket {
  id_ticket: number;
  placa: string;
  tipo_vehiculo: string;
  fecha_entrada: string;
  fecha_salida: string | null;
  estado: string;
  tarifa: number;
  espacio_codigo: string;
  seccion_nombre: string;
}

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-reservas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisReservasPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly API_URL = 'http://localhost:3000/api';

  reservas = signal<Ticket[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  
  filtroEstado = signal<string>('todos');
  
  // Computadas para filtrar reservas
  readonly reservasFiltradas = computed(() => {
    const filtro = this.filtroEstado();
    const todas = this.reservas();
    
    if (filtro === 'todos') return todas;
    return todas.filter(r => r.estado.toLowerCase() === filtro);
  });

  readonly reservasActivas = computed(() => 
    this.reservas().filter(r => r.estado.toLowerCase() === 'activo')
  );

  readonly totalGastado = computed(() => 
    this.reservas()
      .filter(r => r.tarifa)
      .reduce((acc, r) => acc + r.tarifa, 0)
  );

  ngOnInit(): void {
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Por ahora usamos datos de ejemplo - esto se conectaría al backend
    // cuando se implemente el endpoint de reservas por usuario
    setTimeout(() => {
      // Simular datos de reservas del usuario
      this.reservas.set([
        {
          id_ticket: 1001,
          placa: 'ABC-123',
          tipo_vehiculo: 'Auto',
          fecha_entrada: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          fecha_salida: null,
          estado: 'Activo',
          tarifa: 0,
          espacio_codigo: 'A-05',
          seccion_nombre: 'Sección A'
        },
        {
          id_ticket: 998,
          placa: 'ABC-123',
          tipo_vehiculo: 'Auto',
          fecha_entrada: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          fecha_salida: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          estado: 'Completado',
          tarifa: 5000,
          espacio_codigo: 'B-12',
          seccion_nombre: 'Sección B'
        },
        {
          id_ticket: 985,
          placa: 'XYZ-789',
          tipo_vehiculo: 'Moto',
          fecha_entrada: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          fecha_salida: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
          estado: 'Completado',
          tarifa: 2000,
          espacio_codigo: 'M-03',
          seccion_nombre: 'Motos'
        }
      ]);
      this.isLoading.set(false);
    }, 500);
  }

  cambiarFiltro(filtro: string): void {
    this.filtroEstado.set(filtro);
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  calcularDuracion(entrada: string, salida: string | null): string {
    const inicio = new Date(entrada).getTime();
    const fin = salida ? new Date(salida).getTime() : Date.now();
    const diff = fin - inicio;
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower === 'activo') {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (estadoLower === 'completado') {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (estadoLower === 'cancelado') {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  getVehiculoIcon(tipo: string): string {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('moto')) return '🏍️';
    if (tipoLower.includes('camion')) return '🚚';
    return '🚗';
  }
}
