import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Apollo, gql } from 'apollo-angular';
import { TicketFull, VehiculoCompleto } from '../interfaces/search.interface';
import { Restticketresponse } from '../interfaces/query-ticket-complete.interface';
import { TicketMapper } from '../mappers/ticket.mapper';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apollo = inject(Apollo);

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

  // Método básico para obtener tickets
  getTickets(): Observable<TicketFull[]> {
    return this.apollo.watchQuery<{ tickets: Restticketresponse[] }>({
      query: this.GET_TICKETS
    }).valueChanges.pipe(
      map(result => (result.data?.tickets ?? []) as Restticketresponse[]),
      map(tickets => TicketMapper.toTicketFullList(tickets))
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