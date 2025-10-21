import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DetallePagoService } from '../services/detalle-pago.service';
import { CreateDetallePagoDto } from '../dto/create-detalle-pago.dto';
import { UpdateDetallePagoDto } from '../dto/update-detalle-pago.dto';

@ApiTags('Transactions - Detalle Pago')
@Controller('detalle-pago')
export class DetallePagoController {
  constructor(private readonly detallePagoService: DetallePagoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear detalle de pago' })
  @ApiResponse({ status: 201, description: 'Detalle de pago creado exitosamente' })
  create(@Body() createDetallePagoDto: CreateDetallePagoDto) {
    return this.detallePagoService.create(createDetallePagoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los detalles de pago' })
  @ApiResponse({ status: 200, description: 'Lista de detalles de pago' })
  findAll() {
    return this.detallePagoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de pago por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de pago encontrado' })
  @ApiResponse({ status: 404, description: 'Detalle de pago no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.detallePagoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar detalle de pago' })
  @ApiResponse({ status: 200, description: 'Detalle de pago actualizado' })
  @ApiResponse({ status: 404, description: 'Detalle de pago no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDetallePagoDto: UpdateDetallePagoDto,
  ) {
    return this.detallePagoService.update(id, updateDetallePagoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar detalle de pago' })
  @ApiResponse({ status: 200, description: 'Detalle de pago eliminado' })
  @ApiResponse({ status: 404, description: 'Detalle de pago no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.detallePagoService.remove(id);
  }
}