import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    vehiculoId: string;
    espacioId: string;
  };
  vehiculo: Vehiculo;
  espacio: EspacioDisponible;
  cliente: {
    id: string;
    nombre: string;
    email: string;
    telefono: string;
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
  private apiUrl = 'http://localhost:3000';

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
  
  generarTicketPDF(data: any): void {
    const content = this.buildTicketContent(data);
    this.downloadPDF(content, `ticket-${data.ticket.id}.pdf`);
  }

  generarDetallePagoPDF(data: any): void {
    const content = this.buildDetallePagoContent(data);
    this.downloadPDF(content, `detalle-pago-${data.detallePago.id}.pdf`);
  }

  private buildTicketContent(data: any): string {
    const fechaIngreso = new Date(data.ticket.fechaIngreso).toLocaleString('es-EC');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; color: #10b981; }
          .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
          .section { margin: 20px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
          .field { margin: 10px 0; display: flex; }
          .field-label { font-weight: bold; color: #555; min-width: 150px; }
          .field-value { color: #333; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .qr-placeholder { width: 150px; height: 150px; border: 2px dashed #ccc; margin: 20px auto; display: flex; align-items: center; justify-content: center; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🚗 TICKET DE ESTACIONAMIENTO</div>
          <div class="subtitle">Comprobante de Ingreso</div>
        </div>

        <div class="section">
          <div class="section-title">Información del Ticket</div>
          <div class="field">
            <span class="field-label">Nº Ticket:</span>
            <span class="field-value">${data.ticket.id}</span>
          </div>
          <div class="field">
            <span class="field-label">Fecha y Hora:</span>
            <span class="field-value">${fechaIngreso}</span>
          </div>
          <div class="field">
            <span class="field-label">Espacio Asignado:</span>
            <span class="field-value">${data.espacio?.numero || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Vehículo</div>
          <div class="field">
            <span class="field-label">Placa:</span>
            <span class="field-value">${data.vehiculo?.placa || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Marca:</span>
            <span class="field-value">${data.vehiculo?.marca || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Modelo:</span>
            <span class="field-value">${data.vehiculo?.modelo || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Cliente</div>
          <div class="field">
            <span class="field-label">Nombre:</span>
            <span class="field-value">${data.cliente?.nombre || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Email:</span>
            <span class="field-value">${data.cliente?.email || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Teléfono:</span>
            <span class="field-value">${data.cliente?.telefono || 'N/A'}</span>
          </div>
        </div>

        <div class="footer">
          <p>Este ticket es válido para retirar su vehículo.</p>
          <p>Conserve este documento hasta la salida.</p>
          <p>Sistema de Gestión de Estacionamiento © 2025</p>
        </div>
      </body>
      </html>
    `;
  }

  private buildDetallePagoContent(data: any): string {
    const fechaPago = new Date(data.detallePago.fechaPago).toLocaleString('es-EC');
    const fechaIngreso = new Date(data.ticket.fechaIngreso).toLocaleString('es-EC');
    const fechaSalida = new Date(data.ticket.fechaSalida).toLocaleString('es-EC');
    
    // Calcular tiempo de estadía
    const entrada = new Date(data.ticket.fechaIngreso);
    const salida = new Date(data.ticket.fechaSalida);
    const diff = salida.getTime() - entrada.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 28px; font-weight: bold; color: #3b82f6; }
          .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
          .section { margin: 20px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 12px; }
          .field { margin: 10px 0; display: flex; }
          .field-label { font-weight: bold; color: #555; min-width: 180px; }
          .field-value { color: #333; }
          .total-box { background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
          .total-label { font-size: 18px; color: #666; }
          .total-amount { font-size: 36px; font-weight: bold; color: #3b82f6; margin-top: 10px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">💵 DETALLE DE PAGO</div>
          <div class="subtitle">Comprobante de Salida y Pago</div>
        </div>

        <div class="section">
          <div class="section-title">Información del Pago</div>
          <div class="field">
            <span class="field-label">Nº Comprobante:</span>
            <span class="field-value">${data.detallePago.id}</span>
          </div>
          <div class="field">
            <span class="field-label">Fecha de Pago:</span>
            <span class="field-value">${fechaPago}</span>
          </div>
          <div class="field">
            <span class="field-label">Método de Pago:</span>
            <span class="field-value">${data.detallePago.metodo}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Tiempo de Estadía</div>
          <div class="field">
            <span class="field-label">Fecha de Ingreso:</span>
            <span class="field-value">${fechaIngreso}</span>
          </div>
          <div class="field">
            <span class="field-label">Fecha de Salida:</span>
            <span class="field-value">${fechaSalida}</span>
          </div>
          <div class="field">
            <span class="field-label">Tiempo Total:</span>
            <span class="field-value">${horas}h ${minutos}min</span>
          </div>
          <div class="field">
            <span class="field-label">Espacio Utilizado:</span>
            <span class="field-value">${data.espacio?.numero || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Vehículo</div>
          <div class="field">
            <span class="field-label">Placa:</span>
            <span class="field-value">${data.vehiculo?.placa || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Marca:</span>
            <span class="field-value">${data.vehiculo?.marca || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Modelo:</span>
            <span class="field-value">${data.vehiculo?.modelo || 'N/A'}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Cliente</div>
          <div class="field">
            <span class="field-label">Nombre:</span>
            <span class="field-value">${data.cliente?.nombre || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Email:</span>
            <span class="field-value">${data.cliente?.email || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="field-label">Teléfono:</span>
            <span class="field-value">${data.cliente?.telefono || 'N/A'}</span>
          </div>
        </div>

        <div class="total-box">
          <div class="total-label">TOTAL PAGADO</div>
          <div class="total-amount">$${data.detallePago.pagoTotal.toFixed(2)}</div>
        </div>

        <div class="footer">
          <p>Gracias por utilizar nuestros servicios.</p>
          <p>¡Esperamos verle pronto!</p>
          <p>Sistema de Gestión de Estacionamiento © 2025</p>
        </div>
      </body>
      </html>
    `;
  }

  private downloadPDF(htmlContent: string, filename: string): void {
    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Esperar a que se cargue y luego imprimir
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}
