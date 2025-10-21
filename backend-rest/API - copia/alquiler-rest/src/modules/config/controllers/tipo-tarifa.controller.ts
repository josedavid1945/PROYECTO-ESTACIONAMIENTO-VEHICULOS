import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TipoTarifaService } from '../services/tipo-tarifa.service';
import { CreateTipoTarifaDto } from '../dto/create-tipo-tarifa.dto';
import { UpdateTipoTarifaDto } from '../dto/update-tipo-tarifa.dto';

@ApiTags('Config - Tipo Tarifa')
@Controller('tipo-tarifa')
export class TipoTarifaController {
  constructor(private readonly tipoTarifaService: TipoTarifaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear tipo de tarifa' })
  @ApiResponse({ status: 201, description: 'Tipo de tarifa creado exitosamente' })
  create(@Body() createTipoTarifaDto: CreateTipoTarifaDto) {
    return this.tipoTarifaService.create(createTipoTarifaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de tarifa' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de tarifa' })
  findAll() {
    return this.tipoTarifaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tipo de tarifa por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de tarifa encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de tarifa no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipoTarifaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tipo de tarifa' })
  @ApiResponse({ status: 200, description: 'Tipo de tarifa actualizado' })
  @ApiResponse({ status: 404, description: 'Tipo de tarifa no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTipoTarifaDto: UpdateTipoTarifaDto,
  ) {
    return this.tipoTarifaService.update(id, updateTipoTarifaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tipo de tarifa' })
  @ApiResponse({ status: 200, description: 'Tipo de tarifa eliminado' })
  @ApiResponse({ status: 404, description: 'Tipo de tarifa no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipoTarifaService.remove(id);
  }
}