import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Ticket, TicketFull } from '../../interfaces/search.interface';

@Component({
  selector: 'app-list-item',
  imports: [],
  templateUrl: './list-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItem {
  elements = input.required<TicketFull[]>()
  errorMessage = input<string|unknown|null>();
  isLoading = input<boolean>(false);
  isEmpty = input<boolean>(false);
 }
