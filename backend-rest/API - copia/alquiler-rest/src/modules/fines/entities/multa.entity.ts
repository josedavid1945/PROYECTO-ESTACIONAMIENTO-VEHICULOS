import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'ID del detalle de pago asociado', example: 'det-pago-001' })
  @Column()
  detallePagoId: string;
}