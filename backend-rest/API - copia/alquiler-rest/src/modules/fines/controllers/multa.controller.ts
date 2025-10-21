import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MultaService } from '../services/multa.service';
import { CreateMultaDto } from '../dto/create-multa.dto';
import { UpdateMultaDto } from '../dto/update-multa.dto';

@ApiTags('Fines - Multas')
@Controller('multas')
export class MultaController {
  constructor(private readonly multaService: MultaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear multa' })
  @ApiResponse({ status: 201, description: 'Multa creada exitosamente' })
  create(@Body() createMultaDto: CreateMultaDto) {
    return this.multaService.create(createMultaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las multas' })
  @ApiResponse({ status: 200, description: 'Lista de multas' })
  findAll() {
    return this.multaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener multa por ID' })
  @ApiResponse({ status: 200, description: 'Multa encontrada' })
  @ApiResponse({ status: 404, description: 'Multa no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.multaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar multa' })
  @ApiResponse({ status: 200, description: 'Multa actualizada' })
  @ApiResponse({ status: 404, description: 'Multa no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMultaDto: UpdateMultaDto,
  ) {
    return this.multaService.update(id, updateMultaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar multa' })
  @ApiResponse({ status: 200, description: 'Multa eliminada' })
  @ApiResponse({ status: 404, description: 'Multa no encontrada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.multaService.remove(id);
  }
}