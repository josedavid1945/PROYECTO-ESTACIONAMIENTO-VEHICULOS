import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoMulta } from '../entities/tipoMulta.entity';
import { CreateTipoMultaDto } from '../dto/create-tipo-multa.dto';
import { UpdateTipoMultaDto } from '../dto/update-tipo-multa.dto';

@Injectable()
export class TipoMultaService {
  constructor(
    @InjectRepository(TipoMulta)
    private readonly tipoMultaRepository: Repository<TipoMulta>,
  ) {}

  async create(createTipoMultaDto: CreateTipoMultaDto): Promise<TipoMulta> {
    const tipoMulta = this.tipoMultaRepository.create(createTipoMultaDto);
    return await this.tipoMultaRepository.save(tipoMulta);
  }

  async findAll(): Promise<TipoMulta[]> {
    return await this.tipoMultaRepository.find();
  }

  async findOne(id: string): Promise<TipoMulta> {
    const tipoMulta = await this.tipoMultaRepository.findOne({ where: { id } });
    if (!tipoMulta) throw new NotFoundException(`TipoMulta ${id} no encontrado`);
    return tipoMulta;
  }

  async update(id: string, updateTipoMultaDto: UpdateTipoMultaDto): Promise<TipoMulta> {
    const tipoMulta = await this.findOne(id);
    Object.assign(tipoMulta, updateTipoMultaDto);
    return await this.tipoMultaRepository.save(tipoMulta);
  }

  async remove(id: string): Promise<void> {
    const tipoMulta = await this.findOne(id);
    await this.tipoMultaRepository.remove(tipoMulta);
  }
}