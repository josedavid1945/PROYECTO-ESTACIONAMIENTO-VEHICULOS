import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Espacio {
  id: string;
  numero: string;
  estado: boolean;
  seccionId?: string;
}

@Component({
  selector: 'app-espacios-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './espacios-grid.html'
})
export class EspaciosGridComponent {
  // Inputs
  espacios = input.required<Espacio[]>();
  mostrarTodos = input<boolean>(true); // Si es false, solo muestra disponibles
  enableSelection = input<boolean>(true);
  gridCols = input<number>(4); // Número de columnas en el grid

  // Outputs
  espacioSeleccionado = output<Espacio>();

  get espaciosFiltrados(): Espacio[] {
    if (this.mostrarTodos()) {
      return this.espacios();
    }
    return this.espacios().filter(e => e.estado);
  }

  get gridClass(): string {
    return `grid grid-cols-${this.gridCols()} gap-3`;
  }

  onSeleccionarEspacio(espacio: Espacio) {
    if (this.enableSelection() && espacio.estado) {
      this.espacioSeleccionado.emit(espacio);
    }
  }

  getEspacioClass(espacio: Espacio): string {
    if (espacio.estado) {
      return 'btn btn-lg btn-outline hover:btn-success border-green-500 text-green-700 hover:bg-green-600 hover:text-white';
    }
    return 'btn btn-lg btn-outline border-slate-400 text-slate-500 cursor-not-allowed opacity-50';
  }
}
