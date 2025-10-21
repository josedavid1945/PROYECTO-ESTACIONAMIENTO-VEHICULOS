import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('ticket')
export class Ticket {
  @ApiProperty({ description: 'ID único del ticket', example: 'tick-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Fecha y hora de ingreso', example: '2024-01-15T10:30:00Z' })
  @Column({ type: 'timestamp', name: 'fechaIngreso' })
  fechaIngreso: Date;

  @ApiProperty({ description: 'Fecha y hora de salida', example: '2024-01-15T16:30:00Z', required: false })
  @Column({ type: 'timestamp', name: 'fechaSalida', nullable: true })
  fechaSalida: Date;

  @ApiProperty({ description: 'ID del vehículo asociado', example: 'veh-001' })
  @Column()
  vehiculoId: string;

  @ApiProperty({ description: 'ID del espacio asignado', example: 'esp-001' })
  @Column()
  espacioId: string;

  @ApiProperty({ description: 'ID del detalle de pago (opcional)', example: 'det-pago-001', required: false })
  @Column({ nullable: true })
  detallePagoId: string;
}