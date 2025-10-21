import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tipo_multa')
export class TipoMulta {
  @ApiProperty({ description: 'ID único del tipo de multa', example: 'tipo-multa-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre del tipo de multa', example: 'Exceso de tiempo' })
  @Column({ unique: true })
  nombre: string;

  @ApiProperty({ description: 'Monto base de la multa', example: 30.00 })
  @Column('float')
  monto: number;
}