import { ChangeDetectionStrategy, Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroService, ClienteConVehiculos, EspacioDisponible, VehiculoOcupado } from '../../services/registro.service';
import { HerramientasService, TipoVehiculo, TipoTarifa } from '../../services/herramientas.service';
import { MenuRegistroComponent } from '../../components/menu-registro/menu-registro';
import { FormNuevoClienteComponent } from '../../components/form-nuevo-cliente/form-nuevo-cliente';
import { FormAsignarEspacioComponent } from '../../components/form-asignar-espacio/form-asignar-espacio';
import { FormDesocuparEspacioComponent } from '../../components/form-desocupar-espacio/form-desocupar-espacio';
import { EspaciosGridComponent } from '../../components/espacios-grid/espacios-grid';

@Component({
  selector: 'app-registro',
  imports: [
    CommonModule,
    MenuRegistroComponent,
    FormNuevoClienteComponent,
    FormAsignarEspacioComponent,
    FormDesocuparEspacioComponent,
    EspaciosGridComponent
  ],
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
  tiposTarifa = signal<TipoTarifa[]>([]);
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
    this.loadTiposTarifa();
  }

  // ==================== CARGA DE DATOS ====================
  loadTiposVehiculo(): void {
    this.herramientasService.getTiposVehiculo().subscribe({
      next: (data) => this.tiposVehiculo.set(data),
      error: (err) => console.error('Error cargando tipos de vehículo:', err)
    });
  }

  loadTiposTarifa(): void {
    this.herramientasService.getTarifas().subscribe({
      next: (data) => this.tiposTarifa.set(data),
      error: (err) => console.error('Error cargando tipos de tarifa:', err)
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

  updateNuevoClienteForm(updates: Partial<{
    nombreCliente: string;
    emailCliente: string;
    telefonoCliente: string;
    placa: string;
    marca: string;
    modelo: string;
    tipoVehiculoId: string;
    espacioId: string;
  }>): void {
    const currentForm = this.nuevoCliente();
    this.nuevoCliente.set({ ...currentForm, ...updates });
  }

  abrirModalEspacios(): void {
    this.showEspaciosModal.set(true);
  }

  cerrarModalEspacios(): void {
    this.showEspaciosModal.set(false);
  }

  seleccionarEspacio(espacio: { id: string; numero: string; estado: boolean; seccionId?: string }): void {
    // Convertir a EspacioDisponible (seccionId requerido)
    const espacioDisponible: EspacioDisponible = {
      id: espacio.id,
      numero: espacio.numero,
      estado: espacio.estado,
      seccionId: espacio.seccionId || '' // Proporcionar valor por defecto
    };
    
    this.espacioSeleccionado.set(espacioDisponible);
    
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
        alert('Cliente registrado exitosamente');
        
        // Generar PDF del ticket de forma asíncrona
        this.registroService.generarTicketPDF(response.data);
        
        // Resetear formulario y volver al menú
        this.resetFormNuevoCliente();
        this.volverAlMenu();
        
        // Recargar datos después de un delay para permitir que el PDF se genere
        setTimeout(() => {
          this.loadEspaciosDisponibles();
          this.loadClientesConVehiculos();
          this.isLoading.set(false);
        }, 200);
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

  updateAsignarEspacioVehiculo(vehiculoId: string): void {
    const currentForm = this.asignarEspacio();
    this.asignarEspacio.set({ ...currentForm, vehiculoId });
  }

  confirmarAsignacion(): void {
    const form = this.asignarEspacio();
    
    if (!form.vehiculoId || !form.espacioId) {
      alert('Por favor seleccione un vehículo y un espacio');
      return;
    }

    this.isLoading.set(true);
    this.registroService.asignarEspacio(form).subscribe({
      next: (response) => {
        alert('Espacio asignado exitosamente');
        
        // Generar PDF del ticket de forma asíncrona
        this.registroService.generarTicketPDF(response.data);
        
        // Resetear formulario y volver al menú
        this.resetFormAsignarEspacio();
        this.volverAlMenu();
        
        // Recargar datos después de un delay
        setTimeout(() => {
          this.loadEspaciosDisponibles();
          this.loadClientesConVehiculos();
          this.isLoading.set(false);
        }, 200);
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

  updateDesocuparEspacioForm(updates: Partial<{
    ticketId: string;
    metodoPago: string;
    montoPago: number;
    tipoTarifaId: string;
  }>): void {
    const currentForm = this.desocuparEspacio();
    this.desocuparEspacio.set({ ...currentForm, ...updates });
  }

  seleccionarVehiculoOcupado(ticketId: string): void {
    const form = this.desocuparEspacio();
    const vehiculo = this.vehiculosOcupados().find(v => v.ticket.id === ticketId);
    
    if (!vehiculo) return;
    
    // Extraer tipo de tarifa del vehículo
    const tipoTarifaId = vehiculo?.vehiculo?.tipoVehiculo?.tipotarifa?.id || '';
    
    // Usar el monto estimado calculado por el backend
    const montoEstimado = vehiculo.tiempoActual?.montoEstimado || 0;
    
    this.desocuparEspacio.set({ 
      ...form, 
      ticketId: ticketId,
      tipoTarifaId: tipoTarifaId,
      montoPago: montoEstimado // Monto calculado por el backend (editable por admin)
    });
  }

  /**
   * Calcula el monto sugerido basándose en:
   * 1. Tiempo de estadía del vehículo
   * 2. Tarifa del tipo de vehículo (precio por hora o por día)
   * 
   * El administrador puede modificar este monto antes de confirmar
   */
  calcularMontoSugerido(vehiculoOcupado: VehiculoOcupado): number {
    try {
      const fechaIngreso = new Date(vehiculoOcupado.ticket.fechaIngreso);
      const ahora = new Date();
      const diffMs = ahora.getTime() - fechaIngreso.getTime();
      
      // Calcular horas totales (con decimales)
      const horasTotales = diffMs / (1000 * 60 * 60);
      
      // Obtener precio por hora de la tarifa
      const precioHora = vehiculoOcupado.vehiculo?.tipoVehiculo?.tipotarifa?.precioHora || 0;
      const precioDia = vehiculoOcupado.vehiculo?.tipoVehiculo?.tipotarifa?.precioDia || 0;
      
      if (!precioHora && !precioDia) {
        console.warn('No se encontró información de tarifa para el vehículo');
        return 0;
      }
      
      // Si estuvo más de 8 horas, cobrar por día es más económico
      if (horasTotales >= 8 && precioDia > 0) {
        const dias = Math.ceil(horasTotales / 24);
        return parseFloat((dias * precioDia).toFixed(2));
      }
      
      // Cobrar por horas (redondear hacia arriba)
      const horasCobrar = Math.ceil(horasTotales);
      return parseFloat((horasCobrar * precioHora).toFixed(2));
      
    } catch (error) {
      console.error('Error calculando monto:', error);
      return 0;
    }
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
        alert('Espacio desocupado exitosamente');
        
        // Generar PDF del detalle de pago de forma asíncrona
        this.registroService.generarDetallePagoPDF(response.data);
        
        // Resetear formulario y volver al menú
        this.resetFormDesocuparEspacio();
        this.volverAlMenu();
        
        // Recargar datos después de un delay
        setTimeout(() => {
          this.loadEspaciosDisponibles();
          this.loadVehiculosOcupados();
          this.isLoading.set(false);
        }, 200);
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
