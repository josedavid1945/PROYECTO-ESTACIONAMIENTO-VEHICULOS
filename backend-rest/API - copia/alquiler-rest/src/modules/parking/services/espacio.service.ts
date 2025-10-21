import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Espacio } from '../entities/espacio.entity';
import { CreateEspacioDto } from '../dto/create-espacio.dto';
import { UpdateEspacioDto } from '../dto/update-espacio.dto';

@Injectable()
export class EspacioService {
  constructor(
    @InjectRepository(Espacio)
    private readonly espacioRepository: Repository<Espacio>,
  ) {}

  async create(createEspacioDto: CreateEspacioDto): Promise<Espacio> {
    const espacio = this.espacioRepository.create(createEspacioDto);
    return await this.espacioRepository.save(espacio);
  }

  async findAll(): Promise<Espacio[]> {
    return await this.espacioRepository.find();
  }

  async findOne(id: string): Promise<Espacio> {
    const espacio = await this.espacioRepository.findOne({ where: { id } });
    if (!espacio) throw new NotFoundException(`Espacio ${id} no encontrado`);
    return espacio;
  }

  async update(id: string, updateEspacioDto: UpdateEspacioDto): Promise<Espacio> {
    const espacio = await this.findOne(id);
    Object.assign(espacio, updateEspacioDto);
    return await this.espacioRepository.save(espacio);
  }

  async remove(id: string): Promise<void> {
    const espacio = await this.findOne(id);
    await this.espacioRepository.remove(espacio);
  }
}