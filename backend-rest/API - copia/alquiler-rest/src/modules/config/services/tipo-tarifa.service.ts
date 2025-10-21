import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoTarifa } from '../entities/tipoTarifa.entity';
import { CreateTipoTarifaDto } from '../dto/create-tipo-tarifa.dto';
import { UpdateTipoTarifaDto } from '../dto/update-tipo-tarifa.dto';

@Injectable()
export class TipoTarifaService {
  constructor(
    @InjectRepository(TipoTarifa)
    private readonly tipoTarifaRepository: Repository<TipoTarifa>,
  ) {}

  async create(createTipoTarifaDto: CreateTipoTarifaDto): Promise<TipoTarifa> {
    const tipoTarifa = this.tipoTarifaRepository.create(createTipoTarifaDto);
    return await this.tipoTarifaRepository.save(tipoTarifa);
  }

  async findAll(): Promise<TipoTarifa[]> {
    return await this.tipoTarifaRepository.find();
  }

  async findOne(id: string): Promise<TipoTarifa> {
    const tipoTarifa = await this.tipoTarifaRepository.findOne({ where: { id } });
    if (!tipoTarifa) throw new NotFoundException(`TipoTarifa ${id} no encontrado`);
    return tipoTarifa;
  }

  async update(id: string, updateTipoTarifaDto: UpdateTipoTarifaDto): Promise<TipoTarifa> {
    const tipoTarifa = await this.findOne(id);
    Object.assign(tipoTarifa, updateTipoTarifaDto);
    return await this.tipoTarifaRepository.save(tipoTarifa);
  }

  async remove(id: string): Promise<void> {
    const tipoTarifa = await this.findOne(id);
    await this.tipoTarifaRepository.remove(tipoTarifa);
  }
}