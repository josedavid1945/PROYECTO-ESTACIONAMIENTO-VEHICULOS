import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { InformationBar } from '../../../shared/components/Information-bar/Information-bar';
import { NavBar } from '../../components/navBar/navBar';
import { SearchInput } from '../../components/search-input/search-input';
import { ListItem } from "../../components/list-item/list-item";
import { SelectedBar } from "../../components/Selected-bar/Selected-bar";
import { TicketService } from '../../services/busqueda-avanzada.service';
import { TicketFull } from '../../interfaces/search.interface';
@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [InformationBar, NavBar, SearchInput, ListItem, CommonModule, RouterModule,SelectedBar],
  templateUrl: './busqueda.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Busqueda { 
  private ticketService = inject(TicketService);
  private router = inject(Router);
  
  // Signals
  isNavBarExpanded = signal(false);
  selectedOption = signal<string>('');
  searchQuery = signal<string>('');
  tickets = signal<TicketFull[]>([]);
  cargando = signal(true);
  
  // Comportamiento del NavBar
  onNavBarToggle(newState: boolean) {
    this.isNavBarExpanded.set(newState);
  }

  // Manejador del cambio en el select
  onSelectedOptionChange(option: string) {
    if (option) {
      this.selectedOption.set(option);
      this.router.navigate([`/alquiler/busqueda/${option}`]);
    } else {
      this.selectedOption.set('');
      this.loadTickets(); // Recargar tickets cuando se deselecciona
    }
  }

  constructor() {
    // Cargar tickets inmediatamente al crear el componente
    this.loadTickets();
  }

  // Manejador del cambio en el search input
  onSearchQueryChange(query: string) {
    this.searchQuery.set(query);
    // Emitir el evento de búsqueda al componente hijo activo
    this.searchQueryChange.emit(query);
  }

  @Output() searchQueryChange = new EventEmitter<string>();

  ngOnInit() {
    this.loadTickets();
  }

  private loadTickets() {
    this.cargando.set(true);
    this.ticketService.getTickets().subscribe({
      next: (data) => {
        this.tickets.set(data);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error fetching tickets:', error);
        this.cargando.set(false);
      }
    });
  }
}
