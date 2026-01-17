import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CreateEspaciosData {
  inicio: number;
  fin: number;
}

@Component({
  selector: 'app-modal-crear-espacios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-crear-espacios.html'
})
export class ModalCrearEspacios {
  isOpen = input.required<boolean>();
  letraSeccion = input.required<string>();
  
  close = output<void>();
  submit = output<CreateEspaciosData>();

  numeroInicio = signal(1);
  numeroFin = signal(10);

  onNumeroInicioChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value)) {
      this.numeroInicio.set(value);
    }
  }

  onNumeroFinChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(value)) {
      this.numeroFin.set(value);
    }
  }

  cantidadEspacios = computed(() => {
    const inicio = this.numeroInicio();
    const fin = this.numeroFin();
    return Math.max(0, fin - inicio + 1);
  });

  onSubmit(): void {
    const inicio = this.numeroInicio();
    const fin = this.numeroFin();

    if (inicio > fin) {
      alert('El número de inicio debe ser menor o igual al número final');
      return;
    }

    if (inicio < 1 || fin < 1) {
      alert('Los números deben ser mayores a 0');
      return;
    }

    this.submit.emit({ inicio, fin });
  }
}
