export class DashboardDataDto {
  espacios_disponibles: number;
  espacios_ocupados: number;
  total_espacios: number;
  dinero_recaudado_hoy: number;
  dinero_recaudado_mes: number;
  vehiculos_activos: number;
  timestamp: Date;
}

export class EspacioDetalleDto {
  id: string;
  numero: string;
  estado: boolean;
  seccion_letra: string;
  vehiculo_placa?: string;
  hora_ingreso?: string;
}

export class EspaciosPorSeccionDto {
  seccion_letra: string;
  total_espacios: number;
  espacios_disponibles: number;
  espacios_ocupados: number;
  espacios: EspacioDetalleDto[];
}

export class TicketActivoDto {
  id: string;
  fecha_ingreso: Date;
  vehiculo_id: string;
  espacio_id: string;
  vehiculo_placa?: string;
  espacio_numero?: string;
  cliente_nombre?: string;
}
