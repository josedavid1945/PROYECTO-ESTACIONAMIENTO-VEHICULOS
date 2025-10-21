import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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
  @Column()
  clienteId: string;

  @ApiProperty({ description: 'ID del tipo de vehículo', example: 'tipo-veh-001' })
  @Column()
  tipoVehiculoId: string;
}