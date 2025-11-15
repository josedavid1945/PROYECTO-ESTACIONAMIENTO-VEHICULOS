import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TipoTarifa } from './tipoTarifa.entity';

@Entity('tipo_vehiculo')
export class TipoVehiculo {
  @ApiProperty({ description: 'ID único del tipo de vehículo', example: 'tipo-veh-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Categoría del vehículo', example: 'SUV' })
  @Column()
  categoria: string;

  @ApiProperty({ description: 'Descripción del tipo de vehículo', example: 'Vehículo utilitario deportivo' })
  @Column()
  descripcion: string;

  @ApiProperty({ description: 'ID del tipo de tarifa aplicable', example: 'tarifa-001' })
  @Column()
  tipoTarifaId: string;

  @ManyToOne(() => TipoTarifa, { eager: false })
  @JoinColumn({ name: 'tipoTarifaId' })
  tipotarifa: TipoTarifa;
}