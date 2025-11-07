import { ChangeDetectionStrategy, Component, input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TicketFull } from '../../interfaces/search.interface';

@Component({
  selector: 'app-list-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-item.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListItem {
  // Input properties
  elements = input.required<TicketFull[]>();
  errorMessage = input<string|unknown|null>();
  isLoading = input<boolean>(false);
  isEmpty = input<boolean>(false);

  // Output events
  @Output() viewDetails = new EventEmitter<string>();
  @Output() printTicket = new EventEmitter<string>();

  // Methods
  onViewDetails(ticketId: string): void {
    this.viewDetails.emit(ticketId);
  }

  onPrintTicket(ticketId: string): void {
    this.printTicket.emit(ticketId);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'activo':
        return 'status-active';
      case 'finalizado':
        return 'status-completed';
      case 'cancelado':
        return 'status-cancelled';
      default:
        return '';
    }
  }
}
