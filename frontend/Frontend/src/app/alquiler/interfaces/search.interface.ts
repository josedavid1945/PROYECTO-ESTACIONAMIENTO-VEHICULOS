export interface Ticket {
  id: string;
  fechaIngreso: Date;
  fechaSalida?: Date;
  vehiculoId: string;
  espacioId: string;
  detallePagoId?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}

export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  placa: string;
  clienteId: string;
  tipoVehiculoId: string;
}

export interface Espacio {
  id: string;
  numero: string;
  seccionId: string;
  estado: string;
}

export interface DetallePago {
  id: string;
  monto: number;
  metodoPago: string;
  fechaPago: Date;
  pagoTotal: number;
  ticketId: string;
  pagoId: string;
}

export interface TicketFull {
  id: string;
  fechaIngreso: Date;
  fechaSalida?: Date;
  vehiculoPlaca: string;
  espacioNumero: string;
  estadoTicket: string;
}