import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeccionService } from '../services/seccion.service';
import { CreateSeccionDto } from '../dto/create-seccion.dto';
import { UpdateSeccionDto } from '../dto/update-seccion.dto';

@ApiTags('Parking - Secciones')
@Controller('secciones')
export class SeccionController {
  constructor(private readonly seccionService: SeccionService) {}

  @Post()
  @ApiOperation({ summary: 'Crear sección' })
  @ApiResponse({ status: 201, description: 'Sección creada exitosamente' })
  create(@Body() createSeccionDto: CreateSeccionDto) {
    return this.seccionService.create(createSeccionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las secciones' })
  @ApiResponse({ status: 200, description: 'Lista de secciones' })
  findAll() {
    return this.seccionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sección por ID' })
  @ApiResponse({ status: 200, description: 'Sección encontrada' })
  @ApiResponse({ status: 404, description: 'Sección no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.seccionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar sección' })
  @ApiResponse({ status: 200, description: 'Sección actualizada' })
  @ApiResponse({ status: 404, description: 'Sección no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSeccionDto: UpdateSeccionDto,
  ) {
    return this.seccionService.update(id, updateSeccionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar sección' })
  @ApiResponse({ status: 200, description: 'Sección eliminada' })
  @ApiResponse({ status: 404, description: 'Sección no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.seccionService.remove(id);
  }
}