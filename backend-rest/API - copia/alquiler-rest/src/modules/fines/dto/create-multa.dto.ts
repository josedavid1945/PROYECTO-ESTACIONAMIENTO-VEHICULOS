import { IsString, IsNumber, IsNotEmpty } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';

export class CreateMultaDto {
  @ApiProperty({ description: 'Descripción de la multa', example: 'Estacionamiento en zona prohibida' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({ description: 'Monto total de la multa', example: 50.00 })
  @IsNumber()
  @IsNotEmpty()
  montoTotal: number;

  @ApiProperty({ description: 'ID del tipo de multa aplicada', example: 'tipo-multa-001' })
  @IsString() 
  @IsNotEmpty()
  tipoMultaId: string;

  @ApiProperty({ description: 'ID del detalle de pago asociado', example: 'det-pago-001' })
  @IsString() 
  @IsNotEmpty()
  detallePagoId: string;
}