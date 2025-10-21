import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EspacioService } from '../services/espacio.service';
import { CreateEspacioDto } from '../dto/create-espacio.dto';
import { UpdateEspacioDto } from '../dto/update-espacio.dto';

@ApiTags('Parking - Espacios')
@Controller('espacios')
export class EspacioController {
  constructor(private readonly espacioService: EspacioService) {}

  @Post()
  @ApiOperation({ summary: 'Crear espacio' })
  @ApiResponse({ status: 201, description: 'Espacio creado exitosamente' })
  create(@Body() createEspacioDto: CreateEspacioDto) {
    return this.espacioService.create(createEspacioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los espacios' })
  @ApiResponse({ status: 200, description: 'Lista de espacios' })
  findAll() {
    return this.espacioService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener espacio por ID' })
  @ApiResponse({ status: 200, description: 'Espacio encontrado' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.espacioService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar espacio' })
  @ApiResponse({ status: 200, description: 'Espacio actualizado' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEspacioDto: UpdateEspacioDto,
  ) {
    return this.espacioService.update(id, updateEspacioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar espacio' })
  @ApiResponse({ status: 200, description: 'Espacio eliminado' })
  @ApiResponse({ status: 404, description: 'Espacio no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.espacioService.remove(id);
  }
}