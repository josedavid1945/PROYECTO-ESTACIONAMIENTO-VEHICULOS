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
    
    console.log('🔍 FILTRADO DE VEHÍCULOS:');
    console.log('Query actual:', query);
    console.log('Total vehículos cargados:', vehiculos.length);
    
    if (!query) {
      console.log('✅ Sin query, mostrando todos los vehículos');
      return vehiculos;
    }
    
    const filtered = vehiculos.filter(vehiculo => {
      const placaMatch = vehiculo.placa.toLowerCase().includes(query);
      const marcaMatch = vehiculo.marca.toLowerCase().includes(query);
      const modeloMatch = vehiculo.modelo.toLowerCase().includes(query);
      const clienteMatch = vehiculo.cliente.nombre.toLowerCase().includes(query);
      const categoriaMatch = vehiculo.tipoVehiculo.categoria.toLowerCase().includes(query);
      
      const match = placaMatch || marcaMatch || modeloMatch || clienteMatch || categoriaMatch;
      
      if (match) {
        console.log('✅ Match encontrado:', {
          placa: vehiculo.placa,
          placaMatch,
          marcaMatch,
          modeloMatch,
          clienteMatch,
          categoriaMatch
        });
      }
      
      return match;
    });
    
    console.log('📊 Resultados filtrados:', filtered.length);
    return filtered;
  });

  ngOnInit() {
    this.loadVehiculos();
  }

  onSearchChange(query: string) {
    console.log('🔔 onSearchChange llamado con:', query);
    this.searchQuery.set(query);
    console.log('📝 searchQuery signal actualizado a:', this.searchQuery());
  }

  private loadVehiculos() {
    console.log('🚀 Iniciando carga de vehículos...');
    this.isLoading.set(true);
    this.ticketService.getVehiculosCompletos().subscribe({
      next: (data) => {
        console.log('✅ Vehículos cargados exitosamente:', data.length);
        console.log('📋 Datos recibidos:', data);
        this.allVehiculos.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading vehiculos:', error);
        this.isLoading.set(false);
      }
    });
  }
}
