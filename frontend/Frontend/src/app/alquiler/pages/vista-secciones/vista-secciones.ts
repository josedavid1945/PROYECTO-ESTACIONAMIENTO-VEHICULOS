import { ChangeDetectionStrategy, Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParkingService, Seccion, Espacio } from '../../services/parking.service';

@Component({
  selector: 'app-vista-secciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './vista-secciones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VistaSecciones implements OnInit {
  private parkingService = inject(ParkingService);

  // Signals
  secciones = signal<Seccion[]>([]);
  currentSeccionIndex = signal(0);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Modales
  showCreateSeccionModal = signal(false);
  showCreateEspaciosModal = signal(false);

  // Formularios
  newSeccionLetra = signal('');
  newEspaciosInicio = signal(1);
  newEspaciosFin = signal(10);

  // Computed
  currentSeccion = computed(() => {
    const secciones = this.secciones();
    const index = this.currentSeccionIndex();
    return secciones[index] || null;
  });

  espaciosDisponibles = computed(() => {
    const seccion = this.currentSeccion();
    return seccion ? seccion.espacios.filter(e => e.estado).length : 0;
  });

  espaciosOcupados = computed(() => {
    const seccion = this.currentSeccion();
    return seccion ? seccion.espacios.filter(e => !e.estado).length : 0;
  });

  totalEspacios = computed(() => {
    const seccion = this.currentSeccion();
    return seccion ? seccion.espacios.length : 0;
  });

  ngOnInit(): void {
    this.loadSecciones();
  }

  loadSecciones(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.parkingService.getSeccionesWithEspacios().subscribe({
      next: (data) => {
        this.secciones.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando secciones:', err);
        this.error.set('Error al cargar las secciones');
        this.isLoading.set(false);
      }
    });
  }

  // ==================== NAVEGACIÓN ====================
  goToSeccion(index: number): void {
    if (index >= 0 && index < this.secciones().length) {
      this.currentSeccionIndex.set(index);
    }
  }

  previousSeccion(): void {
    const currentIndex = this.currentSeccionIndex();
    if (currentIndex > 0) {
      this.currentSeccionIndex.set(currentIndex - 1);
    }
  }

  nextSeccion(): void {
    const currentIndex = this.currentSeccionIndex();
    if (currentIndex < this.secciones().length - 1) {
      this.currentSeccionIndex.set(currentIndex + 1);
    }
  }

  // ==================== CREAR SECCIÓN ====================
  openCreateSeccionModal(): void {
    this.newSeccionLetra.set('');
    this.showCreateSeccionModal.set(true);
  }

  closeCreateSeccionModal(): void {
    this.showCreateSeccionModal.set(false);
  }

  createSeccion(): void {
    const letra = this.newSeccionLetra().trim().toUpperCase();
    if (!letra) {
      alert('Por favor ingresa una letra para la sección');
      return;
    }

    this.parkingService.createSeccion(letra).subscribe({
      next: () => {
        this.loadSecciones();
        this.closeCreateSeccionModal();
      },
      error: (err) => {
        console.error('Error creando sección:', err);
        alert('Error al crear la sección');
      }
    });
  }

  // ==================== CREAR ESPACIOS ====================
  openCreateEspaciosModal(): void {
    this.newEspaciosInicio.set(1);
    this.newEspaciosFin.set(10);
    this.showCreateEspaciosModal.set(true);
  }

  closeCreateEspaciosModal(): void {
    this.showCreateEspaciosModal.set(false);
  }

  createMultipleEspacios(): void {
    const seccion = this.currentSeccion();
    if (!seccion) {
      alert('No hay sección seleccionada');
      return;
    }

    const inicio = this.newEspaciosInicio();
    const fin = this.newEspaciosFin();

    if (inicio > fin) {
      alert('El número de inicio debe ser menor o igual al número final');
      return;
    }

    if (inicio < 1 || fin < 1) {
      alert('Los números deben ser mayores a 0');
      return;
    }

    this.parkingService.createMultipleEspacios({
      seccionId: seccion.id,
      numeroInicio: inicio,
      numeroFin: fin
    }).subscribe({
      next: () => {
        this.loadSecciones();
        this.closeCreateEspaciosModal();
      },
      error: (err) => {
        console.error('Error creando espacios:', err);
        alert('Error al crear los espacios');
      }
    });
  }

  // ==================== TOGGLE ESTADO ====================
  toggleEstadoEspacio(espacio: Espacio): void {
    const newEstado = !espacio.estado;
    
    this.parkingService.updateEspacioEstado(espacio.id, newEstado).subscribe({
      next: () => {
        // Actualizamos el estado local
        const secciones = this.secciones();
        const updatedSecciones = secciones.map(seccion => ({
          ...seccion,
          espacios: seccion.espacios.map(e => 
            e.id === espacio.id ? { ...e, estado: newEstado } : e
          )
        }));
        this.secciones.set(updatedSecciones);
      },
      error: (err) => {
        console.error('Error actualizando estado:', err);
        alert('Error al actualizar el estado del espacio');
      }
    });
  }

  // ==================== DELETE ====================
  deleteEspacio(espacioId: string): void {
    if (!confirm('¿Estás seguro de eliminar este espacio?')) return;

    this.parkingService.deleteEspacio(espacioId).subscribe({
      next: () => {
        this.loadSecciones();
      },
      error: (err) => {
        console.error('Error eliminando espacio:', err);
        alert('Error al eliminar el espacio');
      }
    });
  }

  deleteSeccion(): void {
    const seccion = this.currentSeccion();
    if (!seccion) return;

    if (!confirm(`¿Estás seguro de eliminar la sección ${seccion.letraSeccion}?`)) return;

    this.parkingService.deleteSeccion(seccion.id).subscribe({
      next: () => {
        this.currentSeccionIndex.set(0);
        this.loadSecciones();
      },
      error: (err) => {
        console.error('Error eliminando sección:', err);
        alert('Error al eliminar la sección');
      }
    });
  }
}
