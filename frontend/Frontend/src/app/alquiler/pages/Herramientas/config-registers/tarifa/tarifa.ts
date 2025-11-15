import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HerramientasService, TipoTarifa } from '../../../../services/herramientas.service';

@Component({
  selector: 'app-tarifa',
  imports: [CommonModule, RouterLink],
  templateUrl: './tarifa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifaComponent implements OnInit {
  private herramientasService = inject(HerramientasService);
  
  tarifas = signal<TipoTarifa[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTarifas();
  }

  loadTarifas(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.herramientasService.getTarifas().subscribe({
      next: (data) => {
        this.tarifas.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las tarifas');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  deleteTarifa(id: string): void {
    if (!confirm('¿Estás seguro de eliminar esta tarifa?')) return;

    this.herramientasService.deleteTarifa(id).subscribe({
      next: () => {
        this.loadTarifas();
      },
      error: (err) => {
        this.error.set('Error al eliminar la tarifa');
        console.error(err);
      }
    });
  }
}
