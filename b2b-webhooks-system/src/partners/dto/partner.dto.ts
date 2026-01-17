import { IsString, IsEnum, IsOptional, IsUrl, IsEmail, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PartnerType } from '../entities/partner.entity';

class RetryPolicyDto {
  @ApiProperty({ example: 5 })
  maxRetries: number;

  @ApiProperty({ example: 2 })
  backoffMultiplier: number;
}

class RateLimitDto {
  @ApiProperty({ example: 100 })
  requestsPerMinute: number;

  @ApiProperty({ example: 10000 })
  requestsPerDay: number;
}

class PartnerConfigDto {
  @ApiPropertyOptional({ example: ['parking.reserved', 'payment.success'] })
  @IsOptional()
  allowedEvents?: string[];

  @ApiPropertyOptional({ type: RetryPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetryPolicyDto)
  retryPolicy?: RetryPolicyDto;

  @ApiPropertyOptional({ type: RateLimitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RateLimitDto)
  rateLimit?: RateLimitDto;

  @ApiPropertyOptional({ example: ['192.168.1.1', '10.0.0.0/8'] })
  @IsOptional()
  ipWhitelist?: string[];
}

export class CreatePartnerDto {
  @ApiProperty({ example: 'Grand Plaza Hotel', description: 'Nombre único del partner' })
  @IsString()
  name: string;

  @ApiProperty({ enum: PartnerType, example: PartnerType.HOTEL })
  @IsEnum(PartnerType)
  type: PartnerType;

  @ApiPropertyOptional({ example: 'https://partner.com/webhooks', description: 'URL para recibir webhooks' })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional({ example: 'partner@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: '+593999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: PartnerConfigDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PartnerConfigDto)
  config?: PartnerConfigDto;

  @ApiPropertyOptional({ description: 'Datos adicionales del partner' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdatePartnerDto {
  @ApiPropertyOptional({ example: 'Grand Plaza Hotel Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: PartnerType })
  @IsOptional()
  @IsEnum(PartnerType)
  type?: PartnerType;

  @ApiPropertyOptional({ example: 'https://newurl.com/webhooks' })
  @IsOptional()
  @IsUrl()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ type: PartnerConfigDto })
  @IsOptional()
  @IsObject()
  config?: PartnerConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class PartnerCredentialsResponseDto {
  @ApiProperty({ description: 'ID único del partner' })
  id: string;

  @ApiProperty({ description: 'Nombre del partner' })
  name: string;

  @ApiProperty({ description: 'API Key para autenticación (guardar de forma segura)' })
  apiKey: string;

  @ApiProperty({ description: 'Secret para firmas HMAC (guardar de forma segura, no se mostrará de nuevo)' })
  apiSecret: string;

  @ApiProperty({ description: 'Secret para verificar webhooks entrantes' })
  webhookSecret: string;

  @ApiProperty({ description: 'Mensaje de instrucciones' })
  instructions: string;
}
