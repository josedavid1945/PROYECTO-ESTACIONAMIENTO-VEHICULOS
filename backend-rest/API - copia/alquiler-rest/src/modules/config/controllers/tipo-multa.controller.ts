import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TipoMultaService } from '../services/tipo-multa.service';
import { CreateTipoMultaDto } from '../dto/create-tipo-multa.dto';
import { UpdateTipoMultaDto } from '../dto/update-tipo-multa.dto';

@ApiTags('Config - Tipo Multa')
@Controller('tipo-multa')
export class TipoMultaController {
  constructor(private readonly tipoMultaService: TipoMultaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear tipo de multa' })
  @ApiResponse({ status: 201, description: 'Tipo de multa creado exitosamente' })
  create(@Body() createTipoMultaDto: CreateTipoMultaDto) {
    return this.tipoMultaService.create(createTipoMultaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tipos de multa' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de multa' })
  findAll() {
    return this.tipoMultaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tipo de multa por ID' })
  @ApiResponse({ status: 200, description: 'Tipo de multa encontrado' })
  @ApiResponse({ status: 404, description: 'Tipo de multa no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipoMultaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tipo de multa' })
  @ApiResponse({ status: 200, description: 'Tipo de multa actualizado' })
  @ApiResponse({ status: 404, description: 'Tipo de multa no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTipoMultaDto: UpdateTipoMultaDto,
  ) {
    return this.tipoMultaService.update(id, updateTipoMultaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tipo de multa' })
  @ApiResponse({ status: 200, description: 'Tipo de multa eliminado' })
  @ApiResponse({ status: 404, description: 'Tipo de multa no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipoMultaService.remove(id);
  }
}