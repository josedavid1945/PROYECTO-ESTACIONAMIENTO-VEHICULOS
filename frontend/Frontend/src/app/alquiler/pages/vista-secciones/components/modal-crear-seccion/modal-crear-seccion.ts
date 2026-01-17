import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-crear-seccion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-crear-seccion.html'
})
export class ModalCrearSeccion {
  isOpen = input.required<boolean>();
  
  close = output<void>();
  submit = output<string>();

  letraSeccion = signal('');

  onLetraChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.letraSeccion.set(value);
  }

  onSubmit(): void {
    const letra = this.letraSeccion().trim().toUpperCase();
    if (letra) {
      this.submit.emit(letra);
      this.letraSeccion.set('');
    }
  }
}
