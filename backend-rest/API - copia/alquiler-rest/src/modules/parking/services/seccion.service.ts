import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seccion } from '../entities/seccion.entity';
import { CreateSeccionDto } from '../dto/create-seccion.dto';
import { UpdateSeccionDto } from '../dto/update-seccion.dto';

@Injectable()
export class SeccionService {
  constructor(
    @InjectRepository(Seccion)
    private readonly seccionRepository: Repository<Seccion>,
  ) {}

  async create(createSeccionDto: CreateSeccionDto): Promise<Seccion> {
    const seccion = this.seccionRepository.create(createSeccionDto);
    return await this.seccionRepository.save(seccion);
  }

  async findAll(): Promise<Seccion[]> {
    return await this.seccionRepository.find();
  }

  async findOne(id: string): Promise<Seccion> {
    const seccion = await this.seccionRepository.findOne({ where: { id } });
    if (!seccion) throw new NotFoundException(`Seccion ${id} no encontrada`);
    return seccion;
  }

  async update(id: string, updateSeccionDto: UpdateSeccionDto): Promise<Seccion> {
    const seccion = await this.findOne(id);
    Object.assign(seccion, updateSeccionDto);
    return await this.seccionRepository.save(seccion);
  }

  async remove(id: string): Promise<void> {
    const seccion = await this.findOne(id);
    await this.seccionRepository.remove(seccion);
  }
}