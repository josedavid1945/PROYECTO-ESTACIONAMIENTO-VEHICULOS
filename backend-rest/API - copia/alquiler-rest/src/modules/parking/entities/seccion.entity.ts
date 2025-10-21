import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('seccion')
export class Seccion {
  @ApiProperty({ description: 'ID único de la sección', example: 'sec-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Letra identificadora de la sección', example: 'A' })
  @Column({ name: 'letra_seccion' })
  letraSeccion: string;
}