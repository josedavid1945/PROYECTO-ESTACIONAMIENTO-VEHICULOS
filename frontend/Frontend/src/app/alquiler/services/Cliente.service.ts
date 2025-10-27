import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ClienteMapper } from '../mappers/cliente.mapper';
import { map } from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient); 
  private API_URL = 'http://localhost:3000';
  showClientes() {
    return this.http.get<Cliente[]>(`${this.API_URL}/clientes`).pipe(
      map((response) => ClienteMapper.mapClienteDtoArrayToClienteArray(response))
    );
  }

}
