import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum PartnerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum PartnerType {
  HOTEL = 'hotel',
  TOUR_OPERATOR = 'tour_operator',
  RESTAURANT = 'restaurant',
  PARKING_APP = 'parking_app',
  RESERVATION_SYSTEM = 'reservation_system',
  PAYMENT_GATEWAY = 'payment_gateway',
  OTHER = 'other',
}

@Entity('b2b_partners')
export class Partner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'enum', enum: PartnerType, default: PartnerType.OTHER })
  type: PartnerType;

  @Column({ type: 'enum', enum: PartnerStatus, default: PartnerStatus.PENDING })
  status: PartnerStatus;

  // Credenciales de autenticación
  @Column({ unique: true, name: 'api_key' })
  apiKey: string;

  @Column({ name: 'api_secret' })
  apiSecret: string; // HMAC secret - almacenado hasheado

  @Column({ name: 'webhook_url', nullable: true })
  webhookUrl: string;

  @Column({ name: 'webhook_secret', nullable: true })
  webhookSecret: string; // Para firmar webhooks salientes

  // Configuración
  @Column({ type: 'jsonb', default: {} })
  config: {
    allowedEvents?: string[];
    retryPolicy?: {
      maxRetries: number;
      backoffMultiplier: number;
    };
    rateLimit?: {
      requestsPerMinute: number;
      requestsPerDay: number;
    };
    ipWhitelist?: string[];
  };

  // Contacto
  @Column({ nullable: true })
  email: string;

  @Column({ name: 'contact_name', nullable: true })
  contactName: string;

  @Column({ nullable: true })
  phone: string;

  // Metadatos
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  // Estadísticas
  @Column({ name: 'total_requests', default: 0 })
  totalRequests: number;

  @Column({ name: 'successful_webhooks', default: 0 })
  successfulWebhooks: number;

  @Column({ name: 'failed_webhooks', default: 0 })
  failedWebhooks: number;

  @Column({ name: 'last_activity', nullable: true })
  lastActivity: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
