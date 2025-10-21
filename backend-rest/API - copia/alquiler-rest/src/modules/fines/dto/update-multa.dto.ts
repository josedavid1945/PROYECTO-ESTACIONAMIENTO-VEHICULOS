import { IsString, IsNumber, IsOptional } from 'class-validator'; // ❌ Quitar IsUUID
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMultaDto {
  @ApiProperty({ description: 'Descripción de la multa', example: 'Estacionamiento en zona prohibida', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ description: 'Monto total de la multa', example: 50.00, required: false })
  @IsNumber()
  @IsOptional()
  montoTotal?: number;

  @ApiProperty({ description: 'ID del tipo de multa aplicada', example: 'tipo-multa-001', required: false })
  @IsString() 
  @IsOptional()
  tipoMultaId?: string;

  @ApiProperty({ description: 'ID del detalle de pago asociado', example: 'det-pago-001', required: false })
  @IsString() 
  @IsOptional()
  detallePagoId?: string;
}