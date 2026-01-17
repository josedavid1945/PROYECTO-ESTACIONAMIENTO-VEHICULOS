import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError, timeout, retry } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

export interface EspacioDTO {
  idEspacio: number;
  estado: 'disponible' | 'ocupado' | 'reservado' | 'mantenimiento';
  zona?: string;
  tipo?: string;
}

export interface TicketDTO {
  idTicket: number;
  placa: string;
  fechaIngreso: Date;
  fechaSalida?: Date;
  monto?: number;
  estado: string;
}

export interface VehiculoDTO {
  placa: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipo?: string;
}

@Injectable()
export class ParkingApiService implements OnModuleInit {
  private readonly logger = new Logger(ParkingApiService.name);
  private apiAvailable = false;

  constructor(private readonly httpService: HttpService) {}

  async onModuleInit() {
    await this.checkApiHealth();
  }

  private async checkApiHealth(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get('/health').pipe(timeout(5000))
      );
      this.apiAvailable = true;
      this.logger.log('✅ Parking API disponible');
      return true;
    } catch {
      this.apiAvailable = false;
      this.logger.warn('⚠️ Parking API no disponible - usando datos mock');
      return false;
    }
  }

  // =================== ESPACIOS ===================
  
  async getEspacios(): Promise<EspacioDTO[]> {
    if (!this.apiAvailable) return this.getMockEspacios();
    
    try {
      const response: AxiosResponse<EspacioDTO[]> = await firstValueFrom(
        this.httpService.get<EspacioDTO[]>('/espacios').pipe(
          timeout(10000),
          retry(2),
          catchError((error: AxiosError) => {
            this.logger.error(`Error obteniendo espacios: ${error.message}`);
            throw error;
          })
        )
      );
      return response.data;
    } catch {
      return this.getMockEspacios();
    }
  }

  async getEspaciosDisponibles(): Promise<EspacioDTO[]> {
    const espacios = await this.getEspacios();
    return espacios.filter(e => e.estado === 'disponible');
  }

  async getEspacioById(id: number): Promise<EspacioDTO | null> {
    if (!this.apiAvailable) {
      const mock = this.getMockEspacios().find(e => e.idEspacio === id);
      return mock || null;
    }

    try {
      const response: AxiosResponse<EspacioDTO> = await firstValueFrom(
        this.httpService.get<EspacioDTO>(`/espacios/${id}`).pipe(timeout(5000))
      );
      return response.data;
    } catch {
      return null;
    }
  }

  // =================== TICKETS ===================

  async getTickets(): Promise<TicketDTO[]> {
    if (!this.apiAvailable) return this.getMockTickets();

    try {
      const response: AxiosResponse<TicketDTO[]> = await firstValueFrom(
        this.httpService.get<TicketDTO[]>('/tickets').pipe(timeout(10000), retry(2))
      );
      return response.data;
    } catch {
      return this.getMockTickets();
    }
  }

  async getTicketById(id: number): Promise<TicketDTO | null> {
    if (!this.apiAvailable) {
      return this.getMockTickets().find(t => t.idTicket === id) || null;
    }

    try {
      const response: AxiosResponse<TicketDTO> = await firstValueFrom(
        this.httpService.get<TicketDTO>(`/tickets/${id}`).pipe(timeout(5000))
      );
      return response.data;
    } catch {
      return null;
    }
  }

  async getTicketByPlaca(placa: string): Promise<TicketDTO | null> {
    const tickets = await this.getTickets();
    return tickets.find(t => 
      t.placa.toLowerCase() === placa.toLowerCase() && !t.fechaSalida
    ) || null;
  }

  async createTicket(data: { placa: string; espacioId: number }): Promise<TicketDTO> {
    if (!this.apiAvailable) {
      return {
        idTicket: Math.floor(Math.random() * 10000),
        placa: data.placa,
        fechaIngreso: new Date(),
        estado: 'activo',
      };
    }

    try {
      const response: AxiosResponse<TicketDTO> = await firstValueFrom(
        this.httpService.post<TicketDTO>('/tickets', data).pipe(timeout(10000))
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error creando ticket: ${error.message}`);
      throw error;
    }
  }

  // =================== DETALLE PAGO ===================

  async getRecaudacion(): Promise<{ total: number; hoy: number; mes: number }> {
    if (!this.apiAvailable) {
      return { total: 15750.50, hoy: 850.00, mes: 5420.75 };
    }

    try {
      const response: AxiosResponse<any[]> = await firstValueFrom(
        this.httpService.get<any[]>('/detalle-pago').pipe(timeout(10000))
      );
      
      const pagos = response.data || [];
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const total = pagos.reduce((sum: number, p: any) => sum + (p.monto || 0), 0);
      const pagoHoy = pagos
        .filter((p: any) => new Date(p.fechaPago) >= hoy)
        .reduce((sum: number, p: any) => sum + (p.monto || 0), 0);
      const pagoMes = pagos
        .filter((p: any) => new Date(p.fechaPago) >= inicioMes)
        .reduce((sum: number, p: any) => sum + (p.monto || 0), 0);

      return { total, hoy: pagoHoy, mes: pagoMes };
    } catch {
      return { total: 0, hoy: 0, mes: 0 };
    }
  }

  // =================== VEHICULOS ===================

  async getVehiculos(): Promise<VehiculoDTO[]> {
    if (!this.apiAvailable) return this.getMockVehiculos();

    try {
      const response: AxiosResponse<VehiculoDTO[]> = await firstValueFrom(
        this.httpService.get<VehiculoDTO[]>('/vehiculos').pipe(timeout(10000))
      );
      return response.data;
    } catch {
      return this.getMockVehiculos();
    }
  }

  // =================== MOCK DATA ===================

  private getMockEspacios(): EspacioDTO[] {
    return [
      { idEspacio: 1, estado: 'disponible', zona: 'A', tipo: 'normal' },
      { idEspacio: 2, estado: 'ocupado', zona: 'A', tipo: 'normal' },
      { idEspacio: 3, estado: 'disponible', zona: 'A', tipo: 'normal' },
      { idEspacio: 4, estado: 'disponible', zona: 'B', tipo: 'vip' },
      { idEspacio: 5, estado: 'mantenimiento', zona: 'B', tipo: 'vip' },
      { idEspacio: 6, estado: 'reservado', zona: 'B', tipo: 'normal' },
      { idEspacio: 7, estado: 'disponible', zona: 'C', tipo: 'normal' },
      { idEspacio: 8, estado: 'ocupado', zona: 'C', tipo: 'discapacitado' },
      { idEspacio: 9, estado: 'disponible', zona: 'C', tipo: 'normal' },
      { idEspacio: 10, estado: 'disponible', zona: 'D', tipo: 'vip' },
    ];
  }

  private getMockTickets(): TicketDTO[] {
    const now = new Date();
    return [
      { idTicket: 1001, placa: 'ABC-123', fechaIngreso: new Date(now.getTime() - 3600000), estado: 'activo' },
      { idTicket: 1002, placa: 'XYZ-789', fechaIngreso: new Date(now.getTime() - 7200000), fechaSalida: new Date(), monto: 15.50, estado: 'completado' },
      { idTicket: 1003, placa: 'DEF-456', fechaIngreso: new Date(now.getTime() - 1800000), estado: 'activo' },
    ];
  }

  private getMockVehiculos(): VehiculoDTO[] {
    return [
      { placa: 'ABC-123', marca: 'Toyota', modelo: 'Corolla', color: 'Blanco', tipo: 'sedan' },
      { placa: 'XYZ-789', marca: 'Honda', modelo: 'Civic', color: 'Negro', tipo: 'sedan' },
      { placa: 'DEF-456', marca: 'Nissan', modelo: 'Sentra', color: 'Gris', tipo: 'sedan' },
    ];
  }

  isApiAvailable(): boolean {
    return this.apiAvailable;
  }
}
