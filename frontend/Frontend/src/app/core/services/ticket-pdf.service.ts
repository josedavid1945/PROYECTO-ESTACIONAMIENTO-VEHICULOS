import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

export interface TicketData {
  ticketId: string;
  fechaIngreso: string | Date;
  placa: string;
  marca?: string;
  modelo?: string;
  espacio: string;
  seccion?: string;
  clienteNombre?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  tipoVehiculo?: string;
  tarifa?: {
    precioHora: number;
    precioDia: number;
  };
}

/**
 * Servicio para generar PDFs de tickets de estacionamiento
 */
@Injectable({
  providedIn: 'root'
})
export class TicketPdfService {
  
  /**
   * Genera y descarga un PDF del ticket de ingreso
   */
  generateTicketPdf(ticket: TicketData): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150] // Tamaño tipo ticket térmico
    });

    const pageWidth = 80;
    const marginLeft = 5;
    const marginRight = 5;
    const contentWidth = pageWidth - marginLeft - marginRight;
    
    let y = 10;

    // ===== ENCABEZADO =====
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTACIONAMIENTO', pageWidth / 2, y, { align: 'center' });
    y += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Control de Vehículos', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 6;

    // ===== DATOS DEL TICKET =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET DE INGRESO', pageWidth / 2, y, { align: 'center' });
    y += 8;

    // ID del ticket (abreviado)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const ticketIdShort = ticket.ticketId?.substring(0, 8) || 'N/A';
    doc.text(`Ticket: #${ticketIdShort}...`, marginLeft, y);
    y += 5;

    // Fecha de ingreso
    const fechaIngreso = ticket.fechaIngreso 
      ? new Date(ticket.fechaIngreso).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleString('es-ES');
    doc.text(`Fecha: ${fechaIngreso}`, marginLeft, y);
    y += 8;

    // Línea separadora
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 6;

    // ===== DATOS DEL VEHÍCULO =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('VEHÍCULO', marginLeft, y);
    y += 5;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    // Placa destacada
    doc.text(ticket.placa || 'N/A', pageWidth / 2, y, { align: 'center' });
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (ticket.marca) {
      doc.text(`Marca: ${ticket.marca}`, marginLeft, y);
      y += 4;
    }
    if (ticket.modelo) {
      doc.text(`Modelo: ${ticket.modelo}`, marginLeft, y);
      y += 4;
    }
    if (ticket.tipoVehiculo) {
      doc.text(`Tipo: ${ticket.tipoVehiculo}`, marginLeft, y);
      y += 4;
    }
    y += 4;

    // Línea separadora
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 6;

    // ===== ESPACIO ASIGNADO =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ESPACIO ASIGNADO', marginLeft, y);
    y += 6;

    // Espacio destacado (grande)
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const espacioDisplay = ticket.espacio || 'N/A';
    doc.text(espacioDisplay, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // ===== CLIENTE (si hay datos) =====
    if (ticket.clienteNombre && ticket.clienteNombre !== 'Cliente') {
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE', marginLeft, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${ticket.clienteNombre}`, marginLeft, y);
      y += 4;
      
      if (ticket.clienteTelefono && ticket.clienteTelefono !== '0000000000') {
        doc.text(`Tel: ${ticket.clienteTelefono}`, marginLeft, y);
        y += 4;
      }
      y += 2;
    }

    // ===== TARIFAS =====
    if (ticket.tarifa) {
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      y += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TARIFAS', marginLeft, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Por hora: $${ticket.tarifa.precioHora.toFixed(2)}`, marginLeft, y);
      y += 4;
      doc.text(`Por día: $${ticket.tarifa.precioDia.toFixed(2)}`, marginLeft, y);
      y += 6;
    }

    // ===== PIE DEL TICKET =====
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Conserve este ticket para', pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text('retirar su vehículo', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('¡Gracias por su preferencia!', pageWidth / 2, y, { align: 'center' });

    // Descargar el PDF
    const fileName = `ticket_${ticket.placa}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  }

  /**
   * Genera un PDF del ticket y lo abre en una nueva pestaña
   */
  generateAndPreview(ticket: TicketData): void {
    const doc = this.createTicketDocument(ticket);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  }

  /**
   * Crea el documento PDF (helper interno)
   */
  private createTicketDocument(ticket: TicketData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 150]
    });

    // Mismo contenido que generateTicketPdf...
    // (simplificado para reutilización)
    
    const pageWidth = 80;
    let y = 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTACIONAMIENTO', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12);
    doc.text('TICKET DE INGRESO', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(16);
    doc.text(ticket.placa || 'N/A', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(24);
    doc.text(ticket.espacio || 'N/A', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fecha = new Date(ticket.fechaIngreso).toLocaleString('es-ES');
    doc.text(`Ingreso: ${fecha}`, pageWidth / 2, y, { align: 'center' });

    return doc;
  }

  /**
   * Extrae datos de ticket desde la respuesta del agente MCP
   */
  extractTicketDataFromResponse(response: any): TicketData | null {
    try {
      // La respuesta del tool registrar_ingreso tiene esta estructura:
      // { success: true, ticket: {...}, vehiculo: {...}, espacio: {...}, cliente: {...}, tipoVehiculo: {...}, tarifa: {...} }
      
      if (!response?.success || !response?.ticket) {
        return null;
      }

      return {
        ticketId: response.ticket.id || '',
        fechaIngreso: response.ticket.fechaIngreso || new Date(),
        placa: response.vehiculo?.placa || '',
        marca: response.vehiculo?.marca,
        modelo: response.vehiculo?.modelo,
        espacio: response.espacio?.numero || '',
        seccion: response.espacio?.seccion,
        clienteNombre: response.cliente?.nombre,
        clienteEmail: response.cliente?.email,
        clienteTelefono: response.cliente?.telefono,
        tipoVehiculo: response.tipoVehiculo?.categoria,
        tarifa: response.tarifa ? {
          precioHora: response.tarifa.precioHora || 0,
          precioDia: response.tarifa.precioDia || 0
        } : undefined
      };
    } catch {
      return null;
    }
  }
}
