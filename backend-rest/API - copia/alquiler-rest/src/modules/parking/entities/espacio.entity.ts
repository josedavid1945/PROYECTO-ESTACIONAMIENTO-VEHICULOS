import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('espacio')
export class Espacio {
  @ApiProperty({ description: 'ID único del espacio', example: 'esp-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Número del espacio', example: '101' })
  @Column()
  numero: string;

  @ApiProperty({ description: 'Estado del espacio (disponible/ocupado)', example: true })
  @Column('boolean')
  estado: boolean;

  @ApiProperty({ description: 'ID de la sección a la que pertenece', example: 'sec-001' })
  @Column()
  seccionId: string;
}