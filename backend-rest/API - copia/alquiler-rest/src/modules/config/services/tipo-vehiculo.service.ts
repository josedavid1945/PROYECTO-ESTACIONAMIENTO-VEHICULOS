import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoVehiculo } from '../entities/tipoVehiculo.entity';
import { CreateTipoVehiculoDto } from '../dto/create-tipo-vehiculo.dto';
import { UpdateTipoVehiculoDto } from '../dto/update-tipo-vehiculo.dto';

@Injectable()
export class TipoVehiculoService {
  constructor(
    @InjectRepository(TipoVehiculo)
    private readonly tipoVehiculoRepository: Repository<TipoVehiculo>,
  ) {}

  async create(createTipoVehiculoDto: CreateTipoVehiculoDto): Promise<TipoVehiculo> {
    const tipoVehiculo = this.tipoVehiculoRepository.create(createTipoVehiculoDto);
    return await this.tipoVehiculoRepository.save(tipoVehiculo);
  }

  async findAll(): Promise<TipoVehiculo[]> {
    return await this.tipoVehiculoRepository.find();
  }

  async findOne(id: string): Promise<TipoVehiculo> {
    const tipoVehiculo = await this.tipoVehiculoRepository.findOne({ where: { id } });
    if (!tipoVehiculo) throw new NotFoundException(`TipoVehiculo ${id} no encontrado`);
    return tipoVehiculo;
  }

  async update(id: string, updateTipoVehiculoDto: UpdateTipoVehiculoDto): Promise<TipoVehiculo> {
    const tipoVehiculo = await this.findOne(id);
    Object.assign(tipoVehiculo, updateTipoVehiculoDto);
    return await this.tipoVehiculoRepository.save(tipoVehiculo);
  }

  async remove(id: string): Promise<void> {
    const tipoVehiculo = await this.findOne(id);
    await this.tipoVehiculoRepository.remove(tipoVehiculo);
  }
}