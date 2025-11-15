import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistroService } from '../services/registro.service';
import { RegistrarClienteCompletoDto } from '../dto/registrar-cliente-completo.dto';
import { AsignarEspacioDto } from '../dto/asignar-espacio.dto';
import { DesocuparEspacioDto } from '../dto/desocupar-espacio.dto';

@ApiTags('Registro de Clientes')
@Controller('registro')
export class RegistroController {
  constructor(private readonly registroService: RegistroService) {}

  @Post('cliente-completo')
  @ApiOperation({ summary: 'Registrar nuevo cliente con vehículo y asignar espacio' })
  @ApiResponse({ status: 201, description: 'Cliente registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Espacio ocupado o datos inválidos' })
  registrarClienteCompleto(@Body() dto: RegistrarClienteCompletoDto) {
    return this.registroService.registrarClienteCompleto(dto);
  }

  @Post('asignar-espacio')
  @ApiOperation({ summary: 'Asignar espacio a cliente existente' })
  @ApiResponse({ status: 201, description: 'Espacio asignado exitosamente' })
  @ApiResponse({ status: 400, description: 'Vehículo ya tiene espacio asignado' })
  asignarEspacio(@Body() dto: AsignarEspacioDto) {
    return this.registroService.asignarEspacio(dto);
  }

  @Post('desocupar-espacio')
  @ApiOperation({ summary: 'Desocupar espacio y generar detalle de pago' })
  @ApiResponse({ status: 201, description: 'Espacio desocupado exitosamente' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  desocuparEspacio(@Body() dto: DesocuparEspacioDto) {
    return this.registroService.desocuparEspacio(dto);
  }

  @Get('espacios-disponibles')
  @ApiOperation({ summary: 'Obtener espacios disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de espacios disponibles' })
  getEspaciosDisponibles() {
    return this.registroService.getEspaciosDisponibles();
  }

  @Get('vehiculos-ocupados')
  @ApiOperation({ summary: 'Obtener vehículos con espacios ocupados' })
  @ApiResponse({ status: 200, description: 'Lista de vehículos ocupando espacios' })
  getVehiculosOcupados() {
    return this.registroService.getVehiculosOcupados();
  }

  @Get('clientes-con-vehiculos')
  @ApiOperation({ summary: 'Obtener clientes con sus vehículos' })
  @ApiResponse({ status: 200, description: 'Lista de clientes con vehículos' })
  getClientesConVehiculos() {
    return this.registroService.getClientesConVehiculos();
  }
}
