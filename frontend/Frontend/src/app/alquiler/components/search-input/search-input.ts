import { ChangeDetectionStrategy, Component, effect, input, linkedSignal, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  imports: [],
  templateUrl: './search-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInput {
  value = output<string>();
  initialValue = input<string>();
  debounceTime = input(300);
  
  inputValue= linkedSignal<string>(() => this.initialValue()?? '');

  debounceEffect= effect((onCleaup)=>{
    const value = this.inputValue();
    const timeout = setTimeout(()=>{
      this.value.emit(value);
    }, this.debounceTime());
    onCleaup(()=> clearTimeout(timeout));
  })
 }
