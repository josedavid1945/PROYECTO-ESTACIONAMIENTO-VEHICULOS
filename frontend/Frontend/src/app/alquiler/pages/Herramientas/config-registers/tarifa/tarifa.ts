import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HerramientasService, TipoTarifa } from '../../../../services/herramientas.service';

@Component({
  selector: 'app-tarifa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarifa.html'
})
export class TarifaComponent implements OnInit {
  private herramientasService = inject(HerramientasService);
  private router = inject(Router);

  public tarifas = signal<TipoTarifa[]>([]);
  public loading = signal(true);

  ngOnInit() {
    this.cargarTarifas();
  }

  cargarTarifas() {
    this.loading.set(true);
    this.herramientasService.getTarifas().subscribe({
      next: (tarifas) => {
        this.tarifas.set(tarifas);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar tarifas:', error);
        this.loading.set(false);
      }
    });
  }

  eliminarTarifa(id: string) {
    if (confirm('¿Estás seguro de eliminar esta tarifa?')) {
      this.herramientasService.deleteTarifa(id).subscribe({
        next: () => {
          this.cargarTarifas();
        },
        error: (error) => {
          console.error('Error al eliminar tarifa:', error);
        }
      });
    }
  }

  irARegistro() {
    this.router.navigate(['/estacionamiento/herramientas/config/registrar-tarifa']);
  }
}
