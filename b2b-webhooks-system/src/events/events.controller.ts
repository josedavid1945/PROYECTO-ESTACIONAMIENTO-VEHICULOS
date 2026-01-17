import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { EventStatus, EventType } from './entities/event.entity';

class EmitEventDto {
  partnerId: string;
  eventType: EventType;
  payload: Record<string, any>;
  idempotencyKey?: string;
}

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('emit')
  @ApiOperation({ summary: 'Emitir un nuevo evento' })
  @ApiResponse({ status: 201, description: 'Evento creado y en cola para entrega' })
  async emitEvent(@Body() dto: EmitEventDto) {
    return this.eventsService.emit(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar eventos con filtros' })
  @ApiQuery({ name: 'partnerId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: EventStatus })
  @ApiQuery({ name: 'eventType', required: false, enum: EventType })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista de eventos' })
  async findAll(
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: EventStatus,
    @Query('eventType') eventType?: EventType,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.findAll({
      partnerId,
      status,
      eventType,
      limit: limit ? parseInt(String(limit), 10) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de eventos' })
  @ApiQuery({ name: 'partnerId', required: false })
  @ApiResponse({ status: 200, description: 'Estadísticas de eventos' })
  async getStats(@Query('partnerId') partnerId?: string) {
    return this.eventsService.getStats(partnerId);
  }

  @Get('dead-letter')
  @ApiOperation({ summary: 'Obtener eventos en dead letter queue' })
  @ApiQuery({ name: 'partnerId', required: false })
  @ApiResponse({ status: 200, description: 'Eventos en DLQ' })
  async getDeadLetter(@Query('partnerId') partnerId?: string) {
    return this.eventsService.getDeadLetterQueue(partnerId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Reintentar entrega de evento fallido' })
  @ApiResponse({ status: 200, description: 'Evento reenviado' })
  async retryEvent(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.retryEvent(id);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: 'Forzar entrega inmediata de evento' })
  @ApiResponse({ status: 200, description: 'Resultado de entrega' })
  async deliverNow(@Param('id', ParseUUIDPipe) id: string) {
    const success = await this.eventsService.deliverEvent(id);
    return { success, eventId: id };
  }
}
