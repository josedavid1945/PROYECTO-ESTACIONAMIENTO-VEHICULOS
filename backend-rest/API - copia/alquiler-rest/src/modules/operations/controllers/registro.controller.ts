import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
  @ApiResponse({ status: 409, description: 'Placa ya registrada en el sistema' })
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
  @ApiOperation({ 
    summary: 'Desocupar espacio y generar detalle de pago',
    description: 'El monto se calcula automáticamente basado en la tarifa del vehículo y el tiempo estacionado'
  })
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
  @ApiOperation({ 
    summary: 'Obtener vehículos con espacios ocupados',
    description: 'Incluye tiempo actual de estacionamiento y monto estimado en tiempo real'
  })
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

  @Get('buscar-cliente/:email')
  @ApiOperation({ summary: 'Buscar cliente por email' })
  @ApiParam({ name: 'email', description: 'Email del cliente a buscar' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  buscarClientePorEmail(@Param('email') email: string) {
    return this.registroService.buscarClientePorEmail(email);
  }

  @Get('buscar-vehiculo/:placa')
  @ApiOperation({ 
    summary: 'Buscar vehículo por placa',
    description: 'Retorna información del vehículo, cliente y ticket activo si existe'
  })
  @ApiParam({ name: 'placa', description: 'Placa del vehículo a buscar' })
  @ApiResponse({ status: 200, description: 'Vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'Vehículo no encontrado' })
  buscarVehiculoPorPlaca(@Param('placa') placa: string) {
    return this.registroService.buscarVehiculoPorPlaca(placa);
  }
}
