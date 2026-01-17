import { Controller, Post, Body, Headers, Get, Query, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { PartnersService } from '../partners/partners.service';
import { EventsService } from '../events/events.service';
import { EventType } from '../events/entities/event.entity';

/**
 * WebhooksController - Recibe webhooks de partners externos
 * y gestiona la simulación de partners
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  // Almacén de webhooks recibidos (para simulación/debugging)
  private receivedWebhooks: Array<{
    timestamp: Date;
    source: string;
    event: string;
    payload: any;
    headers: Record<string, string>;
  }> = [];

  constructor(
    private readonly partnersService: PartnersService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Endpoint para recibir webhooks de partners externos
   */
  @Post('receive')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Recibir webhook de partner externo',
    description: 'Endpoint autenticado con HMAC para recibir eventos de partners'
  })
  @ApiHeader({ name: 'X-API-Key', required: true })
  @ApiHeader({ name: 'X-Signature', required: true })
  @ApiHeader({ name: 'X-Timestamp', required: true })
  @ApiHeader({ name: 'X-Nonce', required: true })
  @ApiHeader({ name: 'X-Webhook-Event', required: false })
  @ApiResponse({ status: 200, description: 'Webhook recibido y procesado' })
  @ApiResponse({ status: 401, description: 'Autenticación fallida' })
  async receiveWebhook(
    @Headers('x-api-key') apiKey: string,
    @Headers('x-signature') signature: string,
    @Headers('x-timestamp') timestamp: string,
    @Headers('x-nonce') nonce: string,
    @Headers('x-webhook-event') eventType: string,
    @Body() payload: any,
  ) {
    // Verificar autenticación HMAC
    const partner = await this.partnersService.verifyHmacAuth(
      apiKey,
      signature,
      timestamp,
      nonce,
      JSON.stringify(payload),
    );

    this.logger.log(`Webhook recibido de ${partner.name}: ${eventType || 'unknown'}`);

    // Almacenar para debugging
    this.receivedWebhooks.push({
      timestamp: new Date(),
      source: partner.name,
      event: eventType || 'unknown',
      payload,
      headers: { 'x-api-key': apiKey.substring(0, 10) + '...', 'x-webhook-event': eventType },
    });

    // Mantener solo los últimos 100
    if (this.receivedWebhooks.length > 100) {
      this.receivedWebhooks = this.receivedWebhooks.slice(-100);
    }

    // Procesar según el tipo de evento
    await this.processIncomingWebhook(partner.id, eventType, payload);

    return {
      success: true,
      message: 'Webhook procesado correctamente',
      eventId: payload._meta?.eventId || null,
    };
  }

  /**
   * Simula un endpoint de partner para pruebas
   */
  @Post('simulate/partner-endpoint')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Endpoint simulado de partner',
    description: 'Simula el endpoint de un partner para probar webhooks salientes'
  })
  @ApiHeader({ name: 'X-Webhook-Event', required: false })
  @ApiHeader({ name: 'X-Webhook-Signature', required: false })
  @ApiResponse({ status: 200, description: 'Webhook recibido por simulador' })
  async simulatePartnerEndpoint(
    @Headers() headers: Record<string, string>,
    @Body() payload: any,
  ) {
    const eventType = headers['x-webhook-event'] || 'unknown';
    
    this.logger.log(`[SIMULADOR] Webhook recibido: ${eventType}`);

    // Almacenar
    this.receivedWebhooks.push({
      timestamp: new Date(),
      source: 'SIMULATOR',
      event: eventType,
      payload,
      headers: {
        'x-webhook-event': eventType,
        'x-webhook-id': headers['x-webhook-id'] || '',
        'x-webhook-signature': headers['x-webhook-signature']?.substring(0, 20) + '...' || '',
      },
    });

    // Simular diferentes respuestas según el payload
    if (payload._simulateError) {
      throw new Error('Error simulado para pruebas');
    }

    if (payload._simulateTimeout) {
      await new Promise(resolve => setTimeout(resolve, 35000));
    }

    return {
      received: true,
      timestamp: new Date().toISOString(),
      eventType,
      eventId: payload._meta?.eventId,
    };
  }

  /**
   * Obtiene webhooks recibidos (para debugging)
   */
  @Get('received')
  @ApiOperation({ summary: 'Listar webhooks recibidos (debugging)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Lista de webhooks recibidos' })
  getReceivedWebhooks(@Query('limit') limit?: number) {
    const l = limit ? parseInt(String(limit), 10) : 20;
    return {
      total: this.receivedWebhooks.length,
      webhooks: this.receivedWebhooks.slice(-l).reverse(),
    };
  }

  /**
   * Limpia el log de webhooks recibidos
   */
  @Post('received/clear')
  @ApiOperation({ summary: 'Limpiar log de webhooks recibidos' })
  @ApiResponse({ status: 200, description: 'Log limpiado' })
  clearReceivedWebhooks() {
    const count = this.receivedWebhooks.length;
    this.receivedWebhooks = [];
    return { success: true, cleared: count };
  }

  /**
   * Simula un evento de parking (para pruebas B2B)
   */
  @Post('simulate/parking-event')
  @ApiOperation({ 
    summary: 'Simular evento de estacionamiento',
    description: 'Genera un evento simulado de parking y lo envía a todos los partners suscritos'
  })
  @ApiResponse({ status: 201, description: 'Eventos enviados' })
  async simulateParkingEvent(@Body() dto: {
    eventType: 'reserved' | 'entered' | 'exited' | 'space_updated';
    partnerId?: string;
    data?: Record<string, any>;
  }) {
    const eventTypeMap: Record<string, EventType> = {
      reserved: EventType.PARKING_RESERVED,
      entered: EventType.PARKING_ENTERED,
      exited: EventType.PARKING_EXITED,
      space_updated: EventType.SPACE_UPDATED,
    };

    const eventType = eventTypeMap[dto.eventType] || EventType.CUSTOM;
    
    // Payload de ejemplo
    const payload = dto.data || this.generateSamplePayload(dto.eventType);

    if (dto.partnerId) {
      // Enviar a un partner específico
      const event = await this.eventsService.emit({
        partnerId: dto.partnerId,
        eventType,
        payload,
      });
      
      return { success: true, events: [event] };
    }

    // Enviar a todos los partners activos
    const partners = await this.partnersService.findAll();
    const events = [];
    
    for (const partner of partners) {
      if (partner.status === 'active' && partner.config?.allowedEvents?.includes(eventType)) {
        const event = await this.eventsService.emit({
          partnerId: partner.id,
          eventType,
          payload,
        });
        events.push(event);
      }
    }

    return { 
      success: true, 
      eventsCreated: events.length,
      events: events.map(e => ({ id: e.id, partnerId: e.partnerId, status: e.status })),
    };
  }

  /**
   * Simula un ciclo completo de parking
   */
  @Post('simulate/full-cycle')
  @ApiOperation({ 
    summary: 'Simular ciclo completo de estacionamiento',
    description: 'Genera eventos: reserva → entrada → salida → pago para un partner'
  })
  @ApiResponse({ status: 201, description: 'Ciclo simulado' })
  async simulateFullCycle(@Body() dto: {
    partnerId: string;
    vehiclePlate: string;
    delayBetweenEvents?: number;
  }) {
    const delay = dto.delayBetweenEvents || 2000;
    const results = [];

    // 1. Reserva
    const reserva = await this.eventsService.emit({
      partnerId: dto.partnerId,
      eventType: EventType.PARKING_RESERVED,
      payload: {
        vehiclePlate: dto.vehiclePlate,
        spaceId: `ESP-${Math.floor(Math.random() * 100)}`,
        reservedAt: new Date().toISOString(),
        estimatedDuration: 120,
      },
    });
    results.push({ step: 'reserved', eventId: reserva.id });

    await this.sleep(delay);

    // 2. Entrada
    const entrada = await this.eventsService.emit({
      partnerId: dto.partnerId,
      eventType: EventType.PARKING_ENTERED,
      payload: {
        vehiclePlate: dto.vehiclePlate,
        ticketId: `TKT-${Date.now()}`,
        enteredAt: new Date().toISOString(),
        spaceId: reserva.payload.spaceId,
      },
    });
    results.push({ step: 'entered', eventId: entrada.id });

    await this.sleep(delay);

    // 3. Salida
    const salida = await this.eventsService.emit({
      partnerId: dto.partnerId,
      eventType: EventType.PARKING_EXITED,
      payload: {
        vehiclePlate: dto.vehiclePlate,
        ticketId: entrada.payload.ticketId,
        exitedAt: new Date().toISOString(),
        duration: Math.floor(Math.random() * 180) + 30,
        amount: Math.floor(Math.random() * 20) + 5,
      },
    });
    results.push({ step: 'exited', eventId: salida.id });

    await this.sleep(delay);

    // 4. Pago exitoso
    const pago = await this.eventsService.emit({
      partnerId: dto.partnerId,
      eventType: EventType.PAYMENT_SUCCESS,
      payload: {
        ticketId: entrada.payload.ticketId,
        amount: salida.payload.amount,
        currency: 'USD',
        paymentMethod: 'card',
        transactionId: `TXN-${Date.now()}`,
        paidAt: new Date().toISOString(),
      },
    });
    results.push({ step: 'payment', eventId: pago.id });

    return {
      success: true,
      vehiclePlate: dto.vehiclePlate,
      steps: results,
    };
  }

  // Métodos privados

  private async processIncomingWebhook(partnerId: string, eventType: string, payload: any): Promise<void> {
    // Aquí se puede implementar lógica para procesar webhooks entrantes
    // Por ejemplo, actualizar estado local, disparar acciones, etc.
    this.logger.debug(`Procesando webhook ${eventType} de partner ${partnerId}`);
  }

  private generateSamplePayload(eventType: string): Record<string, any> {
    const base = {
      timestamp: new Date().toISOString(),
      source: 'simulator',
    };

    switch (eventType) {
      case 'reserved':
        return {
          ...base,
          vehiclePlate: `ABC-${Math.floor(Math.random() * 1000)}`,
          spaceId: `ESP-${Math.floor(Math.random() * 100)}`,
          reservedAt: new Date().toISOString(),
          estimatedDuration: 60,
        };
      case 'entered':
        return {
          ...base,
          vehiclePlate: `XYZ-${Math.floor(Math.random() * 1000)}`,
          ticketId: `TKT-${Date.now()}`,
          enteredAt: new Date().toISOString(),
        };
      case 'exited':
        return {
          ...base,
          vehiclePlate: `DEF-${Math.floor(Math.random() * 1000)}`,
          ticketId: `TKT-${Date.now() - 3600000}`,
          exitedAt: new Date().toISOString(),
          duration: 60,
          amount: 10.50,
        };
      case 'space_updated':
        return {
          ...base,
          spaceId: `ESP-${Math.floor(Math.random() * 100)}`,
          available: Math.random() > 0.5,
          section: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        };
      default:
        return base;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
