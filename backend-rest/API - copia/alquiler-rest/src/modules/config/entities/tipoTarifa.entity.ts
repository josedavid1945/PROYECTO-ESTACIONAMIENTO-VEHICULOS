import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tipo_tarifa')
export class TipoTarifa {
  @ApiProperty({ description: 'ID único del tipo de tarifa', example: 'tarifa-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Tipo de tarifa', example: 'Estándar' })
  @Column({ name: 'tipo_tarifa' })
  tipoTarifa: string;

  @ApiProperty({ description: 'Precio por hora', example: 2.50 })
  @Column('float', { name: 'precio_hora' })
  precioHora: number;

  @ApiProperty({ description: 'Precio por día', example: 20.00 })
  @Column('float', { name: 'precio_dia' })
  precioDia: number;
}