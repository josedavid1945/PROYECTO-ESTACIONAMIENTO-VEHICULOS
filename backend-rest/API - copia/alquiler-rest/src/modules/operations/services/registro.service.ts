import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { Cliente } from '../../clients/entities/cliente.entity';
import { Vehicle } from '../../clients/entities/vehiculo.entity';
import { Ticket } from '../entities/ticket.entity';
import { Espacio } from '../../parking/entities/espacio.entity';
import { Seccion } from '../../parking/entities/seccion.entity';
import { Pago } from '../../transactions/entities/pago.entity';
import { DetallePago } from '../../transactions/entities/detallePago.entity';
import { TipoTarifa } from '../../config/entities/tipoTarifa.entity';
import { TipoVehiculo } from '../../config/entities/tipoVehiculo.entity';
import { RegistrarClienteCompletoDto } from '../dto/registrar-cliente-completo.dto';
import { AsignarEspacioDto } from '../dto/asignar-espacio.dto';
import { DesocuparEspacioDto } from '../dto/desocupar-espacio.dto';

@Injectable()
export class RegistroService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Vehicle)
    private readonly vehiculoRepository: Repository<Vehicle>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Espacio)
    private readonly espacioRepository: Repository<Espacio>,
    @InjectRepository(Seccion)
    private readonly seccionRepository: Repository<Seccion>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(DetallePago)
    private readonly detallePagoRepository: Repository<DetallePago>,
    @InjectRepository(TipoTarifa)
    private readonly tipoTarifaRepository: Repository<TipoTarifa>,
    @InjectRepository(TipoVehiculo)
    private readonly tipoVehiculoRepository: Repository<TipoVehiculo>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * FLUJO 1: Registrar nuevo cliente con vehículo y generar ticket
   * - Usa transacción para garantizar atomicidad
   * - Busca cliente existente por email antes de crear
   * - Valida placa duplicada
   */
  async registrarClienteCompleto(dto: RegistrarClienteCompletoDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que el espacio esté disponible
      const espacio = await queryRunner.manager.findOne(Espacio, { where: { id: dto.espacioId } });
      if (!espacio) {
        throw new NotFoundException('Espacio no encontrado');
      }
      if (!espacio.estado) {
        throw new BadRequestException('El espacio ya está ocupado');
      }

      // 2. Validar que la placa no esté duplicada
      const vehiculoExistente = await queryRunner.manager.findOne(Vehicle, { 
        where: { placa: dto.placa.toUpperCase() } 
      });
      if (vehiculoExistente) {
        throw new ConflictException(`Ya existe un vehículo con la placa ${dto.placa}`);
      }

      // 3. Buscar cliente existente por email o crear uno nuevo
      let cliente = await queryRunner.manager.findOne(Cliente, { 
        where: { email: dto.emailCliente.toLowerCase() } 
      });
      
      let clienteExistente = false;
      if (cliente) {
        clienteExistente = true;
      } else {
        cliente = queryRunner.manager.create(Cliente, {
          nombre: dto.nombreCliente,
          email: dto.emailCliente.toLowerCase(),
          telefono: dto.telefonoCliente,
        });
        cliente = await queryRunner.manager.save(Cliente, cliente);
      }

      // 4. Crear el vehículo
      const vehiculo = queryRunner.manager.create(Vehicle, {
        placa: dto.placa.toUpperCase(),
        marca: dto.marca,
        modelo: dto.modelo,
        clienteId: cliente.id,
        tipoVehiculoId: dto.tipoVehiculoId,
      });
      const vehiculoGuardado = await queryRunner.manager.save(Vehicle, vehiculo);

      // 5. Crear el ticket
      const ticket = queryRunner.manager.create(Ticket, {
        fechaIngreso: new Date(),
        vehiculoId: vehiculoGuardado.id,
        espacioId: dto.espacioId,
      });
      const ticketGuardado = await queryRunner.manager.save(Ticket, ticket);

      // 6. Marcar el espacio como ocupado
      espacio.estado = false;
      await queryRunner.manager.save(Espacio, espacio);

      // Confirmar transacción
      await queryRunner.commitTransaction();

      return {
        success: true,
        message: clienteExistente ? 'Cliente existente vinculado con nuevo vehículo' : 'Cliente registrado exitosamente',
        data: {
          cliente,
          vehiculo: vehiculoGuardado,
          ticket: ticketGuardado,
          espacio,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * FLUJO 2: Asignar espacio a cliente existente
   * - Usa transacción para garantizar atomicidad
   */
  async asignarEspacio(dto: AsignarEspacioDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que el vehículo existe y cargar el cliente
      const vehiculo = await queryRunner.manager.findOne(Vehicle, { 
        where: { id: dto.vehiculoId },
        relations: ['cliente', 'tipoVehiculo']
      });
      if (!vehiculo) {
        throw new NotFoundException('Vehículo no encontrado');
      }

      // 2. Verificar que el espacio esté disponible
      const espacio = await queryRunner.manager.findOne(Espacio, { where: { id: dto.espacioId } });
      if (!espacio) {
        throw new NotFoundException('Espacio no encontrado');
      }
      if (!espacio.estado) {
        throw new BadRequestException('El espacio ya está ocupado');
      }

      // 3. Verificar que el vehículo no tenga un ticket activo
      const ticketActivo = await queryRunner.manager.findOne(Ticket, {
        where: { vehiculoId: dto.vehiculoId, fechaSalida: IsNull() },
      });
      if (ticketActivo) {
        throw new BadRequestException('El vehículo ya tiene un espacio asignado');
      }

      // 4. Crear el ticket
      const ticket = queryRunner.manager.create(Ticket, {
        fechaIngreso: new Date(),
        vehiculoId: dto.vehiculoId,
        espacioId: dto.espacioId,
      });
      const ticketGuardado = await queryRunner.manager.save(Ticket, ticket);

      // 5. Marcar el espacio como ocupado
      espacio.estado = false;
      await queryRunner.manager.save(Espacio, espacio);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Espacio asignado exitosamente',
        data: {
          ticket: ticketGuardado,
          vehiculo,
          espacio,
          cliente: vehiculo.cliente,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * FLUJO 3: Desocupar espacio y generar detalle de pago
   * - Calcula automáticamente el monto basado en tiempo y tarifa
   * - Usa transacción para garantizar atomicidad
   */
  async desocuparEspacio(dto: DesocuparEspacioDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar el ticket
      const ticket = await queryRunner.manager.findOne(Ticket, { 
        where: { id: dto.ticketId }
      });
      if (!ticket) {
        throw new NotFoundException('Ticket no encontrado');
      }
      if (ticket.fechaSalida) {
        throw new BadRequestException('Este ticket ya fue cerrado');
      }

      // 2. Cargar vehículo con tipo y tarifa
      const vehiculo = await queryRunner.manager.findOne(Vehicle, {
        where: { id: ticket.vehiculoId },
        relations: ['tipoVehiculo', 'tipoVehiculo.tipotarifa', 'cliente'],
      });

      // 3. Calcular tiempo de estacionamiento
      const fechaSalida = new Date();
      const tiempoMs = fechaSalida.getTime() - ticket.fechaIngreso.getTime();
      const horasEstacionamiento = tiempoMs / (1000 * 60 * 60);

      // 4. Obtener tarifa del tipo de vehículo y calcular monto
      const tarifa = vehiculo?.tipoVehiculo?.tipotarifa;
      let montoCalculado: number;

      if (tarifa) {
        // Calcular monto: si es más de 8 horas, usar precio por día
        if (horasEstacionamiento >= 8) {
          const dias = Math.ceil(horasEstacionamiento / 24);
          montoCalculado = dias * tarifa.precioDia;
        } else {
          // Mínimo 1 hora
          const horasACobrar = Math.max(1, Math.ceil(horasEstacionamiento));
          montoCalculado = horasACobrar * tarifa.precioHora;
        }
      } else {
        // Si no hay tarifa, usar monto proporcionado o 0
        montoCalculado = dto.montoPago || 0;
      }

      // 5. Actualizar ticket
      ticket.fechaSalida = fechaSalida;
      ticket.horasEstacionamiento = Math.round(horasEstacionamiento * 100) / 100;
      ticket.montoCalculado = Math.round(montoCalculado * 100) / 100;

      // 6. Crear el pago
      const pago = queryRunner.manager.create(Pago, {
        monto: ticket.montoCalculado,
        tipoTarifaId: tarifa?.id || dto.tipoTarifaId,
      });
      const pagoGuardado = await queryRunner.manager.save(Pago, pago);

      // 7. Crear el detalle de pago
      const detallePago = queryRunner.manager.create(DetallePago, {
        metodo: dto.metodoPago,
        fechaPago: fechaSalida,
        pagoTotal: ticket.montoCalculado,
        ticketId: ticket.id,
        pagoId: pagoGuardado.id,
      });
      const detallePagoGuardado = await queryRunner.manager.save(DetallePago, detallePago);

      // 8. Asociar detalle de pago al ticket
      ticket.detallePagoId = detallePagoGuardado.id;
      const ticketActualizado = await queryRunner.manager.save(Ticket, ticket);

      // 9. Liberar el espacio
      const espacio = await queryRunner.manager.findOne(Espacio, { where: { id: ticket.espacioId } });
      if (espacio) {
        espacio.estado = true;
        await queryRunner.manager.save(Espacio, espacio);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Espacio desocupado exitosamente',
        data: {
          ticket: ticketActualizado,
          pago: pagoGuardado,
          detallePago: detallePagoGuardado,
          espacio,
          vehiculo,
          cliente: vehiculo?.cliente,
          resumen: {
            horasEstacionamiento: ticket.horasEstacionamiento,
            tarifaAplicada: tarifa?.tipoTarifa || 'Manual',
            precioHora: tarifa?.precioHora,
            precioDia: tarifa?.precioDia,
            montoTotal: ticket.montoCalculado,
          }
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtener espacios disponibles
   */
  async getEspaciosDisponibles() {
    return await this.espacioRepository.find({ 
      where: { estado: true },
      relations: ['seccion']
    });
  }

  /**
   * Obtener vehículos con espacios ocupados (tickets activos)
   * Incluye cálculo de tiempo y monto estimado en tiempo real
   * NOTA: Usa consultas separadas para evitar problemas de tipos uuid/varchar en PostgreSQL
   */
  async getVehiculosOcupados() {
    console.log('[getVehiculosOcupados] INICIO');
    
    try {
      // Primero obtener solo los tickets sin relaciones para evitar errores de tipos
      const ticketsActivos = await this.ticketRepository.find({
        where: { fechaSalida: IsNull() },
      });

      console.log(`[getVehiculosOcupados] Tickets activos encontrados: ${ticketsActivos.length}`);

      if (ticketsActivos.length === 0) {
        return [];
      }

      // Obtener todos los vehículos y espacios de una sola vez
      const vehiculoIds = ticketsActivos.map(t => t.vehiculoId).filter(id => id);
      const espacioIds = ticketsActivos.map(t => t.espacioId).filter(id => id);

      const vehiculos = vehiculoIds.length > 0 
        ? await this.vehiculoRepository.find({ relations: ['cliente', 'tipoVehiculo', 'tipoVehiculo.tipotarifa'] })
        : [];
      
      const espacios = espacioIds.length > 0 
        ? await this.espacioRepository.find({ relations: ['seccion'] })
        : [];

      // Crear mapas para búsqueda rápida
      const vehiculoMap = new Map(vehiculos.map(v => [v.id, v]));
      const espacioMap = new Map(espacios.map(e => [e.id, e]));

      // Mapear resultados
      const resultado = ticketsActivos.map((ticket) => {
        const vehiculo = vehiculoMap.get(ticket.vehiculoId);
        const espacio = espacioMap.get(ticket.espacioId);
        const tarifa = vehiculo?.tipoVehiculo?.tipotarifa;
        const seccion = espacio?.seccion;
        const cliente = vehiculo?.cliente;

        const ahora = new Date();
        const fechaIngreso = ticket.fechaIngreso ? new Date(ticket.fechaIngreso) : ahora;
        const tiempoMs = ahora.getTime() - fechaIngreso.getTime();
        const horasActuales = Math.max(0, tiempoMs / (1000 * 60 * 60));

        // Calcular monto estimado
        let montoEstimado = 0;
        if (tarifa) {
          if (horasActuales >= 8) {
            const dias = Math.ceil(horasActuales / 24);
            montoEstimado = dias * (tarifa.precioDia || 0);
          } else {
            const horasACobrar = Math.max(1, Math.ceil(horasActuales));
            montoEstimado = horasACobrar * (tarifa.precioHora || 0);
          }
        }

        // Construir nombre del espacio
        let espacioNumero = espacio?.numero?.toString() || 'N/A';
        if (seccion?.letraSeccion) {
          espacioNumero = `${seccion.letraSeccion}-${espacioNumero}`;
        }

        return {
          ticket: {
            id: ticket.id,
            fechaIngreso: ticket.fechaIngreso,
          },
          vehiculo: vehiculo ? {
            placa: vehiculo.placa || 'N/A',
            marca: vehiculo.marca || 'N/A',
            modelo: vehiculo.modelo || 'N/A',
            tipoVehiculo: vehiculo.tipoVehiculo ? {
              id: vehiculo.tipoVehiculo.id,
              categoria: vehiculo.tipoVehiculo.categoria,
              tipotarifa: tarifa ? {
                id: tarifa.id,
                tipoTarifa: tarifa.tipoTarifa,
                precioHora: tarifa.precioHora,
                precioDia: tarifa.precioDia,
              } : null,
            } : null,
          } : null,
          espacio: {
            numero: espacioNumero,
          },
          cliente: cliente ? {
            nombre: cliente.nombre || 'N/A',
          } : null,
          tiempoActual: {
            horas: Math.floor(horasActuales),
            minutos: Math.round((horasActuales % 1) * 60),
            montoEstimado: Math.round(montoEstimado * 100) / 100,
          }
        };
      });

      console.log('[getVehiculosOcupados] FIN - Retornando', resultado.length, 'vehículos');
      return resultado;
    } catch (error) {
      console.error('[getVehiculosOcupados] ERROR:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los clientes con sus vehículos
   */
  async getClientesConVehiculos() {
    const clientes = await this.clienteRepository.find();
    
    const clientesConVehiculos = await Promise.all(
      clientes.map(async (cliente) => {
        const vehiculos = await this.vehiculoRepository.find({
          where: { clienteId: cliente.id },
          relations: ['tipoVehiculo']
        });
        return {
          ...cliente,
          vehiculos,
        };
      }),
    );

    return clientesConVehiculos;
  }

  /**
   * Buscar cliente por email
   */
  async buscarClientePorEmail(email: string) {
    const cliente = await this.clienteRepository.findOne({
      where: { email: email.toLowerCase() }
    });
    
    if (!cliente) {
      return null;
    }

    const vehiculos = await this.vehiculoRepository.find({
      where: { clienteId: cliente.id },
      relations: ['tipoVehiculo']
    });

    return { ...cliente, vehiculos };
  }

  /**
   * Buscar vehículo por placa
   */
  async buscarVehiculoPorPlaca(placa: string) {
    const vehiculo = await this.vehiculoRepository.findOne({
      where: { placa: placa.toUpperCase() },
      relations: ['cliente', 'tipoVehiculo', 'tipoVehiculo.tipotarifa']
    });

    if (!vehiculo) {
      return null;
    }

    // Buscar ticket activo si existe
    const ticketActivo = await this.ticketRepository.findOne({
      where: { vehiculoId: vehiculo.id, fechaSalida: IsNull() },
      relations: ['espacio']
    });

    return { ...vehiculo, ticketActivo };
  }
}
