import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HerramientasService } from '../../../services/herramientas.service';

@Component({
  selector: 'app-register-tarifa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-tarifa.html'
})
export class RegisterTarifaComponent {
  private herramientasService = inject(HerramientasService);
  private router = inject(Router);

  public tipoTarifa = signal('');
  public precioHora = signal(0);
  public precioDia = signal(0);
  public loading = signal(false);

  registrarTarifa() {
    if (!this.tipoTarifa() || this.precioHora() <= 0 || this.precioDia() <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading.set(true);
    this.herramientasService.createTarifa(
      this.tipoTarifa(),
      this.precioHora(),
      this.precioDia()
    ).subscribe({
      next: () => {
        alert('Tarifa registrada exitosamente');
        this.router.navigate(['/estacionamiento/herramientas/config/tarifa']);
      },
      error: (error) => {
        console.error('Error al registrar tarifa:', error);
        alert('Error al registrar la tarifa');
        this.loading.set(false);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/estacionamiento/herramientas/config/tarifa']);
  }
}
