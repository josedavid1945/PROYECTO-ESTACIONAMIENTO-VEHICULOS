import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HerramientasService, TipoMulta as TipoMultaInterface } from '../../../../services/herramientas.service';

@Component({
  selector: 'app-tipo-multa',
  imports: [CommonModule, RouterLink],
  templateUrl: './tipo-multa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipoMulta implements OnInit {
  private herramientasService = inject(HerramientasService);
  
  multas = signal<TipoMultaInterface[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMultas();
  }

  loadMultas(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.herramientasService.getMultas().subscribe({
      next: (data) => {
        this.multas.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las multas');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  deleteMulta(id: string): void {
    if (!confirm('¿Estás seguro de eliminar esta multa?')) return;

    this.herramientasService.deleteMulta(id).subscribe({
      next: () => {
        this.loadMultas();
      },
      error: (err) => {
        this.error.set('Error al eliminar la multa');
        console.error(err);
      }
    });
  }
}
