import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('detalle_pago')
export class DetallePago {
  @ApiProperty({ description: 'ID único del detalle de pago', example: 'det-pago-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Método de pago', example: 'Tarjeta de crédito' })
  @Column()
  metodo: string;

  @ApiProperty({ description: 'Fecha del pago', example: '2024-01-15T14:30:00Z' })
  @Column({ type: 'timestamp', name: 'fecha_pago' })
  fechaPago: Date;

  @ApiProperty({ description: 'Pago total', example: 75.50 })
  @Column('float', { name: 'pago_total' })
  pagoTotal: number;

  @ApiProperty({ description: 'ID del ticket asociado', example: 'tick-001' })
  @Column()
  ticketId: string;

  @ApiProperty({ description: 'ID del pago relacionado', example: 'pago-001' })
  @Column()
  pagoId: string;
}