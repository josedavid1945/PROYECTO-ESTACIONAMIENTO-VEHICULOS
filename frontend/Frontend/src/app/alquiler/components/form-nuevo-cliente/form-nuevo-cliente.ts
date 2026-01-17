import { Component, input, output } from '@angular/core';
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
  imports: [CommonModule],
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
  updateFormData = output<Partial<FormData>>();

  onNombreClienteChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.updateFormData.emit({ nombreCliente: value });
  }

  onEmailClienteChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.updateFormData.emit({ emailCliente: value });
  }

  onTelefonoClienteChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.updateFormData.emit({ telefonoCliente: value });
  }

  onPlacaChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.updateFormData.emit({ placa: value });
  }

  onTipoVehiculoChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.updateFormData.emit({ tipoVehiculoId: value });
  }

  onMarcaChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.updateFormData.emit({ marca: value });
  }

  onModeloChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.updateFormData.emit({ modelo: value });
  }

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
