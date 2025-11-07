import { Restticketresponse } from "../interfaces/query-ticket-complete.interface";
import { TicketFull } from "../interfaces/search.interface";

export class TicketMapper {
  static toTicketFull(ticket: Restticketresponse): TicketFull {
    return {
      id: ticket.id,
      fechaIngreso: ticket.fechaIngreso,
      fechaSalida: ticket.fechaSalida,
      vehiculoPlaca: ticket.vehiculo.placa,
      espacioNumero: ticket.espacio.numero,
      estadoTicket: ticket.espacio.estado
    };
  }   
  static toTicketFullList(tickets: Restticketresponse[]): TicketFull[] {
    return tickets.map(TicketMapper.toTicketFull);
  }
}