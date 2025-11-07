import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchInput } from '../../../components/search-input/search-input';
import { SelectedBar } from '../../../components/Selected-bar/Selected-bar';

@Component({
  selector: 'app-search-tickets-por-fecha',
  standalone: true,
  imports: [CommonModule, SearchInput],
  templateUrl: './search-ticketsPorFecha.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTicketsPorFecha { 
    isSelected = output<boolean>();
    ngOnInit(): void {
    this.isSelected.emit(true);
  }
}
