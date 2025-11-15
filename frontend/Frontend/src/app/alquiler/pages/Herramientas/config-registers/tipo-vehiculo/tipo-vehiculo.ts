import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HerramientasService, TipoVehiculo as TipoVehiculoInterface } from '../../../../services/herramientas.service';

@Component({
  selector: 'app-tipo-vehiculo',
  imports: [CommonModule, RouterLink],
  templateUrl: './tipo-vehiculo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipoVehiculo implements OnInit {
  private herramientasService = inject(HerramientasService);
  
  tiposVehiculo = signal<TipoVehiculoInterface[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTiposVehiculo();
  }

  loadTiposVehiculo(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.herramientasService.getTiposVehiculo().subscribe({
      next: (data) => {
        this.tiposVehiculo.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los tipos de vehículos');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  deleteTipoVehiculo(id: string): void {
    if (!confirm('¿Estás seguro de eliminar este tipo de vehículo?')) return;

    this.herramientasService.deleteTipoVehiculo(id).subscribe({
      next: () => {
        this.loadTiposVehiculo();
      },
      error: (err) => {
        this.error.set('Error al eliminar el tipo de vehículo');
        console.error(err);
      }
    });
  }
}
