import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Cliente } from '../../clients/entities/cliente.entity';
import { Vehicle } from '../../clients/entities/vehiculo.entity';
import { Ticket } from '../entities/ticket.entity';
import { DetallePago } from '../../transactions/entities/detallePago.entity';

/**
 * SERVICIO DE PORTAL DE USUARIO
 * 
 * Este servicio permite a los usuarios registrados en el auth-service:
 * - Vincular su cuenta con su información de cliente/vehículo existente
 * - Ver sus tickets activos (vehículos estacionados actualmente)
 * - Ver historial de tickets pasados
 * - Ver detalles de pagos
 * 
 * NOTA: Los usuarios NO pueden crear nuevas reservas ni registrar vehículos.
 * Eso lo hace exclusivamente el administrador/operador.
 */
@Injectable()
export class UserPortalService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Vehicle)
    private readonly vehiculoRepository: Repository<Vehicle>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(DetallePago)
    private readonly detallePagoRepository: Repository<DetallePago>,
  ) {}

  /**
   * Vincular cuenta de auth-service con cliente existente
   * El usuario proporciona su email para encontrar su registro de cliente
   * 
   * @param authUserId - ID del usuario del auth-service (JWT sub)
   * @param email - Email del cliente para buscar y vincular
   */
  async vincularCuentaConCliente(authUserId: string, email: string): Promise<any> {
    // Verificar que el authUserId no esté ya vinculado a otro cliente
    const clienteYaVinculado = await this.clienteRepository.findOne({
      where: { authUserId }
    });

    if (clienteYaVinculado) {
      throw new ConflictException(
        `Tu cuenta ya está vinculada al cliente: ${clienteYaVinculado.nombre}`
      );
    }

    // Buscar cliente por email
    const cliente = await this.clienteRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!cliente) {
      throw new NotFoundException(
        `No se encontró un cliente con el email: ${email}. ` +
        `Contacta al administrador para que registre tu información.`
      );
    }

    // Verificar que el cliente no esté vinculado a otra cuenta
    if (cliente.authUserId) {
      throw new ConflictException(
        `Este cliente ya está vinculado a otra cuenta de usuario.`
      );
    }

    // Vincular la cuenta
    cliente.authUserId = authUserId;
    cliente.linkedAt = new Date();
    await this.clienteRepository.save(cliente);

    // Obtener vehículos del cliente
    const vehiculos = await this.vehiculoRepository.find({
      where: { clienteId: cliente.id },
      relations: ['tipoVehiculo']
    });

    return {
      mensaje: '¡Cuenta vinculada exitosamente!',
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        linkedAt: cliente.linkedAt,
      },
      vehiculos: vehiculos.map(v => ({
        id: v.id,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        tipoVehiculo: v.tipoVehiculo?.categoria
      }))
    };
  }

  /**
   * Obtener información del perfil del usuario vinculado
   * 
   * @param authUserId - ID del usuario del auth-service
   */
  async obtenerPerfil(authUserId: string): Promise<any> {
    const cliente = await this.clienteRepository.findOne({
      where: { authUserId }
    });

    if (!cliente) {
      throw new NotFoundException(
        `Tu cuenta no está vinculada a ningún cliente. ` +
        `Usa el endpoint de vinculación con tu email registrado.`
      );
    }

    const vehiculos = await this.vehiculoRepository.find({
      where: { clienteId: cliente.id },
      relations: ['tipoVehiculo']
    });

    return {
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        linkedAt: cliente.linkedAt,
      },
      vehiculos: vehiculos.map(v => ({
        id: v.id,
        placa: v.placa,
        marca: v.marca,
        modelo: v.modelo,
        tipoVehiculo: v.tipoVehiculo?.categoria
      }))
    };
  }

  /**
   * Obtener tickets activos del usuario (vehículos actualmente estacionados)
   * 
   * @param authUserId - ID del usuario del auth-service
   */
  async obtenerTicketsActivos(authUserId: string): Promise<any> {
    const cliente = await this.validarClienteVinculado(authUserId);

    // Obtener vehículos del cliente
    const vehiculos = await this.vehiculoRepository.find({
      where: { clienteId: cliente.id }
    });

    if (vehiculos.length === 0) {
      return {
        mensaje: 'No tienes vehículos registrados.',
        ticketsActivos: []
      };
    }

    // Buscar tickets activos de los vehículos del cliente
    const ticketsActivos: any[] = [];
    for (const vehiculo of vehiculos) {
      const ticket = await this.ticketRepository.findOne({
        where: { 
          vehiculoId: vehiculo.id, 
          fechaSalida: IsNull() 
        },
        relations: ['espacio', 'espacio.seccion']
      });

      if (ticket) {
        // Calcular tiempo actual de estacionamiento
        const ahora = new Date();
        const tiempoMs = ahora.getTime() - ticket.fechaIngreso.getTime();
        const horasActuales = tiempoMs / (1000 * 60 * 60);

        ticketsActivos.push({
          ticketId: ticket.id,
          vehiculo: {
            placa: vehiculo.placa,
            marca: vehiculo.marca,
            modelo: vehiculo.modelo
          },
          espacio: {
            numero: ticket.espacio?.numero,
            seccion: ticket.espacio?.seccion?.letraSeccion
          },
          fechaIngreso: ticket.fechaIngreso,
          tiempoEstacionado: {
            horas: Math.floor(horasActuales),
            minutos: Math.round((horasActuales % 1) * 60)
          }
        });
      }
    }

    return {
      mensaje: ticketsActivos.length > 0 
        ? `Tienes ${ticketsActivos.length} vehículo(s) estacionado(s) actualmente.`
        : 'No tienes vehículos estacionados actualmente.',
      ticketsActivos
    };
  }

  /**
   * Obtener historial de tickets pasados del usuario
   * 
   * @param authUserId - ID del usuario del auth-service
   * @param limit - Número máximo de tickets a retornar (default 20)
   */
  async obtenerHistorialTickets(authUserId: string, limit: number = 20): Promise<any> {
    const cliente = await this.validarClienteVinculado(authUserId);

    // Obtener vehículos del cliente
    const vehiculos = await this.vehiculoRepository.find({
      where: { clienteId: cliente.id }
    });

    if (vehiculos.length === 0) {
      return {
        mensaje: 'No tienes vehículos registrados.',
        historial: []
      };
    }

    const vehiculoIds = vehiculos.map(v => v.id);

    // Buscar tickets pasados (con fecha de salida)
    const ticketsPasados = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.espacio', 'espacio')
      .leftJoinAndSelect('espacio.seccion', 'seccion')
      .leftJoinAndSelect('ticket.vehiculo', 'vehiculo')
      .leftJoinAndSelect('ticket.detallePago', 'detallePago')
      .where('ticket.vehiculoId IN (:...vehiculoIds)', { vehiculoIds })
      .andWhere('ticket.fechaSalida IS NOT NULL')
      .orderBy('ticket.fechaSalida', 'DESC')
      .take(limit)
      .getMany();

    const historial = ticketsPasados.map(ticket => ({
      ticketId: ticket.id,
      vehiculo: {
        placa: ticket.vehiculo?.placa,
        marca: ticket.vehiculo?.marca,
        modelo: ticket.vehiculo?.modelo
      },
      espacio: {
        numero: ticket.espacio?.numero,
        seccion: ticket.espacio?.seccion?.letraSeccion
      },
      fechaIngreso: ticket.fechaIngreso,
      fechaSalida: ticket.fechaSalida,
      horasEstacionamiento: ticket.horasEstacionamiento,
      montoCalculado: ticket.montoCalculado,
      pago: ticket.detallePago ? {
        monto: ticket.detallePago.pagoTotal,
        metodo: ticket.detallePago.metodo,
        fecha: ticket.detallePago.fechaPago
      } : null
    }));

    return {
      mensaje: `Se encontraron ${historial.length} registros en tu historial.`,
      historial
    };
  }

  /**
   * Obtener resumen de gastos del usuario
   * 
   * @param authUserId - ID del usuario del auth-service
   */
  async obtenerResumenGastos(authUserId: string): Promise<any> {
    const cliente = await this.validarClienteVinculado(authUserId);

    // Obtener vehículos del cliente
    const vehiculos = await this.vehiculoRepository.find({
      where: { clienteId: cliente.id }
    });

    if (vehiculos.length === 0) {
      return {
        mensaje: 'No tienes vehículos registrados.',
        resumen: {
          totalVisitas: 0,
          totalGastado: 0,
          tiempoTotalHoras: 0
        }
      };
    }

    const vehiculoIds = vehiculos.map(v => v.id);

    // Obtener estadísticas
    const estadisticas = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select([
        'COUNT(ticket.id) as totalVisitas',
        'COALESCE(SUM(ticket.montoCalculado), 0) as totalGastado',
        'COALESCE(SUM(ticket.horasEstacionamiento), 0) as tiempoTotalHoras'
      ])
      .where('ticket.vehiculoId IN (:...vehiculoIds)', { vehiculoIds })
      .andWhere('ticket.fechaSalida IS NOT NULL')
      .getRawOne();

    // Obtener último ticket
    const ultimoTicket = await this.ticketRepository.findOne({
      where: { 
        vehiculoId: vehiculos.length === 1 ? vehiculos[0].id : undefined,
        fechaSalida: Not(IsNull()) 
      },
      order: { fechaSalida: 'DESC' },
      relations: ['vehiculo']
    });

    return {
      cliente: cliente.nombre,
      resumen: {
        totalVisitas: parseInt(estadisticas.totalVisitas) || 0,
        totalGastado: parseFloat(estadisticas.totalGastado) || 0,
        tiempoTotalHoras: parseFloat(estadisticas.tiempoTotalHoras) || 0,
        vehiculosRegistrados: vehiculos.length
      },
      ultimaVisita: ultimoTicket ? {
        fecha: ultimoTicket.fechaSalida,
        vehiculo: ultimoTicket.vehiculo?.placa,
        monto: ultimoTicket.montoCalculado
      } : null
    };
  }

  /**
   * Validar que el usuario tiene una cuenta vinculada
   */
  private async validarClienteVinculado(authUserId: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { authUserId }
    });

    if (!cliente) {
      throw new BadRequestException(
        `Tu cuenta no está vinculada. Primero vincula tu cuenta usando tu email registrado.`
      );
    }

    return cliente;
  }
}
