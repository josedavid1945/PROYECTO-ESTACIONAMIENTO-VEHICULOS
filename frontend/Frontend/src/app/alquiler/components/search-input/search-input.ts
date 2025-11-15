import { ChangeDetectionStrategy, Component, effect, input, linkedSignal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  // Output for search value changes
  value = output<string>();
  
  // Input properties
  initialValue = input<string>();
  placeholder = input<string>('Buscar...');
  debounceTime = input(300);
  
  // Linked signal for two-way binding
  inputValue = linkedSignal<string>(() => this.initialValue() ?? '');

  // Clear search input
  clearSearch(): void {
    console.log('🧹 Limpiando búsqueda');
    this.inputValue.set('');
    this.value.emit('');
  }

  // Debounce effect for search
  debounceEffect = effect((onCleanup) => {
    const value = this.inputValue();
    console.log('⏱️ Debounce effect - input value:', value);
    const timeout = setTimeout(() => {
      console.log('📤 Emitiendo valor después de debounce:', value);
      this.value.emit(value);
    }, this.debounceTime());
    onCleanup(() => {
      console.log('🧹 Limpiando timeout anterior');
      clearTimeout(timeout);
    });
  });
}
