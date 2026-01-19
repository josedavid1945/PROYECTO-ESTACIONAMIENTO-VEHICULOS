import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HerramientasService } from '../../../../../services/herramientas.service';

@Component({
  selector: 'app-register-tarifa',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register-tarifa.html'
})
export class RegisterTarifaComponent {
  private herramientasService = inject(HerramientasService);
  private router = inject(Router);

  public tipoTarifa = signal('');
  public precioHora = signal(0);
  public precioDia = signal(0);
  public loading = signal(false);

  onTipoTarifaChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.tipoTarifa.set(value);
  }

  onPrecioHoraChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const value = parseFloat(inputValue);
    if (inputValue === '' || isNaN(value)) {
      this.precioHora.set(0);
    } else {
      this.precioHora.set(value);
    }
  }

  onPrecioDiaChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;
    const value = parseFloat(inputValue);
    if (inputValue === '' || isNaN(value)) {
      this.precioDia.set(0);
    } else {
      this.precioDia.set(value);
    }
  }

  registrarTarifa() {
    const tipo = this.tipoTarifa().trim();
    const hora = this.precioHora();
    const dia = this.precioDia();

    if (!tipo || hora <= 0 || dia <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading.set(true);
    
    this.herramientasService.createTarifa(
      tipo,
      hora,
      dia
    ).subscribe({
      next: () => {
        alert('Tarifa registrada exitosamente');
        this.router.navigate(['/admin/estacionamiento/herramientas/config/tarifa']);
      },
      error: (error) => {
        console.error('Error al registrar tarifa:', error);
        alert(`Error al registrar la tarifa: ${error.error?.message || error.message}`);
        this.loading.set(false);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/admin/estacionamiento/herramientas/config/tarifa']);
  }
}
