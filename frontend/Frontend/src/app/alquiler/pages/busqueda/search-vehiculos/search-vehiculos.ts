import { ChangeDetectionStrategy, Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../../services/busqueda-avanzada.service';
import { TicketFull } from '../../../interfaces/search.interface';

@Component({
  selector: 'app-search-vehiculos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-vehiculos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchVehiculos {
  private ticketService = inject(TicketService);
  
  // Signals para el estado
  tickets = signal<TicketFull[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  
  // Input para recibir la búsqueda del componente padre
  @Input() set query(value: string) {
    if (value !== this.searchQuery()) {
      this.searchQuery.set(value);
      this.filterTickets();
    }
  }

  ngOnInit() {
    this.loadTickets();
  }

  private loadTickets() {
    this.isLoading.set(true);
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.isLoading.set(false);
        this.filterTickets();
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.isLoading.set(false);
      }
    });
  }

  private filterTickets() {
    const query = this.searchQuery().toLowerCase();
    const allTickets = this.tickets();
    
    if (!query) {
      this.tickets.set(allTickets);
      return;
    }

    const filtered = allTickets.filter(ticket => 
      ticket.vehiculoPlaca.toLowerCase().includes(query)
    );
    
    this.tickets.set(filtered);
  }
}
