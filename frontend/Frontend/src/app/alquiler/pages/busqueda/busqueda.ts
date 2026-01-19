import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SelectedBar } from "../../components/Selected-bar/Selected-bar";

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [CommonModule, RouterModule, SelectedBar],
  templateUrl: './busqueda.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Busqueda { 
  private router = inject(Router);
  
  // Signals
  selectedOption = signal<string>(''); // Por defecto mostrar todos los tickets

  // Manejador del cambio en el select
  onSelectedOptionChange(option: string) {
    this.selectedOption.set(option);
    if (option) {
      this.router.navigate([`/admin/estacionamiento/busqueda/${option}`]);
    } else {
      // Si se selecciona "todos", volver a la vista por defecto
      this.router.navigate(['/admin/estacionamiento/busqueda']);
    }
  }
}
