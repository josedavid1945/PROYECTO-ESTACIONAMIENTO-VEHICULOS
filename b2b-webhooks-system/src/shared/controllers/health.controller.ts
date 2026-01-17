import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParkingApiService } from '../services/parking-api.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly parkingApi: ParkingApiService) {}

  @Get()
  @ApiOperation({ summary: 'Health check del servicio B2B' })
  @ApiResponse({ status: 200, description: 'Servicio saludable' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        b2bWebhooks: 'healthy',
        parkingApi: this.parkingApi.isApiAvailable() ? 'connected' : 'disconnected',
      },
      version: '1.0.0',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Servicio listo' })
  ready() {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Servicio vivo' })
  live() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
    };
  }
}
