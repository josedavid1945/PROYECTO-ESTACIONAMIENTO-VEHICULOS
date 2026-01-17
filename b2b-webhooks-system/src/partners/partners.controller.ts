import { Controller, Post, Get, Patch, Delete, Body, Param, Query, Headers, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBody } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto, PartnerCredentialsResponseDto } from './dto/partner.dto';
import { PartnerStatus } from './entities/partner.entity';

@ApiTags('Partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar nuevo partner B2B',
    description: 'Crea un nuevo partner y genera credenciales únicas (API key, secret HMAC). Las credenciales solo se muestran una vez.'
  })
  @ApiBody({ type: CreatePartnerDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Partner registrado exitosamente',
    type: PartnerCredentialsResponseDto 
  })
  @ApiResponse({ status: 409, description: 'Ya existe un partner con ese nombre' })
  async register(@Body() createPartnerDto: CreatePartnerDto): Promise<PartnerCredentialsResponseDto> {
    return this.partnersService.register(createPartnerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los partners' })
  @ApiResponse({ status: 200, description: 'Lista de partners' })
  async findAll() {
    return this.partnersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener partner por ID' })
  @ApiResponse({ status: 200, description: 'Partner encontrado' })
  @ApiResponse({ status: 404, description: 'Partner no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const partner = await this.partnersService.findOne(id);
    // No devolver secretos
    const { apiSecret, webhookSecret, ...safe } = partner;
    return safe;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar partner' })
  @ApiBody({ type: UpdatePartnerDto })
  @ApiResponse({ status: 200, description: 'Partner actualizado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado del partner' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('status') status: PartnerStatus,
  ) {
    return this.partnersService.updateStatus(id, status);
  }

  @Post(':id/rotate-credentials')
  @ApiOperation({ 
    summary: 'Rotar credenciales del partner',
    description: 'Genera nuevas credenciales de seguridad. Las antiguas dejarán de funcionar inmediatamente.'
  })
  @ApiResponse({ status: 200, description: 'Nuevas credenciales generadas' })
  async rotateCredentials(@Param('id', ParseUUIDPipe) id: string) {
    return this.partnersService.rotateCredentials(id);
  }

  @Post('verify-auth')
  @ApiOperation({ 
    summary: 'Verificar autenticación HMAC',
    description: 'Endpoint de prueba para verificar que las firmas HMAC están correctas'
  })
  @ApiHeader({ name: 'X-API-Key', required: true })
  @ApiHeader({ name: 'X-Signature', required: true, description: 'sha256=<hmac_signature>' })
  @ApiHeader({ name: 'X-Timestamp', required: true, description: 'Unix timestamp en segundos' })
  @ApiHeader({ name: 'X-Nonce', required: true, description: 'String aleatorio único' })
  @ApiResponse({ status: 200, description: 'Autenticación válida' })
  @ApiResponse({ status: 401, description: 'Autenticación inválida' })
  async verifyAuth(
    @Headers('x-api-key') apiKey: string,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Headers('x-nonce') nonce: string,
    @Body() body: any,
  ) {
    const partner = await this.partnersService.verifyHmacAuth(
      apiKey,
      signature,
      timestamp,
      nonce,
      JSON.stringify(body),
    );

    return {
      success: true,
      message: 'Autenticación HMAC válida',
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type,
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar partner' })
  @ApiResponse({ status: 200, description: 'Partner eliminado' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.partnersService.remove(id);
    return { success: true, message: 'Partner eliminado' };
  }
}
