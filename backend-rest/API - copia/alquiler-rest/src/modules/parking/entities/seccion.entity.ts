import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Espacio } from './espacio.entity';

@Entity('seccion')
export class Seccion {
  @ApiProperty({ description: 'ID único de la sección', example: 'sec-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Letra identificadora de la sección', example: 'A' })
  @Column({ name: 'letra_seccion' })
  letraSeccion: string;

  @OneToMany(() => Espacio, (espacio) => espacio.seccion)
  espacios: Espacio[];
}