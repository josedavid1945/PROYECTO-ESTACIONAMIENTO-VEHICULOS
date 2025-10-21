import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Multa } from '../entities/multa.entity';
import { CreateMultaDto } from '../dto/create-multa.dto';
import { UpdateMultaDto } from '../dto/update-multa.dto';

@Injectable()
export class MultaService {
  constructor(
    @InjectRepository(Multa)
    private readonly multaRepository: Repository<Multa>,
  ) {}

  async create(createMultaDto: CreateMultaDto): Promise<Multa> {
    const multa = this.multaRepository.create(createMultaDto);
    return await this.multaRepository.save(multa);
  }

  async findAll(): Promise<Multa[]> {
    return await this.multaRepository.find();
  }

  async findOne(id: string): Promise<Multa> {
    const multa = await this.multaRepository.findOne({ where: { id } });
    if (!multa) throw new NotFoundException(`Multa ${id} no encontrada`);
    return multa;
  }

  async update(id: string, updateMultaDto: UpdateMultaDto): Promise<Multa> {
    const multa = await this.findOne(id);
    Object.assign(multa, updateMultaDto);
    return await this.multaRepository.save(multa);
  }

  async remove(id: string): Promise<void> {
    const multa = await this.findOne(id);
    await this.multaRepository.remove(multa);
  }
}