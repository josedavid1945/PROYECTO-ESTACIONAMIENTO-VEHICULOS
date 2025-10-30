import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { Espacio } from '../../parking/entities/espacio.entity';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    // MODIFICACIÓN: Se agregó la inyección del repositorio de Espacio
    // para poder gestionar el estado de los espacios (disponible/ocupado)
    @InjectRepository(Espacio)
    private readonly espacioRepository: Repository<Espacio>,
  ) {}

  /**
   * MODIFICACIÓN: Método mejorado para crear tickets
   * Ahora gestiona automáticamente el estado del espacio de estacionamiento
   * 
   * Flujo:
   * 1. Verifica que el espacio existe
   * 2. Verifica que el espacio está disponible (estado = true)
   * 3. Crea el ticket de ingreso
   * 4. Marca el espacio como ocupado (estado = false)
   */
  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // Verificar que el espacio existe y está disponible
    const espacio = await this.espacioRepository.findOne({
      where: { id: createTicketDto.espacioId }
    });

    if (!espacio) {
      throw new NotFoundException(`Espacio ${createTicketDto.espacioId} no encontrado`);
    }

    // VALIDACIÓN AGREGADA: Verificar que el espacio no esté ocupado
    if (!espacio.estado) {
      throw new BadRequestException(`El espacio ${espacio.numero} ya está ocupado`);
    }

    // Crear el ticket
    const ticket = this.ticketRepository.create(createTicketDto);
    const savedTicket = await this.ticketRepository.save(ticket);

    // MODIFICACIÓN: Marcar el espacio como ocupado automáticamente
    espacio.estado = false;
    await this.espacioRepository.save(espacio);

    return savedTicket;
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find();
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);
    return ticket;
  }

  /**
   * MODIFICACIÓN: Método mejorado para actualizar tickets
   * Ahora libera automáticamente el espacio cuando se registra una salida
   * 
   * Flujo:
   * 1. Busca el ticket existente
   * 2. Si se está registrando una fechaSalida (checkout)
   * 3. Busca el espacio asociado
   * 4. Marca el espacio como disponible (estado = true)
   * 5. Actualiza el ticket con los nuevos datos
   */
  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    
    // MODIFICACIÓN: Si se está registrando una salida (fechaSalida), liberar el espacio
    // Solo se libera si antes no tenía fechaSalida (primera vez que sale)
    if (updateTicketDto.fechaSalida && !ticket.fechaSalida) {
      const espacio = await this.espacioRepository.findOne({
        where: { id: ticket.espacioId }
      });

      if (espacio) {
        espacio.estado = true; // Marcar como disponible
        await this.espacioRepository.save(espacio);
      }
    }

    Object.assign(ticket, updateTicketDto);
    return await this.ticketRepository.save(ticket);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }
}