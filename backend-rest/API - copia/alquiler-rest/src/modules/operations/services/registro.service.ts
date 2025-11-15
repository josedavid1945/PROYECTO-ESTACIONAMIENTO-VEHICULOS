import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Cliente } from '../../clients/entities/cliente.entity';
import { Vehicle } from '../../clients/entities/vehiculo.entity';
import { Ticket } from '../entities/ticket.entity';
import { Espacio } from '../../parking/entities/espacio.entity';
import { Pago } from '../../transactions/entities/pago.entity';
import { DetallePago } from '../../transactions/entities/detallePago.entity';
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
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(DetallePago)
    private readonly detallePagoRepository: Repository<DetallePago>,
  ) {}

  /**
   * FLUJO 1: Registrar nuevo cliente con vehículo y generar ticket
   */
  async registrarClienteCompleto(dto: RegistrarClienteCompletoDto) {
    // 1. Verificar que el espacio esté disponible
    const espacio = await this.espacioRepository.findOne({ where: { id: dto.espacioId } });
    if (!espacio) {
      throw new NotFoundException('Espacio no encontrado');
    }
    if (!espacio.estado) {
      throw new BadRequestException('El espacio ya está ocupado');
    }

    // 2. Crear el cliente
    const cliente = this.clienteRepository.create({
      nombre: dto.nombreCliente,
      email: dto.emailCliente,
      telefono: dto.telefonoCliente,
    });
    const clienteGuardado = await this.clienteRepository.save(cliente);

    // 3. Crear el vehículo
    const vehiculo = this.vehiculoRepository.create({
      placa: dto.placa,
      marca: dto.marca,
      modelo: dto.modelo,
      clienteId: clienteGuardado.id,
      tipoVehiculoId: dto.tipoVehiculoId,
    });
    const vehiculoGuardado = await this.vehiculoRepository.save(vehiculo);

    // 4. Crear el ticket
    const ticket = this.ticketRepository.create({
      fechaIngreso: new Date(),
      vehiculoId: vehiculoGuardado.id,
      espacioId: dto.espacioId,
    });
    const ticketGuardado = await this.ticketRepository.save(ticket);

    // 5. Marcar el espacio como ocupado
    espacio.estado = false;
    await this.espacioRepository.save(espacio);

    return {
      success: true,
      message: 'Cliente registrado exitosamente',
      data: {
        cliente: clienteGuardado,
        vehiculo: vehiculoGuardado,
        ticket: ticketGuardado,
        espacio,
      },
    };
  }

  /**
   * FLUJO 2: Asignar espacio a cliente existente
   */
  async asignarEspacio(dto: AsignarEspacioDto) {
    // 1. Verificar que el vehículo existe y cargar el cliente
    const vehiculo = await this.vehiculoRepository.findOne({ 
      where: { id: dto.vehiculoId },
      relations: ['cliente']
    });
    if (!vehiculo) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    // 2. Verificar que el espacio esté disponible
    const espacio = await this.espacioRepository.findOne({ where: { id: dto.espacioId } });
    if (!espacio) {
      throw new NotFoundException('Espacio no encontrado');
    }
    if (!espacio.estado) {
      throw new BadRequestException('El espacio ya está ocupado');
    }

    // 3. Verificar que el vehículo no tenga un ticket activo
    const ticketActivo = await this.ticketRepository.findOne({
      where: { vehiculoId: dto.vehiculoId, fechaSalida: IsNull() },
    });
    if (ticketActivo) {
      throw new BadRequestException('El vehículo ya tiene un espacio asignado');
    }

    // 4. Crear el ticket
    const ticket = this.ticketRepository.create({
      fechaIngreso: new Date(),
      vehiculoId: dto.vehiculoId,
      espacioId: dto.espacioId,
    });
    const ticketGuardado = await this.ticketRepository.save(ticket);

    // 5. Marcar el espacio como ocupado
    espacio.estado = false;
    await this.espacioRepository.save(espacio);

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
  }

  /**
   * FLUJO 3: Desocupar espacio y generar detalle de pago
   */
  async desocuparEspacio(dto: DesocuparEspacioDto) {
    // 1. Buscar el ticket
    const ticket = await this.ticketRepository.findOne({ where: { id: dto.ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }
    if (ticket.fechaSalida) {
      throw new BadRequestException('Este ticket ya fue cerrado');
    }

    // 2. Actualizar fecha de salida del ticket
    ticket.fechaSalida = new Date();

    // 3. Crear el pago
    const pago = this.pagoRepository.create({
      monto: dto.montoPago,
      tipoTarifaId: dto.tipoTarifaId,
    });
    const pagoGuardado = await this.pagoRepository.save(pago);

    // 4. Crear el detalle de pago
    const detallePago = this.detallePagoRepository.create({
      metodo: dto.metodoPago,
      fechaPago: new Date(),
      pagoTotal: dto.montoPago,
      ticketId: ticket.id,
      pagoId: pagoGuardado.id,
    });
    const detallePagoGuardado = await this.detallePagoRepository.save(detallePago);

    // 5. Asociar detalle de pago al ticket
    ticket.detallePagoId = detallePagoGuardado.id;
    const ticketActualizado = await this.ticketRepository.save(ticket);

    // 6. Liberar el espacio
    const espacio = await this.espacioRepository.findOne({ where: { id: ticket.espacioId } });
    if (espacio) {
      espacio.estado = true;
      await this.espacioRepository.save(espacio);
    }

    return {
      success: true,
      message: 'Espacio desocupado exitosamente',
      data: {
        ticket: ticketActualizado,
        pago: pagoGuardado,
        detallePago: detallePagoGuardado,
        espacio,
      },
    };
  }

  /**
   * Obtener espacios disponibles
   */
  async getEspaciosDisponibles() {
    return await this.espacioRepository.find({ where: { estado: true } });
  }

  /**
   * Obtener vehículos con espacios ocupados (tickets activos)
   */
  async getVehiculosOcupados() {
    const ticketsActivos = await this.ticketRepository.find({
      where: { fechaSalida: IsNull() },
    });

    const vehiculosOcupados = await Promise.all(
      ticketsActivos.map(async (ticket) => {
        const vehiculo = await this.vehiculoRepository.findOne({
          where: { id: ticket.vehiculoId },
        });
        const espacio = await this.espacioRepository.findOne({
          where: { id: ticket.espacioId },
        });
        const cliente = vehiculo
          ? await this.clienteRepository.findOne({ where: { id: vehiculo.clienteId } })
          : null;

        return {
          ticket,
          vehiculo,
          espacio,
          cliente,
        };
      }),
    );

    return vehiculosOcupados;
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
        });
        return {
          ...cliente,
          vehiculos,
        };
      }),
    );

    return clientesConVehiculos;
  }
}
