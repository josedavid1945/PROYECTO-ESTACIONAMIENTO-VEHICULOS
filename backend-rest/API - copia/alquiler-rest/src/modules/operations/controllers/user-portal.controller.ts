import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { UserPortalService } from '../services/user-portal.service';
import { VincularCuentaDto } from '../dto/vincular-cuenta.dto';

/**
 * CONTROLADOR DEL PORTAL DE USUARIO
 * 
 * Endpoints para usuarios finales que quieren:
 * - Vincular su cuenta del auth-service con su información de cliente
 * - Ver sus tickets activos (vehículos estacionados)
 * - Ver historial de tickets
 * - Ver resumen de gastos
 * 
 * IMPORTANTE: Todos estos endpoints requieren autenticación JWT
 * El usuario debe haberse registrado primero en el auth-service
 */
@ApiTags('Portal de Usuario')
@ApiBearerAuth()
@Controller('user-portal')
// @UseGuards(JwtAuthGuard) // Descomentar cuando se integre el guard del auth-service
export class UserPortalController {
  constructor(private readonly userPortalService: UserPortalService) {}

  /**
   * Vincular cuenta de usuario con cliente existente
   * 
   * El usuario proporciona su email (el mismo que el admin usó al registrarlo)
   * para vincular su cuenta del auth-service con su información de cliente/vehículos
   */
  @Post('vincular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Vincular cuenta con cliente existente',
    description: 'Vincula tu cuenta de usuario con tu información de cliente usando tu email. ' +
                 'El email debe coincidir con el registrado por el administrador.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cuenta vinculada exitosamente',
    schema: {
      example: {
        mensaje: '¡Cuenta vinculada exitosamente!',
        cliente: {
          id: 'uuid',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@email.com',
          telefono: '1234567890'
        },
        vehiculos: [{
          id: 'uuid',
          placa: 'ABC-123',
          marca: 'Toyota',
          modelo: 'Corolla',
          color: 'Blanco',
          tipoVehiculo: 'Automóvil'
        }]
      }
    }
  })
  @ApiResponse({ status: 404, description: 'No se encontró cliente con ese email' })
  @ApiResponse({ status: 409, description: 'Cuenta ya vinculada' })
  async vincularCuenta(
    @Request() req,
    @Body() vincularDto: VincularCuentaDto
  ) {
    // En producción, obtener el authUserId del token JWT
    // const authUserId = req.user.sub;
    
    // Para desarrollo, permitir pasar el authUserId en el body o header
    const authUserId = req.headers['x-auth-user-id'] || vincularDto.authUserId;
    
    if (!authUserId) {
      return {
        error: 'Se requiere autenticación. Incluye el header x-auth-user-id o el campo authUserId.'
      };
    }

    return this.userPortalService.vincularCuentaConCliente(authUserId, vincularDto.email);
  }

  /**
   * Obtener perfil del usuario vinculado
   */
  @Get('perfil')
  @ApiOperation({ 
    summary: 'Obtener mi perfil',
    description: 'Obtiene la información del cliente y vehículos vinculados a tu cuenta'
  })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Cuenta no vinculada' })
  async obtenerPerfil(@Request() req) {
    const authUserId = req.headers['x-auth-user-id'];
    
    if (!authUserId) {
      return {
        error: 'Se requiere autenticación. Incluye el header x-auth-user-id.'
      };
    }

    return this.userPortalService.obtenerPerfil(authUserId);
  }

  /**
   * Obtener tickets activos (vehículos actualmente estacionados)
   */
  @Get('tickets-activos')
  @ApiOperation({ 
    summary: 'Ver mis vehículos estacionados',
    description: 'Muestra los vehículos que tienes actualmente estacionados con el tiempo transcurrido'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de tickets activos',
    schema: {
      example: {
        mensaje: 'Tienes 1 vehículo(s) estacionado(s) actualmente.',
        ticketsActivos: [{
          ticketId: 'uuid',
          vehiculo: {
            placa: 'ABC-123',
            marca: 'Toyota',
            modelo: 'Corolla',
            color: 'Blanco'
          },
          espacio: {
            numero: 'A-01',
            seccion: 'Nivel 1'
          },
          fechaIngreso: '2024-01-15T10:30:00.000Z',
          tiempoEstacionado: {
            horas: 2,
            minutos: 45
          }
        }]
      }
    }
  })
  async obtenerTicketsActivos(@Request() req) {
    const authUserId = req.headers['x-auth-user-id'];
    
    if (!authUserId) {
      return {
        error: 'Se requiere autenticación. Incluye el header x-auth-user-id.'
      };
    }

    return this.userPortalService.obtenerTicketsActivos(authUserId);
  }

  /**
   * Obtener historial de tickets pasados
   */
  @Get('historial')
  @ApiOperation({ 
    summary: 'Ver mi historial de estacionamiento',
    description: 'Muestra el historial de tickets pasados con montos pagados'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Número máximo de registros (default: 20)'
  })
  @ApiResponse({ status: 200, description: 'Historial de tickets' })
  async obtenerHistorial(
    @Request() req,
    @Query('limit') limit?: number
  ) {
    const authUserId = req.headers['x-auth-user-id'];
    
    if (!authUserId) {
      return {
        error: 'Se requiere autenticación. Incluye el header x-auth-user-id.'
      };
    }

    return this.userPortalService.obtenerHistorialTickets(authUserId, limit || 20);
  }

  /**
   * Obtener resumen de gastos totales
   */
  @Get('resumen-gastos')
  @ApiOperation({ 
    summary: 'Ver mi resumen de gastos',
    description: 'Muestra estadísticas: total de visitas, gasto total, tiempo total estacionado'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumen de gastos',
    schema: {
      example: {
        cliente: 'Juan Pérez',
        resumen: {
          totalVisitas: 15,
          totalGastado: 245.50,
          tiempoTotalHoras: 42.5,
          vehiculosRegistrados: 2
        },
        ultimaVisita: {
          fecha: '2024-01-14T18:00:00.000Z',
          vehiculo: 'ABC-123',
          monto: 12.50
        }
      }
    }
  })
  async obtenerResumenGastos(@Request() req) {
    const authUserId = req.headers['x-auth-user-id'];
    
    if (!authUserId) {
      return {
        error: 'Se requiere autenticación. Incluye el header x-auth-user-id.'
      };
    }

    return this.userPortalService.obtenerResumenGastos(authUserId);
  }
}
