import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  DEAD_LETTER = 'dead_letter',
}

export enum EventType {
  // Eventos de estacionamiento
  PARKING_RESERVED = 'parking.reserved',
  PARKING_ENTERED = 'parking.entered',
  PARKING_EXITED = 'parking.exited',
  SPACE_UPDATED = 'space.updated',
  
  // Eventos de pagos
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  
  // Eventos de sistema
  PARTNER_REGISTERED = 'partner.registered',
  PARTNER_UPDATED = 'partner.updated',
  
  // Eventos personalizados
  CUSTOM = 'custom',
}

@Entity('b2b_events')
@Index(['partnerId', 'status'])
@Index(['eventType', 'createdAt'])
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'partner_id' })
  partnerId: string;

  @Column({ 
    type: 'enum', 
    enum: EventType, 
    name: 'event_type' 
  })
  eventType: EventType;

  @Column({ 
    type: 'enum', 
    enum: EventStatus, 
    default: EventStatus.PENDING 
  })
  status: EventStatus;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  response: {
    statusCode?: number;
    body?: any;
    headers?: Record<string, string>;
    duration?: number;
  };

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'max_retries', default: 5 })
  maxRetries: number;

  @Column({ name: 'next_retry_at', nullable: true })
  nextRetryAt: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ type: 'jsonb', name: 'error_history', default: [] })
  errorHistory: Array<{
    timestamp: string;
    message: string;
    attempt: number;
  }>;

  @Column({ name: 'idempotency_key', unique: true, nullable: true })
  idempotencyKey: string;

  @Column({ default: '1.0', name: 'schema_version' })
  schemaVersion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
