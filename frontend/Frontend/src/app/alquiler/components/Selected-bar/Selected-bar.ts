import { ChangeDetectionStrategy, Component, effect, inject, output, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-selected-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './Selected-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedBar { 
  // Signal to track the selected option
  changeDetector = signal<string>('vehiculos') ;
  sendDetector = output<string>();

  router = inject(Router);

  debounceEffect = effect((onCleanup) => {
    const value = this.changeDetector();
    this.sendDetector.emit(value);
    // no cleanup required for this effect
  })



    onSelectChange(event:any): void {
    const selectedValue= event.target.value
    // Navigate based on the selected value
    if (selectedValue === 'vehiculos') {
      this.changeDetector.set('vehiculos');
    } else if (selectedValue === 'fechas') {
      this.changeDetector.set('fechas');

    }
    }
    
}
