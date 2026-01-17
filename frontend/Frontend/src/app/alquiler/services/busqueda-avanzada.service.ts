import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Apollo, gql } from 'apollo-angular';
import { environment } from '../../../environments/environment';
import { TicketFull, VehiculoCompleto } from '../interfaces/search.interface';
import { Restticketresponse } from '../interfaces/query-ticket-complete.interface';
import { TicketMapper } from '../mappers/ticket.mapper';

interface RestTicket {
  id: string;
  fechaIngreso: string;
  fechaSalida?: string;
  vehiculoId: string;
  espacioId: string;
  detallePagoId?: string;
}

interface RestVehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  clienteId: string;
  tipoVehiculoId: string;
}

interface RestEspacio {
  id: string;
  numero: string;
  estado: boolean;
  seccionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apollo = inject(Apollo);
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private GET_TICKETS = gql`
    query GetTickets {
      tickets {
        id
        fechaIngreso
        fechaSalida
        vehiculo {
          placa
          marca
          modelo
          clienteNombre
        }
        espacio {
          numero
          estado
        }
        detallePago {
          metodo
          pagoTotal
        }
      }
    }
  `;

  private GET_VEHICULOS_COMPLETOS = gql`
    query GetVehiculosCompletos {
      vehiculosCompletos {
        id
        placa
        marca
        modelo
        cliente {
          id
          nombre
          email
          telefono
        }
        tipoVehiculo {
          id
          categoria
          descripcion
          tipotarifa {
            id
            tipoTarifa
            precioHora
            precioDia
          }
        }
      }
    }
  `;

  // Método básico para obtener tickets - USANDO API REST
  getTickets(): Observable<TicketFull[]> {
    console.log('🔍 Obteniendo tickets desde API REST...');
    
    return forkJoin({
      tickets: this.http.get<RestTicket[]>(`${this.apiUrl}/tickets`),
      vehiculos: this.http.get<RestVehiculo[]>(`${this.apiUrl}/vehiculos`),
      espacios: this.http.get<RestEspacio[]>(`${this.apiUrl}/espacios`)
    }).pipe(
      map(({ tickets, vehiculos, espacios }) => {
        console.log('📦 Datos REST recibidos:', {
          tickets: tickets.length,
          vehiculos: vehiculos.length,
          espacios: espacios.length
        });
        
        // Crear maps para búsqueda rápida
        const vehiculosMap = new Map(vehiculos.map(v => [v.id, v]));
        const espaciosMap = new Map(espacios.map(e => [e.id, e]));
        
        // Filtrar y mapear solo los tickets que tienen vehiculo y espacio válidos
        const ticketsFull: TicketFull[] = tickets
          .filter(t => {
            const hasVehiculo = vehiculosMap.has(t.vehiculoId);
            const hasEspacio = espaciosMap.has(t.espacioId);
            
            if (!hasVehiculo) {
              console.warn(`⚠️ Ticket ${t.id} tiene vehiculoId ${t.vehiculoId} inválido`);
            }
            if (!hasEspacio) {
              console.warn(`⚠️ Ticket ${t.id} tiene espacioId ${t.espacioId} inválido`);
            }
            
            return hasVehiculo && hasEspacio;
          })
          .map(t => {
            const vehiculo = vehiculosMap.get(t.vehiculoId)!;
            const espacio = espaciosMap.get(t.espacioId)!;
            
            return {
              id: t.id,
              fechaIngreso: new Date(t.fechaIngreso),
              fechaSalida: t.fechaSalida ? new Date(t.fechaSalida) : undefined,
              vehiculoPlaca: vehiculo.placa,
              espacioNumero: espacio.numero,
              estadoTicket: espacio.estado ? 'Ocupado' : 'Desocupado'
            };
          });
        
        console.log('✅ Tickets mapeados:', ticketsFull.length);
        console.log('📊 Primeros 3 tickets:', ticketsFull.slice(0, 3));
        
        return ticketsFull;
      })
    );
  }

  // Método para obtener vehículos completos con toda su información relacionada
  getVehiculosCompletos(): Observable<VehiculoCompleto[]> {
    return this.apollo.watchQuery<{ vehiculosCompletos: VehiculoCompleto[] }>({
      query: this.GET_VEHICULOS_COMPLETOS,
      fetchPolicy: 'network-only' // Siempre obtiene datos frescos del servidor
    }).valueChanges.pipe(
      map(result => (result.data?.vehiculosCompletos ?? []) as VehiculoCompleto[])
    );
  }
}