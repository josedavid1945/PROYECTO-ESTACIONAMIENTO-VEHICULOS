import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Espacio } from '../../parking/entities/espacio.entity';
import { Ticket } from '../../operations/entities/ticket.entity';
import { DetallePago } from '../../transactions/entities/detallePago.entity';
import { Seccion } from '../../parking/entities/seccion.entity';
import { Vehicle } from '../../clients/entities/vehiculo.entity';
import {
  DashboardDataDto,
  EspaciosPorSeccionDto,
  EspacioDetalleDto,
  TicketActivoDto,
} from '../dto/dashboard-data.dto';

/**
 * SERVICIO DE DASHBOARD
 * 
 * ARCHIVO CREADO PARA EL PROYECTO
 * 
 * Propósito:
 * - Proporciona datos consolidados para el dashboard en tiempo real
 * - Consulta múltiples tablas para generar estadísticas
 * - Optimizado para ser consumido por el WebSocket Server
 * 
 * Funcionalidades:
 * 1. getDashboardData(): Retorna estadísticas generales (espacios, dinero, vehículos)
 * 2. getEspaciosPorSeccion(): Retorna espacios agrupados por sección
 * 3. getTicketsActivos(): Retorna tickets que no tienen fechaSalida
 * 4. getEspaciosDisponibles(): Retorna espacios con estado = true
 * 
 * Integración:
 * - WebSocket Server (Go) consulta /api/dashboard cada 5 segundos
 * - Frontend se conecta al WebSocket y recibe actualizaciones en tiempo real
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Espacio)
    private espacioRepository: Repository<Espacio>,
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(DetallePago)
    private detallePagoRepository: Repository<DetallePago>,
    @InjectRepository(Seccion)
    private seccionRepository: Repository<Seccion>,
    @InjectRepository(Vehicle)
    private vehiculoRepository: Repository<Vehicle>,
  ) {}

  /**
   * MÉTODO PRINCIPAL DEL DASHBOARD
   * 
   * Retorna un objeto con todas las estadísticas principales:
   * - Espacios disponibles/ocupados/total
   * - Dinero recaudado hoy y en el mes
   * - Vehículos activos (con ticket abierto)
   * 
   * Este método es consultado por el WebSocket cada 5 segundos
   * para mantener el dashboard actualizado en tiempo real
   */
  async getDashboardData(): Promise<DashboardDataDto> {
    // Total de espacios
    const totalEspacios = await this.espacioRepository.count();

    // Espacios disponibles (estado = true)
    const espaciosDisponibles = await this.espacioRepository.count({
      where: { estado: true },
    });

    // Espacios ocupados
    const espaciosOcupados = totalEspacios - espaciosDisponibles;

    // Vehículos activos (tickets sin fecha de salida)
    const vehiculosActivos = await this.ticketRepository.count({
      where: { fechaSalida: IsNull() },
    });

    // Dinero recaudado hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const dineroHoy = await this.detallePagoRepository
      .createQueryBuilder('detalle')
      .select('COALESCE(SUM(detalle.pagoTotal), 0)', 'total')
      .where('detalle.fechaPago >= :hoy', { hoy })
      .where('detalle.fechaPago < :manana', { manana })
      .getRawOne();

    // Dinero recaudado este mes
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

    const dineroMes = await this.detallePagoRepository
      .createQueryBuilder('detalle')
      .select('COALESCE(SUM(detalle.pagoTotal), 0)', 'total')
      .where('detalle.fechaPago >= :inicioMes', { inicioMes })
      .where('detalle.fechaPago <= :finMes', { finMes })
      .getRawOne();

    return {
      espacios_disponibles: espaciosDisponibles,
      espacios_ocupados: espaciosOcupados,
      total_espacios: totalEspacios,
      dinero_recaudado_hoy: parseFloat(dineroHoy?.total || '0'),
      dinero_recaudado_mes: parseFloat(dineroMes?.total || '0'),
      vehiculos_activos: vehiculosActivos,
      timestamp: new Date(),
    };
  }

  async getEspaciosPorSeccion(): Promise<EspaciosPorSeccionDto[]> {
    const secciones = await this.seccionRepository.find();
    const resultado: EspaciosPorSeccionDto[] = [];

    for (const seccion of secciones) {
      const espacios = await this.espacioRepository.find({
        where: { seccionId: seccion.id },
        order: { numero: 'ASC' },
      });

      const espaciosDisponibles = espacios.filter((e) => e.estado === true).length;
      const espaciosOcupados = espacios.length - espaciosDisponibles;

      // Obtener detalles de cada espacio
      const espaciosDetalle: EspacioDetalleDto[] = [];

      for (const espacio of espacios) {
        const detalle: EspacioDetalleDto = {
          id: espacio.id,
          numero: espacio.numero,
          estado: espacio.estado,
          seccion_letra: seccion.letraSeccion,
        };

        // Si está ocupado, buscar el ticket activo
        if (!espacio.estado) {
          const ticket = await this.ticketRepository.findOne({
            where: { espacioId: espacio.id, fechaSalida: IsNull() },
          });

          if (ticket) {
            const vehiculo = await this.vehiculoRepository.findOne({
              where: { id: ticket.vehiculoId },
            });

            if (vehiculo) {
              detalle.vehiculo_placa = vehiculo.placa;
              detalle.hora_ingreso = ticket.fechaIngreso.toISOString();
            }
          }
        }

        espaciosDetalle.push(detalle);
      }

      resultado.push({
        seccion_letra: seccion.letraSeccion,
        total_espacios: espacios.length,
        espacios_disponibles: espaciosDisponibles,
        espacios_ocupados: espaciosOcupados,
        espacios: espaciosDetalle,
      });
    }

    return resultado;
  }

  async getTicketsActivos(): Promise<TicketActivoDto[]> {
    const tickets = await this.ticketRepository.find({
      where: { fechaSalida: IsNull() },
      order: { fechaIngreso: 'DESC' },
    });

    const resultado: TicketActivoDto[] = [];

    for (const ticket of tickets) {
      const vehiculo = await this.vehiculoRepository.findOne({
        where: { id: ticket.vehiculoId },
      });

      const espacio = await this.espacioRepository.findOne({
        where: { id: ticket.espacioId },
      });

      resultado.push({
        id: ticket.id,
        fecha_ingreso: ticket.fechaIngreso,
        vehiculo_id: ticket.vehiculoId,
        espacio_id: ticket.espacioId,
        vehiculo_placa: vehiculo?.placa,
        espacio_numero: espacio?.numero,
        cliente_nombre: undefined, // Por ahora sin relación directa
      });
    }

    return resultado;
  }

  async getEspaciosDisponibles(): Promise<EspacioDetalleDto[]> {
    const espacios = await this.espacioRepository.find({
      where: { estado: true },
      order: { numero: 'ASC' },
    });

    const resultado: EspacioDetalleDto[] = [];

    for (const espacio of espacios) {
      const seccion = await this.seccionRepository.findOne({
        where: { id: espacio.seccionId },
      });

      resultado.push({
        id: espacio.id,
        numero: espacio.numero,
        estado: espacio.estado,
        seccion_letra: seccion?.letraSeccion || '',
      });
    }

    return resultado;
  }
}
