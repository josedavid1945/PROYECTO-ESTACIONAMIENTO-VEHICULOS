import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('pago')
export class Pago {
  @ApiProperty({ description: 'ID único del pago', example: 'pago-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Monto del pago', example: 45.50 })
  @Column('float')
  monto: number;

  @ApiProperty({ description: 'ID del tipo de tarifa aplicada', example: 'tarifa-001' })
  @Column()
  tipoTarifaId: string;
}