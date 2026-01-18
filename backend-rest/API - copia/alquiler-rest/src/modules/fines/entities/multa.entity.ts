import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Ticket } from '../../operations/entities/ticket.entity';
import { Vehicle } from '../../clients/entities/vehiculo.entity';

@Entity('multa')
export class Multa {
  @ApiProperty({ description: 'ID único de la multa', example: 'multa-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Descripción de la multa', example: 'Estacionamiento en zona prohibida' })
  @Column()
  descripcion: string;

  @ApiProperty({ description: 'Monto total de la multa', example: 50.00 })
  @Column('float', { name: 'monto_total' })
  montoTotal: number;

  @ApiProperty({ description: 'ID del tipo de multa aplicada', example: 'tipo-multa-001' })
  @Column()
  tipoMultaId: string;

  @ApiProperty({ description: 'ID del detalle de pago asociado', example: 'det-pago-001', required: false })
  @Column({ nullable: true })
  detallePagoId: string;

  @ApiProperty({ description: 'ID del ticket asociado', example: 'tick-001', required: false })
  @Column({ type: 'uuid', nullable: true, name: 'ticketId' })
  ticketId: string;

  @ApiProperty({ description: 'ID del vehículo asociado', example: 'veh-001', required: false })
  @Column({ type: 'uuid', nullable: true, name: 'vehiculoId' })
  vehiculoId: string;

  @ApiProperty({ description: 'Fecha de la multa' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'fecha_multa' })
  fechaMulta: Date;

  @ApiProperty({ description: 'Estado de la multa', example: 'pendiente' })
  @Column({ default: 'pendiente' })
  estado: string;

  // Relaciones
  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehiculoId' })
  vehiculo: Vehicle;
}