import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DetallePago, Espacio, Ticket, TicketFull, Vehiculo } from '../interfaces/search.interface';
import { TicketMapper } from '../mappers/ticket.mapper';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient); 
  private API_URL = 'http://localhost:3000';

  // Obtener todos los tickets básicos
  getTickets(): Observable<Ticket[]> {
    return this.http.get<any[]>(`${this.API_URL}/tickets`).pipe(
      map(tickets => tickets.map(ticket => TicketMapper.toTicketDTO(ticket))),
      catchError(error => {
        console.error('Error fetching tickets:', error);
        return of([]);
      })
    );
  }

  // Obtener espacio por ID
  getEspacioById(id: string): Observable<Espacio> {
    return this.http.get<any>(`${this.API_URL}/espacios/${id}`).pipe(
      map(espacio => TicketMapper.toEspacioDTO(espacio)),
      catchError(error => {
        console.error(`Error fetching espacio ${id}:`, error);
        throw error;
      })
    );
  }

  // Obtener vehículo por ID
  getVehiculoById(id: string): Observable<Vehiculo> {
    return this.http.get<any>(`${this.API_URL}/vehiculos/${id}`).pipe(
      map(vehiculo => TicketMapper.toVehiculoDTO(vehiculo)),
      catchError(error => {
        console.error(`Error fetching vehiculo ${id}:`, error);
        throw error;
      })
    );
  }

  // Obtener detalle de pago por ID
  getDetallePagoById(id: string): Observable<DetallePago> {
    return this.http.get<any>(`${this.API_URL}/detalle-pago/${id}`).pipe(
      map(detallePago => TicketMapper.toDetallePagoDTO(detallePago)),
      catchError(error => {
        console.error(`Error fetching detalle pago ${id}:`, error);
        throw error;
      })
    );
  }

  // Obtener tickets completos con información de vehículo y espacio
  getTicketsCompletos(): Observable<TicketFull[]> {
    return this.getTickets().pipe(
      switchMap(tickets => {
        if (tickets.length === 0) {
          return of([]);
        }

        // Crear observables para cada ticket con su información completa
        const ticketsCompletos = tickets.map(ticket =>
          forkJoin({
            vehiculo: this.getVehiculoById(ticket.vehiculoId),
            espacio: this.getEspacioById(ticket.espacioId)
          }).pipe(
            map(({ vehiculo, espacio }) => 
              TicketMapper.toTicketFullDTO(ticket, vehiculo, espacio)
            ),
            catchError(error => {
              console.error(`Error building complete ticket ${ticket.id}:`, error);
              // Retornar un ticket básico en caso de error
              return of({
                id: ticket.id,
                fechaIngreso: ticket.fechaIngreso,
                fechaSalida: ticket.fechaSalida,
                vehiculoPlaca: 'N/A',
                espacioNumero: 'N/A',
                estadoTicket: ticket.fechaSalida ? 'Cerrado' : 'Abierto'
              } as TicketFull);
            })
          )
        );

        return forkJoin(ticketsCompletos);
      }),
      catchError(error => {
        console.error('Error in getTicketsCompletos:', error);
        return of([]);
      })
    );
  }

  // Obtener ticket completo individual por ID
  getTicketCompletoById(ticketId: string): Observable<TicketFull> {
    return forkJoin({
      ticket: this.http.get<any>(`${this.API_URL}/tickets/${ticketId}`),
      vehiculo: this.http.get<any>(`${this.API_URL}/vehiculos`).pipe(
        map(vehiculos => vehiculos.find((v: any) => v.ticketId === ticketId))
      ),
      espacio: this.http.get<any>(`${this.API_URL}/espacios`).pipe(
        map(espacios => espacios.find((e: any) => e.ticketId === ticketId))
      )
    }).pipe(
      map(({ ticket, vehiculo, espacio }) => 
        TicketMapper.toTicketFullDTO(
          TicketMapper.toTicketDTO(ticket),
          TicketMapper.toVehiculoDTO(vehiculo),
          TicketMapper.toEspacioDTO(espacio)
        )
      ),
      catchError(error => {
        console.error(`Error fetching complete ticket ${ticketId}:`, error);
        throw error;
      })
    );
  }
}