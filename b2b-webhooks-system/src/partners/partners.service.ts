import { Injectable, Logger, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Partner, PartnerStatus } from './entities/partner.entity';
import { CreatePartnerDto, UpdatePartnerDto, PartnerCredentialsResponseDto } from './dto/partner.dto';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);
  private readonly hmacToleranceMinutes: number;
  private readonly nonceExpiryMinutes: number;
  
  // Almacén de nonces para prevenir replay attacks
  private usedNonces = new Map<string, number>();

  constructor(
    @InjectRepository(Partner)
    private partnersRepository: Repository<Partner>,
    private configService: ConfigService,
  ) {
    this.hmacToleranceMinutes = this.configService.get('HMAC_TOLERANCE_MINUTES', 5);
    this.nonceExpiryMinutes = this.configService.get('NONCE_EXPIRY_MINUTES', 10);
    
    // Limpiar nonces expirados cada 5 minutos
    setInterval(() => this.cleanExpiredNonces(), 5 * 60 * 1000);
  }

  /**
   * Registra un nuevo partner y genera credenciales únicas
   */
  async register(dto: CreatePartnerDto): Promise<PartnerCredentialsResponseDto> {
    // Verificar que no exista
    const existing = await this.partnersRepository.findOne({
      where: { name: dto.name },
    });
    
    if (existing) {
      throw new ConflictException(`Ya existe un partner con el nombre "${dto.name}"`);
    }

    // Generar credenciales únicas
    const apiKey = this.generateApiKey();
    const apiSecret = this.generateSecret(32);
    const webhookSecret = this.generateSecret(24);

    // Crear partner
    const partner = this.partnersRepository.create({
      ...dto,
      apiKey,
      apiSecret: this.hashSecret(apiSecret), // Almacenar hasheado
      webhookSecret: this.hashSecret(webhookSecret),
      status: PartnerStatus.ACTIVE,
      config: {
        allowedEvents: dto.config?.allowedEvents || [
          'parking.reserved',
          'parking.entered',
          'parking.exited',
          'payment.success',
          'payment.failed',
          'space.updated',
        ],
        retryPolicy: dto.config?.retryPolicy || {
          maxRetries: 5,
          backoffMultiplier: 2,
        },
        rateLimit: dto.config?.rateLimit || {
          requestsPerMinute: 100,
          requestsPerDay: 10000,
        },
        ...dto.config,
      },
    });

    await this.partnersRepository.save(partner);
    
    this.logger.log(`Partner registrado: ${partner.name} (${partner.id})`);

    return {
      id: partner.id,
      name: partner.name,
      apiKey,
      apiSecret, // Solo se muestra una vez
      webhookSecret, // Solo se muestra una vez
      instructions: `
        ¡Partner registrado exitosamente!
        
        IMPORTANTE: Guarda estas credenciales de forma segura, NO se mostrarán de nuevo.
        
        1. Usa el API Key en el header "X-API-Key" para autenticarte
        2. Firma tus requests con HMAC-SHA256 usando el apiSecret
        3. Verifica los webhooks entrantes con el webhookSecret
        
        Ejemplo de firma HMAC:
        const signature = crypto.createHmac('sha256', apiSecret)
          .update(timestamp + '.' + JSON.stringify(body))
          .digest('hex');
        
        Headers requeridos:
        - X-API-Key: ${apiKey}
        - X-Signature: sha256=<signature>
        - X-Timestamp: <unix_timestamp>
        - X-Nonce: <random_string>
      `,
    };
  }

  /**
   * Verifica autenticación HMAC de un request
   */
  async verifyHmacAuth(
    apiKey: string,
    signature: string,
    timestamp: string,
    nonce: string,
    body: string,
  ): Promise<Partner> {
    // 1. Buscar partner por API key
    const partner = await this.partnersRepository.findOne({
      where: { apiKey, status: PartnerStatus.ACTIVE },
    });

    if (!partner) {
      throw new UnauthorizedException('API Key inválida o partner inactivo');
    }

    // 2. Verificar timestamp (protección contra replay)
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);
    
    if (timeDiff > this.hmacToleranceMinutes * 60) {
      throw new UnauthorizedException(`Timestamp fuera de rango (${timeDiff}s de diferencia)`);
    }

    // 3. Verificar nonce (protección contra replay)
    const nonceKey = `${apiKey}:${nonce}`;
    if (this.usedNonces.has(nonceKey)) {
      throw new UnauthorizedException('Nonce ya utilizado (posible replay attack)');
    }
    this.usedNonces.set(nonceKey, Date.now());

    // 4. Verificar firma HMAC usando timing-safe comparison
    const expectedSignature = this.generateHmacSignature(
      partner.apiSecret,
      timestamp,
      body,
    );

    const providedSig = signature.replace('sha256=', '');
    
    if (!this.timingSafeCompare(expectedSignature, providedSig)) {
      throw new UnauthorizedException('Firma HMAC inválida');
    }

    // Actualizar última actividad
    partner.lastActivity = new Date();
    partner.totalRequests++;
    await this.partnersRepository.save(partner);

    return partner;
  }

  /**
   * Genera firma HMAC para un payload (usado para webhooks salientes)
   */
  generateWebhookSignature(partnerId: string, payload: any): Promise<{
    signature: string;
    timestamp: string;
    nonce: string;
  }> {
    return this.partnersRepository.findOne({ where: { id: partnerId } }).then((partner) => {
      if (!partner) {
        throw new NotFoundException('Partner no encontrado');
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = randomBytes(16).toString('hex');
      const body = JSON.stringify(payload);
      
      const signature = createHmac('sha256', partner.webhookSecret)
        .update(`${timestamp}.${nonce}.${body}`)
        .digest('hex');

      return {
        signature: `sha256=${signature}`,
        timestamp,
        nonce,
      };
    });
  }

  /**
   * Rota las credenciales de un partner
   */
  async rotateCredentials(partnerId: string): Promise<{
    apiKey: string;
    apiSecret: string;
    webhookSecret: string;
  }> {
    const partner = await this.partnersRepository.findOne({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Partner no encontrado');
    }

    const newApiKey = this.generateApiKey();
    const newApiSecret = this.generateSecret(32);
    const newWebhookSecret = this.generateSecret(24);

    partner.apiKey = newApiKey;
    partner.apiSecret = this.hashSecret(newApiSecret);
    partner.webhookSecret = this.hashSecret(newWebhookSecret);

    await this.partnersRepository.save(partner);
    
    this.logger.log(`Credenciales rotadas para partner: ${partner.name}`);

    return {
      apiKey: newApiKey,
      apiSecret: newApiSecret,
      webhookSecret: newWebhookSecret,
    };
  }

  // CRUD básico

  async findAll(): Promise<Partner[]> {
    return this.partnersRepository.find({
      select: ['id', 'name', 'type', 'status', 'email', 'webhookUrl', 'totalRequests', 'lastActivity', 'createdAt'],
    });
  }

  async findOne(id: string): Promise<Partner> {
    const partner = await this.partnersRepository.findOne({ where: { id } });
    if (!partner) {
      throw new NotFoundException('Partner no encontrado');
    }
    return partner;
  }

  async findByApiKey(apiKey: string): Promise<Partner | null> {
    return this.partnersRepository.findOne({ where: { apiKey } });
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);
    Object.assign(partner, dto);
    return this.partnersRepository.save(partner);
  }

  async updateStatus(id: string, status: PartnerStatus): Promise<Partner> {
    const partner = await this.findOne(id);
    partner.status = status;
    return this.partnersRepository.save(partner);
  }

  async incrementWebhookStats(id: string, success: boolean): Promise<void> {
    if (success) {
      await this.partnersRepository.increment({ id }, 'successfulWebhooks', 1);
    } else {
      await this.partnersRepository.increment({ id }, 'failedWebhooks', 1);
    }
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnersRepository.remove(partner);
    this.logger.log(`Partner eliminado: ${partner.name}`);
  }

  // Utilidades privadas

  private generateApiKey(): string {
    const prefix = 'pk_';
    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const random = randomBytes(24).toString('base64url');
    return `${prefix}${env}_${random}`;
  }

  private generateSecret(bytes: number): string {
    return randomBytes(bytes).toString('base64url');
  }

  private hashSecret(secret: string): string {
    return createHmac('sha256', 'b2b-parking-secret-salt')
      .update(secret)
      .digest('hex');
  }

  private generateHmacSignature(hashedSecret: string, timestamp: string, body: string): string {
    return createHmac('sha256', hashedSecret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
  }

  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    try {
      return timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }

  private cleanExpiredNonces(): void {
    const expiryTime = Date.now() - (this.nonceExpiryMinutes * 60 * 1000);
    let cleaned = 0;
    
    for (const [key, timestamp] of this.usedNonces.entries()) {
      if (timestamp < expiryTime) {
        this.usedNonces.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`Limpiados ${cleaned} nonces expirados`);
    }
  }
}
