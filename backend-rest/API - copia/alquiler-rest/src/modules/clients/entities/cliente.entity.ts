import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('cliente')
export class Cliente {
  @ApiProperty({ description: 'ID único del cliente', example: 'cli-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre completo del cliente', example: 'María García' })
  @Column()
  nombre: string;

  @ApiProperty({ description: 'Email del cliente', example: 'maria@example.com' })
  @Column()
  email: string;

  @ApiProperty({ description: 'Teléfono del cliente', example: '+1234567890' })
  @Column()
  telefono: string;
}