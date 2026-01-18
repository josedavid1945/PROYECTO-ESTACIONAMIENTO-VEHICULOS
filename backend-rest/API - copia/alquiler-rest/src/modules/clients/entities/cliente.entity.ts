import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
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

  @ApiProperty({ description: 'ID del usuario en Auth Service (para vincular cuenta)', required: false })
  @Column({ type: 'uuid', nullable: true, name: 'auth_user_id' })
  authUserId: string;

  @ApiProperty({ description: 'Fecha de vinculación con cuenta de usuario', required: false })
  @Column({ type: 'timestamp', nullable: true, name: 'linked_at' })
  linkedAt: Date;
}