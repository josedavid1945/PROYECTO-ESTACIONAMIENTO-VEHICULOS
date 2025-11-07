export interface TicketFull {
  id: string;
  fechaIngreso: Date;
  fechaSalida?: Date;
  vehiculoPlaca: string;
  espacioNumero: string;
  estadoTicket: string;
}