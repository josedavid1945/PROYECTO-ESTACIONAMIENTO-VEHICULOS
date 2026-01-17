import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seccion } from '../../../../services/parking.service';

@Component({
  selector: 'app-seccion-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seccion-tabs.html'
})
export class SeccionTabs {
  secciones = input.required<Seccion[]>();
  currentIndex = input.required<number>();
  
  selectSeccion = output<number>();
  previous = output<void>();
  next = output<void>();

  onPrevious(): void {
    if (this.currentIndex() > 0) {
      this.previous.emit();
    }
  }

  onNext(): void {
    if (this.currentIndex() < this.secciones().length - 1) {
      this.next.emit();
    }
  }
}
