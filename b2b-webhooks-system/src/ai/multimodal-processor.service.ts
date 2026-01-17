import { Injectable, Logger } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
// @ts-ignore
import pdfParse from 'pdf-parse';

export interface ProcessedInput {
  type: 'text' | 'image' | 'pdf';
  originalContent: Buffer | string;
  extractedText: string;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * MultimodalProcessor - Procesa diferentes tipos de entrada
 */
@Injectable()
export class MultimodalProcessorService {
  private readonly logger = new Logger(MultimodalProcessorService.name);

  /**
   * Procesa texto plano
   */
  async processText(text: string): Promise<ProcessedInput> {
    // Limpiar y normalizar texto
    const cleaned = text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\S\r\n]+/g, ' ');

    // Detectar idioma básico
    const isSpanish = /[áéíóúñ¿¡]/i.test(text);

    return {
      type: 'text',
      originalContent: text,
      extractedText: cleaned,
      metadata: {
        originalLength: text.length,
        cleanedLength: cleaned.length,
        detectedLanguage: isSpanish ? 'es' : 'en',
      },
    };
  }

  /**
   * Procesa imagen con OCR (Tesseract.js)
   */
  async processImage(imageBuffer: Buffer, mimeType?: string): Promise<ProcessedInput> {
    this.logger.debug('Procesando imagen con OCR...');

    try {
      const worker = await Tesseract.createWorker('spa+eng');
      
      const { data } = await worker.recognize(imageBuffer);
      
      await worker.terminate();

      const extractedText = data.text.trim();
      
      this.logger.debug(`OCR completado: ${extractedText.length} caracteres extraídos`);

      return {
        type: 'image',
        originalContent: imageBuffer,
        extractedText: extractedText || '[No se pudo extraer texto de la imagen]',
        metadata: {
          confidence: data.confidence,
          words: data.words?.length || 0,
          mimeType,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error en OCR: ${error.message}`);
      
      return {
        type: 'image',
        originalContent: imageBuffer,
        extractedText: '',
        error: `Error procesando imagen: ${error.message}`,
        metadata: { mimeType },
      };
    }
  }

  /**
   * Procesa documento PDF
   */
  async processPdf(pdfBuffer: Buffer): Promise<ProcessedInput> {
    this.logger.debug('Procesando PDF...');

    try {
      const data = await pdfParse(pdfBuffer);

      return {
        type: 'pdf',
        originalContent: pdfBuffer,
        extractedText: data.text.trim(),
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error procesando PDF: ${error.message}`);
      
      return {
        type: 'pdf',
        originalContent: pdfBuffer,
        extractedText: '',
        error: `Error procesando PDF: ${error.message}`,
      };
    }
  }

  /**
   * Detecta tipo de archivo y procesa automáticamente
   */
  async processFile(buffer: Buffer, filename: string, mimeType?: string): Promise<ProcessedInput> {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Detectar por extensión o MIME type
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      return this.processPdf(buffer);
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '') ||
        mimeType?.startsWith('image/')) {
      return this.processImage(buffer, mimeType);
    }
    
    if (['txt', 'md', 'json', 'csv'].includes(ext || '') ||
        mimeType?.startsWith('text/')) {
      return this.processText(buffer.toString('utf-8'));
    }

    // Formato no soportado
    return {
      type: 'text',
      originalContent: buffer,
      extractedText: '',
      error: `Formato de archivo no soportado: ${ext || mimeType}`,
    };
  }

  /**
   * Describe una imagen usando IA (fallback cuando OCR no funciona bien)
   */
  async describeImage(imageBuffer: Buffer): Promise<string> {
    // Esta función se puede extender para usar Gemini Vision
    // Por ahora, intentamos OCR
    const result = await this.processImage(imageBuffer);
    
    if (result.extractedText && result.extractedText.length > 10) {
      return `Texto detectado en la imagen: ${result.extractedText}`;
    }
    
    return 'Imagen recibida pero no se pudo extraer texto. Por favor describe qué contiene la imagen.';
  }
}
