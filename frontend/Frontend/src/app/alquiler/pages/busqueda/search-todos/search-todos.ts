import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../../services/busqueda-avanzada.service';
import { TicketFull } from '../../../interfaces/search.interface';
import { SearchInput } from '../../../components/search-input/search-input';
import { ListItem } from '../../../components/list-item/list-item';

@Component({
  selector: 'app-search-todos',
  standalone: true,
  imports: [CommonModule, SearchInput, ListItem],
  templateUrl: './search-todos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTodos implements OnInit {
  private ticketService = inject(TicketService);
  
  // Signals para el estado
  allTickets = signal<TicketFull[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  
  // Computed para filtrar tickets
  filteredTickets = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tickets = this.allTickets();
    
    if (!query) {
      return tickets;
    }
    
    return tickets.filter(ticket => 
      ticket.vehiculoPlaca.toLowerCase().includes(query) ||
      ticket.espacioNumero.toLowerCase().includes(query) ||
      ticket.estadoTicket.toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadTickets();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  private loadTickets() {
    this.isLoading.set(true);
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.allTickets.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.isLoading.set(false);
      }
    });
  }
}
