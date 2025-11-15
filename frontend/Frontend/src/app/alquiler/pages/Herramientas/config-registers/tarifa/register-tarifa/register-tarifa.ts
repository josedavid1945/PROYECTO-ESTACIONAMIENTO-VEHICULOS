import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HerramientasService } from '../../../../../services/herramientas.service';

@Component({
  selector: 'app-register-tarifa',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-tarifa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterTarifaComponent {
  private fb = inject(FormBuilder);
  private herramientasService = inject(HerramientasService);
  private router = inject(Router);

  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  tarifaForm: FormGroup = this.fb.group({
    tipoTarifa: ['', [Validators.required, Validators.minLength(3)]],
    precioHora: [0, [Validators.required, Validators.min(0)]],
    precioDia: [0, [Validators.required, Validators.min(0)]]
  });

  onSubmit(): void {
    if (this.tarifaForm.invalid) {
      this.tarifaForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const { tipoTarifa, precioHora, precioDia } = this.tarifaForm.value;

    this.herramientasService.createTarifa(tipoTarifa, precioHora, precioDia).subscribe({
      next: () => {
        this.success.set(true);
        this.tarifaForm.reset();
        setTimeout(() => {
          this.router.navigate(['/estacionamiento/herramientas/config/tarifa']);
        }, 1500);
      },
      error: (err) => {
        this.error.set('Error al crear la tarifa. Por favor, intenta nuevamente.');
        this.isSubmitting.set(false);
        console.error(err);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.tarifaForm.get(fieldName);
    if (!field || !field.touched) return '';

    if (field.hasError('required')) return 'Este campo es requerido';
    if (field.hasError('minLength')) return 'Mínimo 3 caracteres';
    if (field.hasError('min')) return 'El valor debe ser mayor o igual a 0';
    
    return '';
  }
}
