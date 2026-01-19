import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ==================== INTERFACES ====================
export interface ClienteConVehiculos {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  vehiculos: Vehiculo[];
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  clienteId: string;
  tipoVehiculoId: string;
  tipoVehiculo?: {
    id: string;
    categoria: string;
    descripcion: string;
    tipoTarifaId: string;
    tipotarifa?: {
      id: string;
      tipoTarifa: string;
      precioHora: number;
      precioDia: number;
    };
  };
}

export interface EspacioDisponible {
  id: string;
  numero: string;
  estado: boolean;
  seccionId: string;
}

export interface VehiculoOcupado {
  ticket: {
    id: string;
    fechaIngreso: string;
  };
  vehiculo: {
    placa: string;
    marca: string;
    modelo: string;
    tipoVehiculo?: {
      id: string;
      categoria: string;
      tipotarifa?: {
        id: string;
        tipoTarifa: string;
        precioHora: number;
        precioDia: number;
      } | null;
    } | null;
  } | null;
  espacio: {
    numero: string;
  };
  cliente: {
    nombre: string;
  } | null;
  tiempoActual: {
    horas: number;
    minutos: number;
    montoEstimado: number;
  };
}

// ==================== DTOs ====================
export interface RegistrarClienteCompletoDto {
  nombreCliente: string;
  emailCliente: string;
  telefonoCliente: string;
  placa: string;
  marca: string;
  modelo: string;
  tipoVehiculoId: string;
  espacioId: string;
}

export interface AsignarEspacioDto {
  vehiculoId: string;
  espacioId: string;
}

export interface DesocuparEspacioDto {
  ticketId: string;
  metodoPago: string;
  montoPago: number;
  tipoTarifaId: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistroService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  
  // Cache para las plantillas HTML
  private ticketTemplate: string | null = null;
  private detallePagoTemplate: string | null = null;

  // ==================== OPERACIONES PRINCIPALES ====================
  
