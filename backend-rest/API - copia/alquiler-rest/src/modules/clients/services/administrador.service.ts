import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Administrador } from '../entities/administrador.entity';
import { CreateAdministradorDto } from '../dto/create-administrador.dto';
import { UpdateAdministradorDto } from '../dto/update-administrador.dto';

@Injectable()
export class AdministradorService {
  constructor(
    @InjectRepository(Administrador)
    private readonly administradorRepository: Repository<Administrador>,
  ) {}

  async create(createAdministradorDto: CreateAdministradorDto): Promise<Administrador> {
    const { contrasena, ...adminData } = createAdministradorDto;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const administrador = this.administradorRepository.create({
      ...adminData,
      contrasena: hashedPassword,
    });

    return await this.administradorRepository.save(administrador);
  }

  async findAll(): Promise<Administrador[]> {
    return await this.administradorRepository.find();
  }

  async findOne(id: string): Promise<Administrador> {
    const administrador = await this.administradorRepository.findOne({ where: { id } });
    if (!administrador) throw new NotFoundException(`Administrador ${id} no encontrado`);
    return administrador;
  }

  async update(id: string, updateAdministradorDto: UpdateAdministradorDto): Promise<Administrador> {
    const administrador = await this.findOne(id);
    
    if (updateAdministradorDto.contrasena) {
      const salt = await bcrypt.genSalt(10);
      updateAdministradorDto.contrasena = await bcrypt.hash(updateAdministradorDto.contrasena, salt);
    }

    Object.assign(administrador, updateAdministradorDto);
    return await this.administradorRepository.save(administrador);
  }

  async remove(id: string): Promise<void> {
    const administrador = await this.findOne(id);
    await this.administradorRepository.remove(administrador);
  }
}