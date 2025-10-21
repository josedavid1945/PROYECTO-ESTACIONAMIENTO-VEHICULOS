import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('administrador')
export class Administrador {
  @ApiProperty({ description: 'ID único del administrador', example: 'admin-001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nombre del administrador', example: 'Juan Pérez' })
  @Column()
  nombre: string;

  @ApiProperty({ description: 'Email del administrador', example: 'admin@estacionamiento.com' })
  @Column({ unique: true })
  email: string;

  @ApiProperty({ 
    description: 'Contraseña encriptada', 
    example: 'hashed_password', 
    writeOnly: true 
  })
  @Column()
  contrasena: string;

  @ApiProperty({ description: 'Indica si el administrador está activo', example: true })
  @Column({ default: true })
  activo: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaCreacion: Date;

  @ApiProperty({ description: 'Última fecha de actualización' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaActualizacion: Date;
}