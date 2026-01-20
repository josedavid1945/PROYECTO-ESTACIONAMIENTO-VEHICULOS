import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Vehicle } from '../../clients/entities/vehiculo.entity';
import { Espacio } from '../../parking/entities/espacio.entity';
import { DetallePago } from '../../transactions/entities/detallePago.entity';

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
  @Column({ type: 'uuid' })
  vehiculoId: string;

  @ApiProperty({ description: 'ID del espacio asignado', example: 'esp-001' })
  @Column({ type: 'uuid' })
  espacioId: string;

  @ApiProperty({ description: 'ID del detalle de pago (opcional)', example: 'det-pago-001', required: false })
  @Column({ type: 'uuid', nullable: true })
  detallePagoId: string;

  @ApiProperty({ description: 'Monto calculado del estacionamiento', required: false })
  @Column({ type: 'float', nullable: true, name: 'monto_calculado' })
  montoCalculado: number;

  @ApiProperty({ description: 'Horas de estacionamiento', required: false })
  @Column({ type: 'float', nullable: true, name: 'horas_estacionamiento' })
  horasEstacionamiento: number;

  // Relaciones (sin crear FKs automáticas para evitar conflictos con la BD existente)
  @ManyToOne(() => Vehicle, { eager: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehicle;

  @ManyToOne(() => Espacio, { eager: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'espacioId' })
  espacio: Espacio;

  @OneToOne(() => DetallePago, { eager: false, nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'detallePagoId' })
  detallePago: DetallePago;
}