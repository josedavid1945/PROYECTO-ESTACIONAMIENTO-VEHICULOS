import { ChangeDetectionStrategy, Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistroService, ClienteConVehiculos, EspacioDisponible, VehiculoOcupado } from '../../services/registro.service';
import { HerramientasService, TipoVehiculo } from '../../services/herramientas.service';

@Component({
  selector: 'app-registro',
  imports: [CommonModule, FormsModule],
  templateUrl: './registro.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Registro implements OnInit {
  private registroService = inject(RegistroService);
  private herramientasService = inject(HerramientasService);

  // ==================== SIGNALS ====================
  vistaActiva = signal<'menu' | 'nuevo-cliente' | 'asignar-espacio' | 'desocupar-espacio'>('menu');
  isLoading = signal(false);
  
  // Datos para formularios
  tiposVehiculo = signal<TipoVehiculo[]>([]);
  espaciosDisponibles = signal<EspacioDisponible[]>([]);
  clientesConVehiculos = signal<ClienteConVehiculos[]>([]);
  vehiculosOcupados = signal<VehiculoOcupado[]>([]);
  
  // Formulario Nuevo Cliente
  nuevoCliente = signal({
    nombreCliente: '',
    emailCliente: '',
    telefonoCliente: '',
    placa: '',
    marca: '',
    modelo: '',
    tipoVehiculoId: '',
    espacioId: ''
  });

  // Formulario Asignar Espacio
  asignarEspacio = signal({
    vehiculoId: '',
    espacioId: ''
  });

  // Formulario Desocupar Espacio
  desocuparEspacio = signal({
    ticketId: '',
    metodoPago: 'Efectivo',
    montoPago: 0,
    tipoTarifaId: ''
  });

  // Modales
  showEspaciosModal = signal(false);
  espacioSeleccionado = signal<EspacioDisponible | null>(null);

  // Computed
  clienteExpandido = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTiposVehiculo();
  }

  // ==================== CARGA DE DATOS ====================
  loadTiposVehiculo(): void {
    this.herramientasService.getTiposVehiculo().subscribe({
      next: (data) => this.tiposVehiculo.set(data),
      error: (err) => console.error('Error cargando tipos de vehículo:', err)
    });
  }

  loadEspaciosDisponibles(): void {
    this.registroService.getEspaciosDisponibles().subscribe({
      next: (data) => this.espaciosDisponibles.set(data),
      error: (err) => console.error('Error cargando espacios:', err)
    });
  }

  loadClientesConVehiculos(): void {
    this.registroService.getClientesConVehiculos().subscribe({
      next: (data) => this.clientesConVehiculos.set(data),
      error: (err) => console.error('Error cargando clientes:', err)
    });
  }

  loadVehiculosOcupados(): void {
    this.registroService.getVehiculosOcupados().subscribe({
      next: (data) => this.vehiculosOcupados.set(data),
      error: (err) => console.error('Error cargando vehículos ocupados:', err)
    });
  }

  // ==================== NAVEGACIÓN ====================
  irAVista(vista: 'menu' | 'nuevo-cliente' | 'asignar-espacio' | 'desocupar-espacio'): void {
    this.vistaActiva.set(vista);
    
    if (vista === 'nuevo-cliente') {
      this.loadEspaciosDisponibles();
      this.resetFormNuevoCliente();
    } else if (vista === 'asignar-espacio') {
      this.loadEspaciosDisponibles();
      this.loadClientesConVehiculos();
      this.resetFormAsignarEspacio();
    } else if (vista === 'desocupar-espacio') {
      this.loadVehiculosOcupados();
      this.resetFormDesocuparEspacio();
    }
  }

  volverAlMenu(): void {
    this.vistaActiva.set('menu');
  }

  // ==================== FORMULARIO NUEVO CLIENTE ====================
  resetFormNuevoCliente(): void {
    this.nuevoCliente.set({
      nombreCliente: '',
      emailCliente: '',
      telefonoCliente: '',
      placa: '',
      marca: '',
      modelo: '',
      tipoVehiculoId: '',
      espacioId: ''
    });
    this.espacioSeleccionado.set(null);
  }

  abrirModalEspacios(): void {
    this.showEspaciosModal.set(true);
  }

  cerrarModalEspacios(): void {
    this.showEspaciosModal.set(false);
  }

  seleccionarEspacio(espacio: EspacioDisponible): void {
    this.espacioSeleccionado.set(espacio);
    
    // Actualizar el formulario correcto según la vista activa
    if (this.vistaActiva() === 'nuevo-cliente') {
      const form = this.nuevoCliente();
      this.nuevoCliente.set({ ...form, espacioId: espacio.id });
    } else if (this.vistaActiva() === 'asignar-espacio') {
      const form = this.asignarEspacio();
      this.asignarEspacio.set({ ...form, espacioId: espacio.id });
    }
    
    this.cerrarModalEspacios();
  }

  registrarNuevoCliente(): void {
    const form = this.nuevoCliente();
    
    if (!form.nombreCliente || !form.emailCliente || !form.placa || !form.tipoVehiculoId || !form.espacioId) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);
    this.registroService.registrarClienteCompleto(form).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        alert('Cliente registrado exitosamente');
        
        // Generar PDF del ticket
        this.registroService.generarTicketPDF(response.data);
        
        this.resetFormNuevoCliente();
        this.volverAlMenu();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error registrando cliente:', err);
        alert(err.error?.message || 'Error al registrar cliente');
      }
    });
  }

  // ==================== FORMULARIO ASIGNAR ESPACIO ====================
  resetFormAsignarEspacio(): void {
    this.asignarEspacio.set({
      vehiculoId: '',
      espacioId: ''
    });
    this.espacioSeleccionado.set(null);
  }

  // Método eliminado - ahora se usa toggleCliente y el radio button actualiza directamente con ngModel

  confirmarAsignacion(): void {
    const form = this.asignarEspacio();
    
    if (!form.vehiculoId || !form.espacioId) {
      alert('Por favor seleccione un vehículo y un espacio');
      return;
    }

    this.isLoading.set(true);
    this.registroService.asignarEspacio(form).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        alert('Espacio asignado exitosamente');
        
        // Generar PDF del ticket
        this.registroService.generarTicketPDF(response.data);
        
        this.resetFormAsignarEspacio();
        this.volverAlMenu();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error asignando espacio:', err);
        alert(err.error?.message || 'Error al asignar espacio');
      }
    });
  }

  // ==================== FORMULARIO DESOCUPAR ESPACIO ====================
  resetFormDesocuparEspacio(): void {
    this.desocuparEspacio.set({
      ticketId: '',
      metodoPago: 'Efectivo',
      montoPago: 0,
      tipoTarifaId: ''
    });
  }

  seleccionarVehiculoOcupado(vehiculoOcupado: VehiculoOcupado): void {
    const form = this.desocuparEspacio();
    this.desocuparEspacio.set({ 
      ...form, 
      ticketId: vehiculoOcupado.ticket.id 
    });
  }

  calcularMonto(vehiculoOcupado: VehiculoOcupado): number {
    // Aquí puedes implementar la lógica de cálculo según las tarifas
    // Por ahora retorna 0, el usuario debe ingresar el monto manualmente
    return 0;
  }

  confirmarDesocupacion(): void {
    const form = this.desocuparEspacio();
    
    if (!form.ticketId || !form.metodoPago || form.montoPago <= 0) {
      alert('Por favor complete todos los campos del pago');
      return;
    }

    this.isLoading.set(true);
    this.registroService.desocuparEspacio(form).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        alert('Espacio desocupado exitosamente');
        
        // Generar PDF del detalle de pago
        this.registroService.generarDetallePagoPDF(response.data);
        
        this.resetFormDesocuparEspacio();
        this.volverAlMenu();
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error desocupando espacio:', err);
        alert(err.error?.message || 'Error al desocupar espacio');
      }
    });
  }

  // ==================== UTILIDADES ====================
  toggleCliente(clienteId: string): void {
    this.clienteExpandido.set(
      this.clienteExpandido() === clienteId ? null : clienteId
    );
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-EC');
  }

  calcularTiempoEstadia(fechaIngreso: string): string {
    const entrada = new Date(fechaIngreso);
    const ahora = new Date();
    const diff = ahora.getTime() - entrada.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}min`;
  }
}
