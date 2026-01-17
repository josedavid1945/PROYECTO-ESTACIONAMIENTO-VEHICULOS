import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SignatureService {
  /**
   * Genera firma HMAC-SHA256 para un payload
   */
  generateSignature(payload: string | object, secret: string): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verifica firma usando comparación segura de tiempo constante
   */
  verifySignature(
    payload: string | object, 
    signature: string, 
    secret: string
  ): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    
    // Comparación de tiempo constante para prevenir timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Genera un nonce único
   */
  generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Genera una API key segura
   */
  generateApiKey(prefix: string = 'b2b'): string {
    return `${prefix}_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Genera un secret seguro
   */
  generateSecret(): string {
    return crypto.randomBytes(48).toString('base64');
  }

  /**
   * Hash de un valor (para almacenamiento seguro)
   */
  hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Genera header de autorización completo para webhooks
   */
  generateWebhookHeaders(
    payload: object, 
    secret: string
  ): Record<string, string> {
    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    const signaturePayload = `${timestamp}.${nonce}.${JSON.stringify(payload)}`;
    const signature = this.generateSignature(signaturePayload, secret);

    return {
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Nonce': nonce,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Valida headers de webhook completos
   */
  validateWebhookHeaders(
    payload: object,
    headers: Record<string, string>,
    secret: string,
    maxAgeMs: number = 300000 // 5 minutos
  ): { valid: boolean; error?: string } {
    const signature = headers['x-webhook-signature'] || headers['X-Webhook-Signature'];
    const timestamp = headers['x-webhook-timestamp'] || headers['X-Webhook-Timestamp'];
    const nonce = headers['x-webhook-nonce'] || headers['X-Webhook-Nonce'];

    if (!signature || !timestamp || !nonce) {
      return { valid: false, error: 'Missing required headers' };
    }

    // Verificar timestamp
    const timestampNum = parseInt(timestamp, 10);
    if (isNaN(timestampNum)) {
      return { valid: false, error: 'Invalid timestamp format' };
    }

    const age = Date.now() - timestampNum;
    if (age > maxAgeMs || age < -60000) { // También rechazar timestamps futuros
      return { valid: false, error: 'Timestamp expired or invalid' };
    }

    // Reconstruir y verificar firma
    const signaturePayload = `${timestamp}.${nonce}.${JSON.stringify(payload)}`;
    const valid = this.verifySignature(signaturePayload, signature, secret);

    if (!valid) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
  }
}
