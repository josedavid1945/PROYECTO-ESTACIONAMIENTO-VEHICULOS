import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TipoVehiculo } from '../../config/entities/tipoVehiculo.entity';
import { Cliente } from './cliente.entity';

@Entity('vehiculo')
export class Vehicle {
  @ApiProperty({ description: 'ID único del vehículo', example: 'veh-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-123' })
  @Column()
  placa: string;

  @ApiProperty({ description: 'Marca del vehículo', example: 'Toyota' })
  @Column()
  marca: string;

  @ApiProperty({ description: 'Modelo del vehículo', example: 'Corolla' })
  @Column()
  modelo: string;

  @ApiProperty({ description: 'ID del cliente propietario', example: 'cli-001' })
  @Column({ type: 'varchar', nullable: true })
  clienteId: string;

  @ApiProperty({ description: 'ID del tipo de vehículo', example: 'tipo-veh-001', required: false })
  @Column({ type: 'varchar', nullable: true })
  tipoVehiculoId: string;

  @ManyToOne(() => TipoVehiculo, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'tipoVehiculoId' })
  tipoVehiculo: TipoVehiculo;

  @ManyToOne(() => Cliente, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;
}