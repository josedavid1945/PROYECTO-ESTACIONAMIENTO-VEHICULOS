import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetallePago } from '../entities/detallePago.entity';
import { CreateDetallePagoDto } from '../dto/create-detalle-pago.dto';
import { UpdateDetallePagoDto } from '../dto/update-detalle-pago.dto';

@Injectable()
export class DetallePagoService {
  constructor(
    @InjectRepository(DetallePago)
    private readonly detallePagoRepository: Repository<DetallePago>,
  ) {}

  async create(createDetallePagoDto: CreateDetallePagoDto): Promise<DetallePago> {
    const detallePago = this.detallePagoRepository.create(createDetallePagoDto);
    return await this.detallePagoRepository.save(detallePago);
  }

  async findAll(): Promise<DetallePago[]> {
    return await this.detallePagoRepository.find();
  }

  async findOne(id: string): Promise<DetallePago> {
    const detallePago = await this.detallePagoRepository.findOne({ where: { id } });
    if (!detallePago) throw new NotFoundException(`DetallePago ${id} no encontrado`);
    return detallePago;
  }

  async update(id: string, updateDetallePagoDto: UpdateDetallePagoDto): Promise<DetallePago> {
    const detallePago = await this.findOne(id);
    Object.assign(detallePago, updateDetallePagoDto);
    return await this.detallePagoRepository.save(detallePago);
  }

  async remove(id: string): Promise<void> {
    const detallePago = await this.findOne(id);
    await this.detallePagoRepository.remove(detallePago);
  }
}