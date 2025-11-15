import { IsString, IsNotEmpty, IsEmail, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarClienteCompletoDto {
  // Datos del cliente
  @ApiProperty({ description: 'Nombre del cliente', example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  nombreCliente: string;

  @ApiProperty({ description: 'Email del cliente', example: 'juan@example.com' })
  @IsEmail()
  @IsNotEmpty()
  emailCliente: string;

  @ApiProperty({ description: 'Teléfono del cliente', example: '+593987654321' })
  @IsString()
  @IsNotEmpty()
  telefonoCliente: string;

  // Datos del vehículo
  @ApiProperty({ description: 'Placa del vehículo', example: 'ABC-123' })
  @IsString()
  @IsNotEmpty()
  placa: string;

  @ApiProperty({ description: 'Marca del vehículo', example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  marca: string;

  @ApiProperty({ description: 'Modelo del vehículo', example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  modelo: string;

  @ApiProperty({ description: 'ID del tipo de vehículo', example: 'uuid-tipo-vehiculo' })
  @IsUUID()
  @IsNotEmpty()
  tipoVehiculoId: string;

  // Asignación de espacio
  @ApiProperty({ description: 'ID del espacio a asignar', example: 'uuid-espacio' })
  @IsUUID()
  @IsNotEmpty()
  espacioId: string;
}
