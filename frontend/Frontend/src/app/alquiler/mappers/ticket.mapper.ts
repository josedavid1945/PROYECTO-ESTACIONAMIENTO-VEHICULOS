import { Ticket, Vehiculo, Espacio, DetallePago, TicketFull } from "../interfaces/search.interface";

export class TicketMapper {
  
  // Ticket Mappers
  static toTicketDTO(data: any): Ticket {
    return {
      id: data.id,
      fechaIngreso: new Date(data.fechaIngreso),
      fechaSalida: data.fechaSalida ? new Date(data.fechaSalida) : undefined,
      vehiculoId: data.vehiculoId,
      espacioId: data.espacioId,
      detallePagoId: data.detallePagoId
    };
  }

  static toTicketFullDTO(ticket: Ticket, vehiculo: Vehiculo, espacio: Espacio): TicketFull {
    return {
      id: ticket.id,
      fechaIngreso: ticket.fechaIngreso,
      fechaSalida: ticket.fechaSalida,
      vehiculoPlaca: vehiculo.placa,
      espacioNumero: espacio.numero,
      estadoTicket: ticket.fechaSalida ? 'Cerrado' : 'Abierto'
    };
  }

  static toTicketFullDTOFromAPI(data: any): TicketFull {
    return {
      id: data.id,
      fechaIngreso: new Date(data.fechaIngreso),
      fechaSalida: data.fechaSalida ? new Date(data.fechaSalida) : undefined,
      vehiculoPlaca: data.vehiculo?.placa || data.vehiculoPlaca,
      espacioNumero: data.espacio?.numero || data.espacioNumero,
      estadoTicket: data.fechaSalida ? 'Cerrado' : 'Abierto'
    };
  }

  // Vehiculo Mappers
  static toVehiculoDTO(data: any): Vehiculo {
    return {
      id: data.id,
      marca: data.marca,
      modelo: data.modelo,
      placa: data.placa,
      clienteId: data.clienteId,
      tipoVehiculoId: data.tipoVehiculoId
    };
  }

  // Espacio Mappers
  static toEspacioDTO(data: any): Espacio {
    return {
      id: data.id,
      numero: data.numero,
      seccionId: data.seccionId,
      estado: data.estado
    };
  }

  // DetallePago Mappers
  static toDetallePagoDTO(data: any): DetallePago {
    return {
      id: data.id,
      monto: data.monto,
      metodoPago: data.metodoPago,
      fechaPago: new Date(data.fechaPago),
      pagoTotal: data.pagoTotal,
      ticketId: data.ticketId,
      pagoId: data.pagoId
    };
  }
}