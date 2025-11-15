import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
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
  private router = inject(Router);
  
  // Signal to track the selected option - default to empty (all tickets)
  selectedOption = signal<string>('');
  
  // Output to notify parent component
  sendDetector = output<string>();

  onSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedValue = select.value;
    
    this.selectedOption.set(selectedValue);
    this.sendDetector.emit(selectedValue);
  }
}
