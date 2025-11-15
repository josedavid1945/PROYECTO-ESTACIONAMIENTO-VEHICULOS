export interface TicketFull {
  id: string;
  fechaIngreso: Date;
  fechaSalida?: Date;
  vehiculoPlaca: string;
  espacioNumero: string;
  estadoTicket: string;
}

// Interfaces para vehículos completos
export interface TipoTarifa {
  id: string;
  tipoTarifa: string;
  precioHora: number;
  precioDia: number;
}

export interface TipoVehiculo {
  id: string;
  categoria: string;
  descripcion: string;
  tipotarifa: TipoTarifa;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}

export interface VehiculoCompleto {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  cliente: Cliente;
  tipoVehiculo: TipoVehiculo;
}