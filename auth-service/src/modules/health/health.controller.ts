import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Verifica que el servicio esté funcionando correctamente',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio funcionando correctamente',
  })
  check() {
    return {
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness check',
    description: 'Verifica que el servicio esté listo para recibir tráfico',
  })
  @ApiResponse({
    status: 200,
    description: 'Servicio listo',
  })
  ready() {
    return {
      status: 'ready',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    };
  }
}
