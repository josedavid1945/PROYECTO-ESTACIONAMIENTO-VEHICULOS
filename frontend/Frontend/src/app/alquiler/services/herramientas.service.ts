import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces
export interface TipoTarifa {
  id: string;
  tipoTarifa: string;
  precioHora: number;
  precioDia: number;
}

export interface TipoMulta {
  id: string;
  nombre: string;
  monto: number;
}

export interface TipoVehiculo {
  id: string;
  categoria: string;
  descripcion: string;
  tipotarifa: TipoTarifa;
}

@Injectable({
  providedIn: 'root'
})
export class HerramientasService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== TARIFAS ====================
  getTarifas(): Observable<TipoTarifa[]> {
    return this.http.get<TipoTarifa[]>(`${this.apiUrl}/tipo-tarifa`);
  }

  createTarifa(tipoTarifa: string, precioHora: number, precioDia: number): Observable<TipoTarifa> {
    return this.http.post<TipoTarifa>(`${this.apiUrl}/tipo-tarifa`, {
      tipoTarifa,
      precioHora,
      precioDia
    });
  }

  deleteTarifa(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipo-tarifa/${id}`);
  }

  // ==================== MULTAS ====================
  getMultas(): Observable<TipoMulta[]> {
    return this.http.get<TipoMulta[]>(`${this.apiUrl}/tipo-multa`);
  }

  createMulta(nombre: string, monto: number): Observable<TipoMulta> {
    return this.http.post<TipoMulta>(`${this.apiUrl}/tipo-multa`, {
      nombre,
      monto
    });
  }

  deleteMulta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipo-multa/${id}`);
  }

  // ==================== TIPOS DE VEHÍCULO ====================
  getTiposVehiculo(): Observable<TipoVehiculo[]> {
    return this.http.get<TipoVehiculo[]>(`${this.apiUrl}/tipo-vehiculo`);
  }

  createTipoVehiculo(categoria: string, descripcion: string, tipoTarifaId: string): Observable<TipoVehiculo> {
    return this.http.post<TipoVehiculo>(`${this.apiUrl}/tipo-vehiculo`, {
      categoria,
      descripcion,
      tipoTarifaId
    });
  }

  deleteTipoVehiculo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipo-vehiculo/${id}`);
  }
}
