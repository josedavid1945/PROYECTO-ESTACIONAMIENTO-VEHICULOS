import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../../services/busqueda-avanzada.service';
import { VehiculoCompleto } from '../../../interfaces/search.interface';
import { SearchInput } from '../../../components/search-input/search-input';

@Component({
  selector: 'app-search-vehiculos',
  standalone: true,
  imports: [CommonModule, SearchInput],
  templateUrl: './search-vehiculos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchVehiculos implements OnInit {
  private ticketService = inject(TicketService);
  
  // Signals para el estado
  allVehiculos = signal<VehiculoCompleto[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  
  // Computed para filtrar vehículos
  filteredVehiculos = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const vehiculos = this.allVehiculos();
    
    if (!query) {
      return vehiculos;
    }
    
    return vehiculos.filter(vehiculo => {
      const placaMatch = vehiculo.placa.toLowerCase().includes(query);
      const marcaMatch = vehiculo.marca.toLowerCase().includes(query);
      const modeloMatch = vehiculo.modelo.toLowerCase().includes(query);
      const clienteMatch = vehiculo.cliente.nombre.toLowerCase().includes(query);
      const categoriaMatch = vehiculo.tipoVehiculo.categoria.toLowerCase().includes(query);
      
      return placaMatch || marcaMatch || modeloMatch || clienteMatch || categoriaMatch;
    });
  });

  ngOnInit() {
    this.loadVehiculos();
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  private loadVehiculos() {
    this.isLoading.set(true);
    this.ticketService.getVehiculosCompletos().subscribe({
      next: (data) => {
        this.allVehiculos.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar vehículos:', error);
        this.isLoading.set(false);
      }
    });
  }
}
