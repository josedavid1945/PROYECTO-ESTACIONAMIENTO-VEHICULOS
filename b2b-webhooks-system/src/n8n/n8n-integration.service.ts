import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * N8nIntegrationService - Integración directa con n8n webhooks
 * 
 * Este servicio envía eventos directamente a los webhooks de n8n
 * sin necesidad de registrar n8n como partner en la base de datos.
 */
@Injectable()
export class N8nIntegrationService implements OnModuleInit {
  private readonly logger = new Logger(N8nIntegrationService.name);
  private readonly n8nBaseUrl: string;
  private readonly enabled: boolean;

  // Mapeo de tipos de evento a webhooks de n8n
  private readonly webhookMap: { [key: string]: string } = {
    // Telegram Notifications - eventos que envían notificación
    'parking.exited': '/webhook/telegram-notify',
    'client.registered': '/webhook/telegram-notify',
    
    // Report Handler - reportes
    'report.daily': '/webhook/report-manual',
    'report.generated': '/webhook/report-manual',
    'report.requested': '/webhook/report-manual',
    
    // Partner Handler - otros eventos de estacionamiento
    'parking.entered': '/webhook/partner-webhook',
    'parking.reserved': '/webhook/partner-webhook',
    'space.updated': '/webhook/partner-webhook',
    
    // Payment Handler - eventos de pago
    'payment.completed': '/webhook/payment-webhook',
    'payment.failed': '/webhook/payment-webhook',
    'payment.refunded': '/webhook/payment-webhook',
    
    // MCP Handler - eventos del chatbot
    'mcp.tool_executed': '/webhook/mcp-events',
    'mcp.chat_completed': '/webhook/mcp-events',
  };

  constructor(private configService: ConfigService) {
    this.n8nBaseUrl = this.configService.get('N8N_WEBHOOK_URL', 'http://parking-n8n:5678');
    this.enabled = this.configService.get('N8N_INTEGRATION_ENABLED', 'true') === 'true';
  }

  async onModuleInit() {
    if (this.enabled) {
      this.logger.log(`🔗 Integración n8n habilitada - Base URL: ${this.n8nBaseUrl}`);
      await this.testConnection();
    } else {
      this.logger.warn('⚠️ Integración n8n deshabilitada');
    }
  }

  /**
   * Prueba la conexión con n8n
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/healthz`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        this.logger.log('✅ Conexión con n8n establecida');
        return true;
      }
      
      this.logger.warn(`⚠️ n8n respondió con status ${response.status}`);
      return false;
    } catch (error: any) {
      this.logger.warn(`⚠️ No se pudo conectar con n8n: ${error.message}`);
      return false;
    }
  }

  /**
   * Envía un evento a n8n
   */
  async sendEvent(
    eventType: string,
    payload: Record<string, any>,
    options?: {
      partnerId?: string;
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    if (!this.enabled) {
      return { success: false, error: 'n8n integration disabled' };
    }

    // Determinar el webhook según el tipo de evento
    const webhookPath = this.webhookMap[eventType] || '/webhook/generic-event';
    const webhookUrl = `${this.n8nBaseUrl}${webhookPath}`;

    // Construir headers para autenticación
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': eventType,
      'X-Timestamp': timestamp,
      'X-API-Key': options?.partnerId || 'internal-system',
      'X-Signature': 'internal-signature', // Para eventos internos
      'X-Nonce': `nonce_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      'X-Priority': options?.priority || 'normal',
    };

    // Construir el payload completo
    const fullPayload = {
      eventType,
      timestamp: new Date().toISOString(),
      source: 'b2b-webhooks-system',
      ...payload,
      _meta: {
        eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        version: '1.0',
        sentAt: new Date().toISOString(),
      },
    };

    this.logger.log(`📤 Enviando evento a n8n: ${eventType} → ${webhookPath}`);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(fullPayload),
        signal: AbortSignal.timeout(30000),
      });

      const responseText = await response.text();
      let responseData: any;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      if (response.ok) {
        this.logger.log(`✅ Evento ${eventType} entregado a n8n (${response.status})`);
        return { success: true, response: responseData };
      } else {
        this.logger.warn(`⚠️ n8n respondió con error ${response.status}: ${responseText}`);
        return { success: false, error: `HTTP ${response.status}: ${responseText}` };
      }
    } catch (error: any) {
      this.logger.error(`❌ Error enviando evento a n8n: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía evento de entrada de vehículo
   */
  async emitParkingEntered(data: {
    ticketId: string;
    vehiculoPlaca: string;
    espacioId: string;
    fechaEntrada: string;
    clienteId?: string;
  }) {
    return this.sendEvent('parking.entered', {
      type: 'parking.entered',
      ticket: data,
    });
  }

  /**
   * Envía evento de salida de vehículo
   */
  async emitParkingExited(data: {
    ticketId: string;
    vehiculoPlaca: string;
    espacioId: string;
    fechaSalida: string;
    duracionMinutos: number;
    monto: number;
  }) {
    return this.sendEvent('parking.exited', {
      type: 'parking.exited',
      ticket: data,
    });
  }

  /**
   * Envía evento de pago completado
   */
  async emitPaymentCompleted(data: {
    paymentId: string;
    ticketId: string;
    amount: number;
    status: string;
    method?: string;
    customerEmail?: string;
  }) {
    return this.sendEvent('payment.completed', {
      paymentId: data.paymentId,
      ticketId: data.ticketId,
      amount: data.amount,
      status: data.status || 'completed',
      method: data.method || 'efectivo',
      customerEmail: data.customerEmail,
    });
  }

  /**
   * Envía evento de reporte generado
   */
  async emitReportGenerated(data: {
    reportType: 'daily' | 'operativo' | 'recaudacion';
    fecha: string;
    datos: Record<string, any>;
    solicitadoPor?: string;
  }) {
    return this.sendEvent('report.generated', {
      reportType: data.reportType,
      fecha: data.fecha,
      datos: data.datos,
      solicitadoPor: data.solicitadoPor || 'system',
    });
  }

  /**
   * Envía evento de herramienta MCP ejecutada
   */
  async emitToolExecuted(data: {
    toolName: string;
    input: Record<string, any>;
    output: any;
    duration: number;
    userId?: string;
  }) {
    return this.sendEvent('mcp.tool_executed', {
      tool: data.toolName,
      input: data.input,
      output: data.output,
      duration: data.duration,
      executedBy: data.userId || 'anonymous',
    });
  }

  /**
   * Obtiene la lista de webhooks configurados
   */
  getWebhookMap() {
    return { ...this.webhookMap };
  }

  /**
   * Verifica si un tipo de evento está soportado
   */
  isEventTypeSupported(eventType: string): boolean {
    return eventType in this.webhookMap;
  }
}
