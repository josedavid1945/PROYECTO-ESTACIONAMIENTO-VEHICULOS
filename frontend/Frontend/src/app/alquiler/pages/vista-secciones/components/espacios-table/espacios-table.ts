import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Espacio } from '../../../../services/parking.service';

@Component({
  selector: 'app-espacios-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './espacios-table.html'
})
export class EspaciosTable {
  letraSeccion = input.required<string>();
  espacios = input.required<Espacio[]>();
  
  toggleEstado = output<Espacio>();
  deleteEspacio = output<string>();
  createEspacios = output<void>();
}
