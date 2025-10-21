import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdministradorService } from '../services/administrador.service';
import { CreateAdministradorDto } from '../dto/create-administrador.dto';
import { UpdateAdministradorDto } from '../dto/update-administrador.dto';

@ApiTags('Clients - Administradores')
@Controller('administradores')
export class AdministradorController {
  constructor(private readonly administradorService: AdministradorService) {}

  @Post()
  @ApiOperation({ summary: 'Crear administrador' })
  @ApiResponse({ status: 201, description: 'Administrador creado exitosamente' })
  create(@Body() createAdministradorDto: CreateAdministradorDto) {
    return this.administradorService.create(createAdministradorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los administradores' })
  @ApiResponse({ status: 200, description: 'Lista de administradores' })
  findAll() {
    return this.administradorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener administrador por ID' })
  @ApiResponse({ status: 200, description: 'Administrador encontrado' })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.administradorService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar administrador' })
  @ApiResponse({ status: 200, description: 'Administrador actualizado' })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdministradorDto: UpdateAdministradorDto,
  ) {
    return this.administradorService.update(id, updateAdministradorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar administrador' })
  @ApiResponse({ status: 200, description: 'Administrador eliminado' })
  @ApiResponse({ status: 404, description: 'Administrador no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.administradorService.remove(id);
  }
}