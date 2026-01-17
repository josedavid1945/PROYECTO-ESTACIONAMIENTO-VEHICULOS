import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  vehiculos: Vehiculo[];
}

interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
}

interface EspacioDisponible {
  id: string;
  numero: string;
  estado: boolean;
}

interface FormData {
  vehiculoId: string;
  espacioId: string;
}

@Component({
  selector: 'app-form-asignar-espacio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-asignar-espacio.html'
})
export class FormAsignarEspacioComponent {
  // Inputs
  formData = input.required<FormData>();
  clientesConVehiculos = input.required<Cliente[]>();
  espacioSeleccionado = input<EspacioDisponible | null>(null);
  clienteExpandido = input<string | null>(null);
  isLoading = input<boolean>(false);

  // Outputs
  toggleCliente = output<string>();
  espacioSeleccionClick = output<void>();
  cancelar = output<void>();
  confirmar = output<void>();
  updateVehiculoId = output<string>();

  onToggleCliente(clienteId: string) {
    this.toggleCliente.emit(clienteId);
  }

  onVehiculoChange(vehiculoId: string) {
    this.updateVehiculoId.emit(vehiculoId);
  }

  onAbrirModalEspacios() {
    this.espacioSeleccionClick.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }

  onConfirmar() {
    this.confirmar.emit();
  }
}
