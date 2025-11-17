import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface TipoVehiculo {
  id: string;
  categoria: string;
  descripcion: string;
}

interface EspacioDisponible {
  id: string;
  numero: string;
  estado: boolean;
}

interface FormData {
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente: string;
  placa: string;
  tipoVehiculoId: string;
  marca: string;
  modelo: string;
  espacioId: string;
}

@Component({
  selector: 'app-form-nuevo-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-nuevo-cliente.html'
})
export class FormNuevoClienteComponent {
  // Inputs
  formData = input.required<FormData>();
  tiposVehiculo = input.required<TipoVehiculo[]>();
  espacioSeleccionado = input<EspacioDisponible | null>(null);
  isLoading = input<boolean>(false);

  // Outputs
  espacioSeleccionClick = output<void>();
  cancelar = output<void>();
  registrar = output<void>();

  onAbrirModalEspacios() {
    this.espacioSeleccionClick.emit();
  }

  onCancelar() {
    this.cancelar.emit();
  }

  onRegistrar() {
    this.registrar.emit();
  }
}
