import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Ticket {
  id: string;
  fechaIngreso: string;
}

interface Vehiculo {
  placa: string;
  marca: string;
  modelo: string;
}

interface Espacio {
  numero: string;
}

interface Cliente {
  nombre: string;
}

interface VehiculoOcupado {
  ticket: Ticket;
  vehiculo: Vehiculo;
  espacio: Espacio;
  cliente: Cliente;
}

interface FormData {
  ticketId: string;
  metodoPago: string;
  montoPago: number;
  tipoTarifaId: string;
}

interface TipoTarifa {
  id: string;
  tipoTarifa: string;
  precioHora: number;
  precioDia: number;
}

@Component({
  selector: 'app-form-desocupar-espacio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-desocupar-espacio.html'
})
export class FormDesocuparEspacioComponent {
  // Inputs
  formData = input.required<FormData>();
  vehiculosOcupados = input.required<VehiculoOcupado[]>();
  tiposTarifa = input.required<TipoTarifa[]>();
  isLoading = input<boolean>(false);

  // Outputs
  seleccionarVehiculo = output<string>();
  cancelar = output<void>();
  confirmar = output<void>();

  onSeleccionarVehiculo(ticketId: string) {
    this.seleccionarVehiculo.emit(ticketId);
  }

  onCancelar() {
    this.cancelar.emit();
  }

  onConfirmar() {
    this.confirmar.emit();
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calcularTiempoEstadia(fechaIngreso: string): string {
    const ahora = new Date();
    const ingreso = new Date(fechaIngreso);
    const diferencia = ahora.getTime() - ingreso.getTime();

    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos}m`;
  }
}
