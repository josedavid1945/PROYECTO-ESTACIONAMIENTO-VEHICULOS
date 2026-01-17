import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Event, EventStatus, EventType } from './entities/event.entity';
import { PartnersService } from '../partners/partners.service';
import { v4 as uuidv4 } from 'uuid';

interface EmitEventOptions {
  partnerId: string;
  eventType: EventType;
  payload: Record<string, any>;
  idempotencyKey?: string;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  
  // Intervalos de backoff exponencial (en ms)
  private readonly backoffIntervals = [1000, 5000, 30000, 300000, 900000]; // 1s, 5s, 30s, 5m, 15m

  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private partnersService: PartnersService,
  ) {}

  /**
   * Emite un nuevo evento para un partner
   */
  async emit(options: EmitEventOptions): Promise<Event> {
    const { partnerId, eventType, payload, idempotencyKey } = options;

    // Verificar idempotencia
    if (idempotencyKey) {
      const existing = await this.eventsRepository.findOne({
        where: { idempotencyKey },
      });
      if (existing) {
        this.logger.debug(`Evento duplicado detectado: ${idempotencyKey}`);
        return existing;
      }
    }

    // Obtener configuración del partner
    const partner = await this.partnersService.findOne(partnerId);

    // Crear evento
    const event = this.eventsRepository.create({
      partnerId,
      eventType,
      payload: {
        ...payload,
        _meta: {
          eventId: uuidv4(),
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      },
      status: EventStatus.PENDING,
      maxRetries: partner.config?.retryPolicy?.maxRetries || 5,
      idempotencyKey: idempotencyKey || uuidv4(),
    });

    await this.eventsRepository.save(event);
    this.logger.log(`Evento creado: ${event.id} (${eventType}) para partner ${partner.name}`);

    // Intentar entrega inmediata
    this.deliverEvent(event.id).catch((err) => {
      this.logger.error(`Error en entrega inmediata: ${err.message}`);
    });

    return event;
  }

  /**
   * Intenta entregar un evento a su partner
   */
  async deliverEvent(eventId: string): Promise<boolean> {
    const event = await this.eventsRepository.findOne({ where: { id: eventId } });
    
    if (!event || event.status === EventStatus.DELIVERED || event.status === EventStatus.DEAD_LETTER) {
      return false;
    }

    event.status = EventStatus.PROCESSING;
    await this.eventsRepository.save(event);

    try {
      const partner = await this.partnersService.findOne(event.partnerId);
      
      if (!partner.webhookUrl) {
        throw new Error('Partner no tiene URL de webhook configurada');
      }

      // Generar firma HMAC
      const { signature, timestamp, nonce } = await this.partnersService.generateWebhookSignature(
        event.partnerId,
        event.payload,
      );

      // Enviar webhook
      const startTime = Date.now();
      const response = await fetch(partner.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event.eventType,
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-Nonce': nonce,
          'X-Webhook-Id': event.id,
          'User-Agent': 'B2B-Parking-Webhooks/1.0',
        },
        body: JSON.stringify(event.payload),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      const duration = Date.now() - startTime;
      const responseBody = await response.text().catch(() => '');

      event.response = {
        statusCode: response.status,
        body: responseBody,
        headers: Object.fromEntries(response.headers.entries()),
        duration,
      };

      if (response.ok) {
        event.status = EventStatus.DELIVERED;
        event.deliveredAt = new Date();
        await this.partnersService.incrementWebhookStats(event.partnerId, true);
        this.logger.log(`Evento ${event.id} entregado exitosamente (${duration}ms)`);
      } else {
        throw new Error(`HTTP ${response.status}: ${responseBody.substring(0, 200)}`);
      }

    } catch (error: any) {
      return this.handleDeliveryError(event, error);
    }

    await this.eventsRepository.save(event);
    return event.status === EventStatus.DELIVERED;
  }

  /**
   * Maneja errores de entrega y programa reintentos
   */
  private async handleDeliveryError(event: Event, error: Error): Promise<boolean> {
    event.retryCount++;
    
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      attempt: event.retryCount,
    };
    event.errorHistory.push(errorEntry);
    event.errorMessage = error.message;

    if (event.retryCount >= event.maxRetries) {
      // Mover a dead letter queue
      event.status = EventStatus.DEAD_LETTER;
      await this.partnersService.incrementWebhookStats(event.partnerId, false);
      this.logger.error(`Evento ${event.id} movido a dead letter después de ${event.retryCount} intentos`);
    } else {
      // Programar reintento con backoff exponencial
      const backoffIndex = Math.min(event.retryCount - 1, this.backoffIntervals.length - 1);
      const delay = this.backoffIntervals[backoffIndex];
      
      event.status = EventStatus.FAILED;
      event.nextRetryAt = new Date(Date.now() + delay);
      this.logger.warn(`Evento ${event.id} falló, reintento ${event.retryCount}/${event.maxRetries} en ${delay}ms`);
    }

    await this.eventsRepository.save(event);
    return false;
  }

  /**
   * Procesa reintentos pendientes (ejecuta cada 30 segundos)
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processRetries(): Promise<void> {
    const pendingEvents = await this.eventsRepository.find({
      where: {
        status: EventStatus.FAILED,
        nextRetryAt: LessThan(new Date()),
      },
      take: 50, // Procesar en lotes
    });

    if (pendingEvents.length > 0) {
      this.logger.debug(`Procesando ${pendingEvents.length} reintentos pendientes`);
      
      for (const event of pendingEvents) {
        await this.deliverEvent(event.id);
      }
    }
  }

  /**
   * Obtiene eventos con filtros
   */
  async findAll(filters?: {
    partnerId?: string;
    status?: EventStatus;
    eventType?: EventType;
    fromDate?: Date;
    limit?: number;
  }): Promise<Event[]> {
    const query = this.eventsRepository.createQueryBuilder('event');

    if (filters?.partnerId) {
      query.andWhere('event.partnerId = :partnerId', { partnerId: filters.partnerId });
    }
    if (filters?.status) {
      query.andWhere('event.status = :status', { status: filters.status });
    }
    if (filters?.eventType) {
      query.andWhere('event.eventType = :eventType', { eventType: filters.eventType });
    }
    if (filters?.fromDate) {
      query.andWhere('event.createdAt >= :fromDate', { fromDate: filters.fromDate });
    }

    query.orderBy('event.createdAt', 'DESC');
    query.take(filters?.limit || 100);

    return query.getMany();
  }

  /**
   * Obtiene estadísticas de eventos
   */
  async getStats(partnerId?: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    failed: number;
    deadLetter: number;
    avgDeliveryTime: number;
  }> {
    const baseQuery = this.eventsRepository.createQueryBuilder('event');
    
    if (partnerId) {
      baseQuery.where('event.partnerId = :partnerId', { partnerId });
    }

    const [total, pending, delivered, failed, deadLetter] = await Promise.all([
      baseQuery.clone().getCount(),
      baseQuery.clone().andWhere('event.status = :status', { status: EventStatus.PENDING }).getCount(),
      baseQuery.clone().andWhere('event.status = :status', { status: EventStatus.DELIVERED }).getCount(),
      baseQuery.clone().andWhere('event.status = :status', { status: EventStatus.FAILED }).getCount(),
      baseQuery.clone().andWhere('event.status = :status', { status: EventStatus.DEAD_LETTER }).getCount(),
    ]);

    // Calcular tiempo promedio de entrega
    const avgResult = await this.eventsRepository
      .createQueryBuilder('event')
      .select('AVG(EXTRACT(EPOCH FROM (event.delivered_at - event.created_at)) * 1000)', 'avg')
      .where('event.status = :status', { status: EventStatus.DELIVERED })
      .andWhere('event.deliveredAt IS NOT NULL')
      .getRawOne();

    return {
      total,
      pending,
      delivered,
      failed,
      deadLetter,
      avgDeliveryTime: Math.round(avgResult?.avg || 0),
    };
  }

  /**
   * Reintenta manualmente un evento fallido
   */
  async retryEvent(eventId: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({ where: { id: eventId } });
    
    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.status === EventStatus.DELIVERED) {
      throw new Error('El evento ya fue entregado');
    }

    event.status = EventStatus.PENDING;
    event.retryCount = 0;
    event.nextRetryAt = undefined as any;
    await this.eventsRepository.save(event);

    await this.deliverEvent(event.id);
    
    return this.eventsRepository.findOne({ where: { id: eventId } }) as Promise<Event>;
  }

  /**
   * Obtiene eventos de la dead letter queue
   */
  async getDeadLetterQueue(partnerId?: string): Promise<Event[]> {
    return this.findAll({
      partnerId,
      status: EventStatus.DEAD_LETTER,
      limit: 100,
    });
  }
}
