import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TipoVehiculoService } from '../services/tipo-vehiculo.service';
import { CreateTipoVehiculoDto } from '../dto/create-tipo-vehiculo.dto';
import { UpdateTipoVehiculoDto } from '../dto/update-tipo-vehiculo.dto';

@ApiTags('Config - Tipo Vehículo')
@Controller('tipo-vehiculo')
export class TipoVehiculoController {
  constructor(private readonly tipoVehiculoService: TipoVehiculoService) {}

  @Post()
  @ApiOperation({ summary: 'Crear tipo de vehículo' })
  @ApiResponse({ status: 201, description: 'Tipo de vehículo creado exitosamente' })
  create(@Body() createTipoVehiculoDto: CreateTipoVehiculoDto) {
    return this.tipoVehiculoService.create(createTipoVehiculoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de vehículo' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de vehículo' })
  findAll() {
    return this.tipoVehiculoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tipo de vehículo por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de vehículo encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de vehículo no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipoVehiculoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tipo de vehículo' })
  @ApiResponse({ status: 200, description: 'Tipo de vehículo actualizado' })
  @ApiResponse({ status: 404, description: 'Tipo de vehículo no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTipoVehiculoDto: UpdateTipoVehiculoDto,
  ) {
    return this.tipoVehiculoService.update(id, updateTipoVehiculoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tipo de vehículo' })
  @ApiResponse({ status: 200, description: 'Tipo de vehículo eliminado' })
  @ApiResponse({ status: 404, description: 'Tipo de vehículo no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipoVehiculoService.remove(id);
  }
}