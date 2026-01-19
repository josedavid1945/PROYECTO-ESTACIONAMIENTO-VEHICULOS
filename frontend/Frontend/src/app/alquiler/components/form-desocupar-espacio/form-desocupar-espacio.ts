import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculoOcupado } from '../../services/registro.service';
import { TipoTarifa } from '../../services/herramientas.service';

interface FormData {
  ticketId: string;
  metodoPago: string;
  montoPago: number;
  tipoTarifaId: string;
}

@Component({
  selector: 'app-form-desocupar-espacio',
  standalone: true,
  imports: [CommonModule],
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
  updateFormData = output<Partial<FormData>>();

  onSeleccionarVehiculo(ticketId: string) {
    this.seleccionarVehiculo.emit(ticketId);
  }

  onTicketChange(ticketId: string) {
    this.updateFormData.emit({ ticketId });
  }

  onMetodoPagoChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFormData.emit({ metodoPago: value });
  }

  onMontoPagoChange(event: Event) {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.updateFormData.emit({ montoPago: value });
  }

  onTipoTarifaChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFormData.emit({ tipoTarifaId: value });
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
