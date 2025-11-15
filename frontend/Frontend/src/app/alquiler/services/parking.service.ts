import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Espacio {
  id: string;
  numero: string;
  estado: boolean;
  seccionId: string;
}

export interface Seccion {
  id: string;
  letraSeccion: string;
  espacios: Espacio[];
}

export interface CreateSeccionDto {
  letraSeccion: string;
}

export interface CreateEspacioDto {
  numero: string;
  estado: boolean;
  seccionId: string;
}

export interface CreateMultipleEspaciosDto {
  seccionId: string;
  numeroInicio: number;
  numeroFin: number;
}

@Injectable({
  providedIn: 'root'
})
export class ParkingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000';

  // ==================== SECCIONES ====================
  getSeccionesWithEspacios(): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.apiUrl}/secciones/with-espacios`);
  }

  getSecciones(): Observable<Seccion[]> {
    return this.http.get<Seccion[]>(`${this.apiUrl}/secciones`);
  }

  createSeccion(letraSeccion: string): Observable<Seccion> {
    return this.http.post<Seccion>(`${this.apiUrl}/secciones`, { letraSeccion });
  }

  deleteSeccion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/secciones/${id}`);
  }

  // ==================== ESPACIOS ====================
  getEspacios(): Observable<Espacio[]> {
    return this.http.get<Espacio[]>(`${this.apiUrl}/espacios`);
  }

  createEspacio(createEspacioDto: CreateEspacioDto): Observable<Espacio> {
    return this.http.post<Espacio>(`${this.apiUrl}/espacios`, createEspacioDto);
  }

  createMultipleEspacios(data: CreateMultipleEspaciosDto): Observable<Espacio[]> {
    const espacios: CreateEspacioDto[] = [];
    for (let i = data.numeroInicio; i <= data.numeroFin; i++) {
      espacios.push({
        numero: i.toString(),
        estado: true, // Todos los espacios comienzan disponibles
        seccionId: data.seccionId
      });
    }
    
    // Creamos todos los espacios en paralelo
    const requests = espacios.map(espacio => this.createEspacio(espacio));
    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise()))
        .then(results => {
          observer.next(results.filter((r): r is Espacio => r !== undefined));
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  updateEspacioEstado(id: string, estado: boolean): Observable<Espacio> {
    return this.http.patch<Espacio>(`${this.apiUrl}/espacios/${id}`, { estado });
  }

  deleteEspacio(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/espacios/${id}`);
  }
}
