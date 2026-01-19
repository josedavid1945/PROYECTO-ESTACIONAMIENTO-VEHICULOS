import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HerramientasService } from '../../../../../services/herramientas.service';

@Component({
  selector: 'app-register-multa',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-multa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterMulta {
  private fb = inject(FormBuilder);
  private herramientasService = inject(HerramientasService);
  private router = inject(Router);

  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  multaForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    monto: [0, [Validators.required, Validators.min(0.01)]]
  });

  onSubmit(): void {
    if (this.multaForm.invalid) {
      this.multaForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const { nombre, monto } = this.multaForm.value;

    this.herramientasService.createMulta(nombre, monto).subscribe({
      next: () => {
        this.success.set(true);
        this.multaForm.reset();
        setTimeout(() => {
          this.router.navigate(['/admin/estacionamiento/herramientas/config/multas']);
        }, 1500);
      },
      error: (err) => {
        this.error.set('Error al crear la multa. Por favor, intenta nuevamente.');
        this.isSubmitting.set(false);
        console.error(err);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.multaForm.get(fieldName);
    if (!field || !field.touched) return '';

    if (field.hasError('required')) return 'Este campo es requerido';
    if (field.hasError('minLength')) return 'Mínimo 3 caracteres';
    if (field.hasError('min')) return 'El monto debe ser mayor a 0';
    
    return '';
  }
}