  registrarClienteCompleto(dto: RegistrarClienteCompletoDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro/cliente-completo`, dto);
  }

  asignarEspacio(dto: AsignarEspacioDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro/asignar-espacio`, dto);
  }

  desocuparEspacio(dto: DesocuparEspacioDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/registro/desocupar-espacio`, dto);
  }

  // ==================== CONSULTAS ====================
  
  getEspaciosDisponibles(): Observable<EspacioDisponible[]> {
    return this.http.get<EspacioDisponible[]>(`${this.apiUrl}/registro/espacios-disponibles`);
  }

  getVehiculosOcupados(): Observable<VehiculoOcupado[]> {
    return this.http.get<VehiculoOcupado[]>(`${this.apiUrl}/registro/vehiculos-ocupados`);
  }

  getClientesConVehiculos(): Observable<ClienteConVehiculos[]> {
    return this.http.get<ClienteConVehiculos[]>(`${this.apiUrl}/registro/clientes-con-vehiculos`);
  }

  // ==================== GENERACIÓN DE PDFs ====================
  
  private loadTicketTemplate(): Observable<string> {
    if (this.ticketTemplate) {
      return new Observable(observer => {
        observer.next(this.ticketTemplate!);
        observer.complete();
      });
    }
    // Cargar desde assets configurados en angular.json
    return this.http.get('assets/plantillas/ticket.html', { responseType: 'text' })
      .pipe(
        tap((template: string) => this.ticketTemplate = template)
      );
  }

  private loadDetallePagoTemplate(): Observable<string> {
    if (this.detallePagoTemplate) {
      return new Observable(observer => {
        observer.next(this.detallePagoTemplate!);
        observer.complete();
      });
    }
    // Cargar desde assets configurados en angular.json
    return this.http.get('assets/plantillas/detalle-pago.html', { responseType: 'text' })
      .pipe(
        tap((template: string) => this.detallePagoTemplate = template)
      );
  }

  generarTicketPDF(data: any): void {
    this.loadTicketTemplate().subscribe({
      next: (template) => {
        const content = this.buildTicketContent(template, data);
        this.downloadPDF(content, `ticket-${data.ticket.id}.pdf`);
      },
      error: (error) => {
        console.error('Error cargando plantilla de ticket:', error);
        alert('Error al generar el ticket PDF');
      }
    });
  }

  generarDetallePagoPDF(data: any): void {
    this.loadDetallePagoTemplate().subscribe({
      next: (template) => {
        const content = this.buildDetallePagoContent(template, data);
        this.downloadPDF(content, `detalle-pago-${data.detallePago.id}.pdf`);
      },
      error: (error) => {
        console.error('Error cargando plantilla de detalle de pago:', error);
        alert('Error al generar el detalle de pago PDF');
      }
    });
  }

  private buildTicketContent(template: string, data: any): string {
    const fechaIngreso = new Date(data.ticket.fechaIngreso).toLocaleString('es-EC');
    
    // Reemplazar los placeholders en la plantilla
    return template
      .replace(/{{TICKET_ID}}/g, data.ticket.id)
      .replace(/{{FECHA_INGRESO}}/g, fechaIngreso)
      .replace(/{{ESPACIO_NUMERO}}/g, data.espacio?.numero || 'N/A')
      .replace(/{{VEHICULO_PLACA}}/g, data.vehiculo?.placa || 'N/A')
      .replace(/{{VEHICULO_MARCA}}/g, data.vehiculo?.marca || 'N/A')
      .replace(/{{VEHICULO_MODELO}}/g, data.vehiculo?.modelo || 'N/A')
      .replace(/{{CLIENTE_NOMBRE}}/g, data.cliente?.nombre || 'N/A')
      .replace(/{{CLIENTE_EMAIL}}/g, data.cliente?.email || 'N/A')
      .replace(/{{CLIENTE_TELEFONO}}/g, data.cliente?.telefono || 'N/A');
  }

  private buildDetallePagoContent(template: string, data: any): string {
    const fechaPago = new Date(data.detallePago.fechaPago).toLocaleString('es-EC');
    const fechaIngreso = new Date(data.ticket.fechaIngreso).toLocaleString('es-EC');
    const fechaSalida = new Date(data.ticket.fechaSalida).toLocaleString('es-EC');
    
    // Calcular tiempo de estadía
    const entrada = new Date(data.ticket.fechaIngreso);
    const salida = new Date(data.ticket.fechaSalida);
    const diff = salida.getTime() - entrada.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const tiempoEstadia = `${horas}h ${minutos}min`;
    
    // Reemplazar los placeholders en la plantilla
    return template
      .replace(/{{DETALLE_PAGO_ID}}/g, data.detallePago.id)
      .replace(/{{FECHA_PAGO}}/g, fechaPago)
      .replace(/{{METODO_PAGO}}/g, data.detallePago.metodo)
      .replace(/{{FECHA_INGRESO}}/g, fechaIngreso)
      .replace(/{{FECHA_SALIDA}}/g, fechaSalida)
      .replace(/{{TIEMPO_ESTADIA}}/g, tiempoEstadia)
      .replace(/{{ESPACIO_NUMERO}}/g, data.espacio?.numero || 'N/A')
      .replace(/{{VEHICULO_PLACA}}/g, data.vehiculo?.placa || 'N/A')
      .replace(/{{VEHICULO_MARCA}}/g, data.vehiculo?.marca || 'N/A')
      .replace(/{{VEHICULO_MODELO}}/g, data.vehiculo?.modelo || 'N/A')
      .replace(/{{CLIENTE_NOMBRE}}/g, data.cliente?.nombre || 'N/A')
      .replace(/{{CLIENTE_EMAIL}}/g, data.cliente?.email || 'N/A')
      .replace(/{{CLIENTE_TELEFONO}}/g, data.cliente?.telefono || 'N/A')
      .replace(/{{TOTAL_PAGADO}}/g, `$${data.detallePago.pagoTotal.toFixed(2)}`);
  }

  private downloadPDF(htmlContent: string, filename: string): void {
    // Usar setTimeout para no bloquear el hilo principal
    setTimeout(() => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Esperar a que se cargue y luego imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
      }
    }, 100);
  }
}
