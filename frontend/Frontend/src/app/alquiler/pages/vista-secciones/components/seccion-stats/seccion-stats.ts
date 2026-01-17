import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seccion-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seccion-stats.html'
})
export class SeccionStats {
  totalEspacios = input.required<number>();
  espaciosDisponibles = input.required<number>();
  espaciosOcupados = input.required<number>();

  porcentajeOcupacion = computed(() => {
    const total = this.totalEspacios();
    const ocupados = this.espaciosOcupados();
    return total > 0 ? ((ocupados / total) * 100).toFixed(0) : 0;
  });
}
