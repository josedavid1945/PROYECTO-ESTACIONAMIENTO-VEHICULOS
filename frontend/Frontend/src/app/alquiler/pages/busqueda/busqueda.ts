import { ChangeDetectionStrategy, Component, inject,signal } from '@angular/core';
import { InformationBar } from '../../../shared/components/Information-bar/Information-bar';
import { NavBar } from '../../components/navBar/navBar';
import { SearchInput } from '../../components/search-input/search-input';
import { ListItem } from "../../components/list-item/list-item";
import { SelectedBar } from "../../components/Selected-bar/Selected-bar";
import {toSignal} from '@angular/core/rxjs-interop';
import { TicketService } from '../../services/busqueda-avanzada.service';
import { TicketFull } from '../../interfaces/search.interface';
@Component({
  selector: 'app-busqueda',
  imports: [InformationBar, NavBar, SearchInput, ListItem, SelectedBar],
  templateUrl: './busqueda.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Busqueda { 
  isNavBarExpanded = false;
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded = newState;
  }
  private ticketService = inject(TicketService);
  
  tickets = signal<TicketFull[]>([]);
  cargando = signal(true);

  ngOnInit() {
    this.cargarTickets();
  }

  cargarTickets() {
    this.cargando.set(true);
    
    this.ticketService.getTicketsCompletos().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error cargando tickets:', error);
        this.cargando.set(false);
      }
    });
  }
  
  
}
