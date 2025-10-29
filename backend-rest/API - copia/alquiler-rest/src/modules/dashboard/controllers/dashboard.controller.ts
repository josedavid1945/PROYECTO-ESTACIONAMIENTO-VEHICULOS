import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import {
  DashboardDataDto,
  EspaciosPorSeccionDto,
  TicketActivoDto,
  EspacioDetalleDto,
} from '../dto/dashboard-data.dto';

/**
 * CONTROLADOR DE DASHBOARD
 * 
 * ARCHIVO CREADO PARA EL PROYECTO
 * 
 * Endpoints disponibles:
 * - GET /api/dashboard                    → Datos generales (principal)
 * - GET /api/dashboard/espacios/por-seccion → Espacios agrupados por sección
 * - GET /api/dashboard/tickets/activos    → Tickets sin fechaSalida
 * - GET /api/dashboard/espacios/disponibles → Espacios con estado = true
 * - GET /api/dashboard/health             → Health check
 * 
 * Integración con WebSocket:
 * El servidor WebSocket (Go) consume principalmente el endpoint principal
 * GET /api/dashboard cada 5 segundos para obtener datos actualizados
 */
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * ENDPOINT PRINCIPAL
   * GET /api/dashboard
   * 
   * Este es el endpoint que consulta el WebSocket Server cada 5 segundos
   * Retorna todas las estadísticas consolidadas del estacionamiento
   */
  @Get()
  @ApiOperation({ summary: 'Obtener datos generales del dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Datos del dashboard obtenidos exitosamente',
    type: DashboardDataDto,
  })
  async getDashboardData(): Promise<DashboardDataDto> {
    return this.dashboardService.getDashboardData();
  }

  /**
   * GET /api/dashboard/espacios/por-seccion
   * 
   * Retorna espacios agrupados por sección (A, B, C, etc.)
   * Útil para visualizar el estacionamiento por áreas
   */
  @Get('espacios/por-seccion')
  @ApiOperation({ summary: 'Obtener espacios agrupados por sección' })
  @ApiResponse({
    status: 200,
    description: 'Espacios por sección obtenidos exitosamente',
    type: [EspaciosPorSeccionDto],
  })
  async getEspaciosPorSeccion(): Promise<EspaciosPorSeccionDto[]> {
    return this.dashboardService.getEspaciosPorSeccion();
  }

  /**
   * GET /api/dashboard/tickets/activos
   * 
   * Retorna tickets que no tienen fechaSalida (vehículos actualmente estacionados)
   */
  @Get('tickets/activos')
  @ApiOperation({ summary: 'Obtener tickets activos (sin fecha de salida)' })
  @ApiResponse({
    status: 200,
    description: 'Tickets activos obtenidos exitosamente',
    type: [TicketActivoDto],
  })
  async getTicketsActivos(): Promise<TicketActivoDto[]> {
    return this.dashboardService.getTicketsActivos();
  }

  /**
   * GET /api/dashboard/espacios/disponibles
   * 
   * Retorna solo los espacios disponibles (estado = true)
   */
  @Get('espacios/disponibles')
  @ApiOperation({ summary: 'Obtener lista de espacios disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Espacios disponibles obtenidos exitosamente',
    type: [EspacioDetalleDto],
  })
  async getEspaciosDisponibles(): Promise<EspacioDetalleDto[]> {
    return this.dashboardService.getEspaciosDisponibles();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check del dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard API funcionando correctamente',
  })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'dashboard-api',
    };
  }
}
