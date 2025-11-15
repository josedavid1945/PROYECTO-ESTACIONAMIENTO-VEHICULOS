import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HerramientasService } from '../../../../../services/herramientas.service';

interface Tarifa {
  id: string;
  tipoTarifa: string;
  precioHora: number;
  precioDia: number;
}

@Component({
  selector: 'app-register-tipo-vehiculo',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-tipoVehiculo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterTipoVehiculo implements OnInit {
  private fb = inject(FormBuilder);
  private herramientasService = inject(HerramientasService);
  private router = inject(Router);

  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  tarifas = signal<Tarifa[]>([]);
  isLoadingTarifas = signal(false);

  tipoVehiculoForm: FormGroup = this.fb.group({
    categoria: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    tipoTarifaId: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadTarifas();
  }

  loadTarifas(): void {
    this.isLoadingTarifas.set(true);
    this.herramientasService.getTarifas().subscribe({
      next: (tarifas) => {
        this.tarifas.set(tarifas);
        this.isLoadingTarifas.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las tarifas disponibles');
        this.isLoadingTarifas.set(false);
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (this.tipoVehiculoForm.invalid) {
      this.tipoVehiculoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const { categoria, descripcion, tipoTarifaId } = this.tipoVehiculoForm.value;

    this.herramientasService.createTipoVehiculo(categoria, descripcion, tipoTarifaId).subscribe({
      next: () => {
        this.success.set(true);
        this.tipoVehiculoForm.reset();
        setTimeout(() => {
          this.router.navigate(['/estacionamiento/herramientas/config/tipos-vehiculo']);
        }, 1500);
      },
      error: (err) => {
        this.error.set('Error al crear el tipo de vehículo. Por favor, intenta nuevamente.');
        this.isSubmitting.set(false);
        console.error(err);
      }
    });
  }

  getTarifaInfo(tarifaId: string): string {
    const tarifa = this.tarifas().find(t => t.id === tarifaId);
    if (!tarifa) return '';
    return `$${tarifa.precioHora}/hora | $${tarifa.precioDia}/día`;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.tipoVehiculoForm.get(fieldName);
    if (!field || !field.touched) return '';

    if (field.hasError('required')) {
      if (fieldName === 'tipoTarifaId') return 'Debes seleccionar una tarifa';
      return 'Este campo es requerido';
    }
    if (field.hasError('minLength')) {
      return fieldName === 'categoria' ? 'Mínimo 3 caracteres' : 'Mínimo 10 caracteres';
    }
    
    return '';
  }
}
