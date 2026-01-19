import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as Tesseract from 'tesseract.js';
// @ts-ignore
import pdfParse from 'pdf-parse';

export interface ProcessedInput {
  type: 'text' | 'image' | 'pdf' | 'audio';
  originalContent: Buffer | string;
  extractedText: string;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Entidades de dominio extraídas de documentos
 */
export interface ExtractedTicketData {
  ticketId?: string;
  placa?: string;
  fechaEntrada?: string;
  fechaSalida?: string;
  duracion?: string;
  monto?: number;
  espacio?: string;
  tipoVehiculo?: string;
}

export interface ExtractedVehicleData {
  placa: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipoVehiculo?: string;
  confidence: number;
}

export interface ExtractedInvoiceData {
  numeroFactura?: string;
  fecha?: string;
  cliente?: string;
  nit?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  concepto?: string;
  items?: Array<{ descripcion: string; cantidad: number; precio: number }>;
}

export interface ExtractedFineData {
  placaVehiculo?: string;
  tipoInfraccion?: string;
  monto?: number;
  fechaEmision?: string;
  ubicacion?: string;
  descripcion?: string;
}

export interface StructuredExtraction {
  type: 'ticket' | 'vehicle' | 'invoice' | 'fine' | 'unknown';
  data: ExtractedTicketData | ExtractedVehicleData | ExtractedInvoiceData | ExtractedFineData | null;
  confidence: number;
  rawText: string;
}

/**
 * MultimodalProcessor - Procesa diferentes tipos de entrada con IA
 * Incluye OCR, extracción de PDFs, y análisis de imágenes con Gemini Vision
 */
@Injectable()
export class MultimodalProcessorService {
  private readonly logger = new Logger(MultimodalProcessorService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini Vision inicializado para análisis multimodal');
    }
  }

  /**
   * Procesa texto plano con detección de entidades de negocio
   */
  async processText(text: string): Promise<ProcessedInput> {
    // Limpiar y normalizar texto
    const cleaned = text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\S\r\n]+/g, ' ');

    // Detectar idioma básico
    const isSpanish = /[áéíóúñ¿¡]/i.test(text);

    // Detectar entidades de negocio en el texto
    const entities = this.detectBusinessEntities(cleaned);

    return {
      type: 'text',
      originalContent: text,
      extractedText: cleaned,
      metadata: {
        originalLength: text.length,
        cleanedLength: cleaned.length,
        detectedLanguage: isSpanish ? 'es' : 'en',
        detectedEntities: entities,
      },
    };
  }

  /**
   * Detecta entidades de negocio en texto
   */
  private detectBusinessEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Detectar placas vehiculares (formato boliviano: ABC-1234 o ABC1234)
    const placaMatch = text.match(/\b([A-Z]{2,3}[-\s]?\d{3,4})\b/i);
    if (placaMatch) {
      entities.placa = placaMatch[1].toUpperCase().replace(/\s/g, '-');
    }

    // Detectar montos en bolivianos
    const montoMatch = text.match(/(?:Bs\.?|BOB)\s*([\d,]+(?:\.\d{2})?)/i);
    if (montoMatch) {
      entities.monto = parseFloat(montoMatch[1].replace(',', ''));
    }

    // Detectar IDs de ticket
    const ticketMatch = text.match(/(?:ticket|boleto|comprobante)\s*#?\s*(\d+)/i);
    if (ticketMatch) {
      entities.ticketId = ticketMatch[1];
    }

    // Detectar fechas
    const fechaMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (fechaMatch) {
      entities.fecha = fechaMatch[1];
    }

    // Detectar horas
    const horaMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)/);
    if (horaMatch) {
      entities.hora = horaMatch[1];
    }

    // Detectar espacios de estacionamiento
    const espacioMatch = text.match(/(?:espacio|lugar|plaza)\s*#?\s*([A-Z]?\d+)/i);
    if (espacioMatch) {
      entities.espacio = espacioMatch[1].toUpperCase();
    }

    return entities;
  }

  /**
   * Procesa imagen con OCR (Tesseract.js) + análisis con Gemini Vision
   */
  async processImage(imageBuffer: Buffer, mimeType?: string): Promise<ProcessedInput> {
    this.logger.debug('Procesando imagen con OCR...');

    try {
      // Primero intentar OCR con Tesseract
      const worker = await Tesseract.createWorker('spa+eng');
      const { data } = await worker.recognize(imageBuffer);
      await worker.terminate();

      let extractedText = data.text.trim();
      let visionAnalysis: string | null = null;

      // Si hay poca confianza en OCR o poco texto, usar Gemini Vision
      if ((data.confidence < 70 || extractedText.length < 20) && this.genAI) {
        visionAnalysis = await this.analyzeImageWithVision(imageBuffer, mimeType);
      }
      
      // Combinar resultados
      const finalText = visionAnalysis 
        ? `[OCR]: ${extractedText}\n[Análisis Visual]: ${visionAnalysis}`
        : extractedText;

      const entities = this.detectBusinessEntities(finalText);
      
      this.logger.debug(`Procesamiento completado: ${finalText.length} caracteres`);

      return {
        type: 'image',
        originalContent: imageBuffer,
        extractedText: finalText || '[No se pudo extraer texto de la imagen]',
        metadata: {
          ocrConfidence: data.confidence,
          words: data.words?.length || 0,
          mimeType,
          usedVision: !!visionAnalysis,
          detectedEntities: entities,
        },
      };
    } catch (error: any) {
      this.logger.error(`Error en procesamiento de imagen: ${error.message}`);
      
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
   * Analiza imagen con Gemini Vision para obtener descripción detallada
   */
  private async analyzeImageWithVision(imageBuffer: Buffer, mimeType?: string): Promise<string | null> {
    if (!this.genAI) return null;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const prompt = `Analiza esta imagen en el contexto de un estacionamiento vehicular. 
Extrae y describe:
- Si hay una placa vehicular visible, indica el número exacto
- Si es un ticket o recibo, extrae los datos (fecha, hora, monto, número)
- Si es un vehículo, describe marca, modelo, color si es identificable
- Si hay daños visibles en el vehículo, descríbelos
- Cualquier texto relevante visible

Responde en español de forma estructurada y concisa.`;

      const result = await model.generateContent([prompt, imagePart]);
      return result.response.text();
    } catch (error: any) {
      this.logger.warn(`Error en Gemini Vision: ${error.message}`);
      return null;
    }
  }

  /**
   * Extrae específicamente placa de vehículo de imagen
   */
  async extractLicensePlate(imageBuffer: Buffer, mimeType?: string): Promise<ExtractedVehicleData | null> {
    if (!this.genAI) {
      // Fallback a OCR simple
      const result = await this.processImage(imageBuffer, mimeType);
      const placa = result.metadata?.detectedEntities?.placa;
      if (placa) {
        return { placa, confidence: result.metadata?.ocrConfidence || 50 };
      }
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const prompt = `Analiza esta imagen y extrae SOLO la información de la placa vehicular.
Responde en formato JSON exactamente así (sin markdown):
{
  "placa": "ABC-1234",
  "marca": "Toyota",
  "modelo": "Corolla",
  "color": "Blanco",
  "tipoVehiculo": "automovil",
  "confidence": 95
}

Si no hay placa visible o no es legible, responde:
{"placa": null, "confidence": 0}

Tipos de vehículo válidos: automovil, motocicleta, camioneta, camion, bicicleta`;

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();
      
      // Limpiar respuesta JSON
      const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);

      if (data.placa) {
        return {
          placa: data.placa,
          marca: data.marca,
          modelo: data.modelo,
          color: data.color,
          tipoVehiculo: data.tipoVehiculo,
          confidence: data.confidence,
        };
      }
      return null;
    } catch (error: any) {
      this.logger.error(`Error extrayendo placa: ${error.message}`);
      return null;
    }
  }

  /**
   * Procesa documento PDF con extracción estructurada
   */
  async processPdf(pdfBuffer: Buffer): Promise<ProcessedInput> {
    this.logger.debug('Procesando PDF...');

    try {
      const data = await pdfParse(pdfBuffer);
      const extractedText = data.text.trim();
      
      // Detectar entidades en el texto del PDF
      const entities = this.detectBusinessEntities(extractedText);
      
      // Detectar tipo de documento
      const documentType = this.detectPdfDocumentType(extractedText);

      return {
        type: 'pdf',
        originalContent: pdfBuffer,
        extractedText: extractedText,
        metadata: {
          pages: data.numpages,
          info: data.info,
          version: data.version,
          documentType,
          detectedEntities: entities,
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
   * Detecta el tipo de documento PDF
   */
  private detectPdfDocumentType(text: string): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('factura') || textLower.includes('invoice')) {
      return 'factura';
    }
    if (textLower.includes('contrato') || textLower.includes('alquiler')) {
      return 'contrato';
    }
    if (textLower.includes('ticket') || textLower.includes('comprobante')) {
      return 'ticket';
    }
    if (textLower.includes('multa') || textLower.includes('infracción')) {
      return 'multa';
    }
    if (textLower.includes('reporte') || textLower.includes('informe')) {
      return 'reporte';
    }
    
    return 'documento_general';
  }

  /**
   * Extrae datos estructurados de un documento (ticket, factura, multa)
   */
  async extractStructuredData(input: ProcessedInput): Promise<StructuredExtraction> {
    const text = input.extractedText;
    const textLower = text.toLowerCase();

    // Determinar tipo de documento
    let docType: 'ticket' | 'vehicle' | 'invoice' | 'fine' | 'unknown' = 'unknown';
    
    if (textLower.includes('ticket') || textLower.includes('estacionamiento') || textLower.includes('entrada')) {
      docType = 'ticket';
    } else if (textLower.includes('factura') || textLower.includes('nit') || textLower.includes('subtotal')) {
      docType = 'invoice';
    } else if (textLower.includes('multa') || textLower.includes('infracción') || textLower.includes('sanción')) {
      docType = 'fine';
    } else if (input.metadata?.detectedEntities?.placa) {
      docType = 'vehicle';
    }

    // Extraer datos según el tipo
    let data: any = null;
    let confidence = 0;

    switch (docType) {
      case 'ticket':
        data = this.extractTicketData(text);
        confidence = data ? 80 : 30;
        break;
      case 'invoice':
        data = this.extractInvoiceData(text);
        confidence = data ? 85 : 30;
        break;
      case 'fine':
        data = this.extractFineData(text);
        confidence = data ? 75 : 30;
        break;
      case 'vehicle':
        data = { placa: input.metadata?.detectedEntities?.placa };
        confidence = 70;
        break;
    }

    return {
      type: docType,
      data,
      confidence,
      rawText: text,
    };
  }

  /**
   * Extrae datos de un ticket de estacionamiento
   */
  private extractTicketData(text: string): ExtractedTicketData | null {
    const entities = this.detectBusinessEntities(text);
    
    return {
      ticketId: entities.ticketId,
      placa: entities.placa,
      fechaEntrada: entities.fecha,
      espacio: entities.espacio,
      monto: entities.monto,
    };
  }

  /**
   * Extrae datos de una factura
   */
  private extractInvoiceData(text: string): ExtractedInvoiceData | null {
    const data: ExtractedInvoiceData = {};
    
    // Número de factura
    const facturaMatch = text.match(/(?:factura|invoice)\s*#?\s*(\d+)/i);
    if (facturaMatch) data.numeroFactura = facturaMatch[1];

    // NIT
    const nitMatch = text.match(/NIT[:\s]*(\d+)/i);
    if (nitMatch) data.nit = nitMatch[1];

    // Montos
    const subtotalMatch = text.match(/subtotal[:\s]*(?:Bs\.?)?\s*([\d,.]+)/i);
    if (subtotalMatch) data.subtotal = parseFloat(subtotalMatch[1].replace(',', ''));

    const ivaMatch = text.match(/IVA[:\s]*(?:Bs\.?)?\s*([\d,.]+)/i);
    if (ivaMatch) data.iva = parseFloat(ivaMatch[1].replace(',', ''));

    const totalMatch = text.match(/total[:\s]*(?:Bs\.?)?\s*([\d,.]+)/i);
    if (totalMatch) data.total = parseFloat(totalMatch[1].replace(',', ''));

    return data;
  }

  /**
   * Extrae datos de una multa
   */
  private extractFineData(text: string): ExtractedFineData | null {
    const entities = this.detectBusinessEntities(text);
    
    return {
      placaVehiculo: entities.placa,
      monto: entities.monto,
      fechaEmision: entities.fecha,
    };
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

    // Para audio, crear placeholder (requeriría integración con speech-to-text)
    if (['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(ext || '') ||
        mimeType?.startsWith('audio/')) {
      return this.processAudio(buffer, mimeType);
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
   * Procesa audio (placeholder - requiere integración con speech-to-text)
   */
  async processAudio(audioBuffer: Buffer, mimeType?: string): Promise<ProcessedInput> {
    this.logger.debug('Procesando audio...');

    // TODO: Integrar con Google Speech-to-Text o similar
    // Por ahora, notificar que el audio fue recibido
    return {
      type: 'audio',
      originalContent: audioBuffer,
      extractedText: '[Audio recibido - transcripción pendiente de implementar]',
      metadata: {
        mimeType,
        sizeBytes: audioBuffer.length,
        note: 'La transcripción de audio estará disponible próximamente',
      },
    };
  }

  /**
   * Describe una imagen usando Gemini Vision
   */
  async describeImage(imageBuffer: Buffer, mimeType?: string): Promise<string> {
    if (this.genAI) {
      const analysis = await this.analyzeImageWithVision(imageBuffer, mimeType);
      if (analysis) return analysis;
    }

    // Fallback a OCR
    const result = await this.processImage(imageBuffer, mimeType);
    
    if (result.extractedText && result.extractedText.length > 10) {
      return `Texto detectado en la imagen: ${result.extractedText}`;
    }
    
    return 'Imagen recibida pero no se pudo extraer información. Por favor describe qué contiene la imagen.';
  }

  /**
   * Procesa múltiples archivos y consolida resultados
   */
  async processMultipleFiles(
    files: Array<{ buffer: Buffer; filename: string; mimeType?: string }>
  ): Promise<{
    results: ProcessedInput[];
    consolidatedText: string;
    allEntities: Record<string, any>;
  }> {
    const results: ProcessedInput[] = [];
    const allEntities: Record<string, any> = {};
    const textParts: string[] = [];

    for (const file of files) {
      const result = await this.processFile(file.buffer, file.filename, file.mimeType);
      results.push(result);
      
      if (result.extractedText) {
        textParts.push(`[${file.filename}]:\n${result.extractedText}`);
      }

      // Consolidar entidades
      if (result.metadata?.detectedEntities) {
        Object.assign(allEntities, result.metadata.detectedEntities);
      }
    }

    return {
      results,
      consolidatedText: textParts.join('\n\n'),
      allEntities,
    };
  }

  /**
   * Analiza imagen de ticket y extrae datos estructurados
   */
  async processTicketImage(imageBuffer: Buffer, mimeType?: string): Promise<ExtractedTicketData | null> {
    if (!this.genAI) {
      const result = await this.processImage(imageBuffer, mimeType);
      const structured = await this.extractStructuredData(result);
      return structured.type === 'ticket' ? structured.data as ExtractedTicketData : null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg',
        },
      };

      const prompt = `Analiza esta imagen de un ticket de estacionamiento y extrae los datos.
Responde SOLO con JSON válido (sin markdown):
{
  "ticketId": "número o código del ticket",
  "placa": "placa del vehículo",
  "fechaEntrada": "fecha y hora de entrada",
  "fechaSalida": "fecha y hora de salida (si aplica)",
  "duracion": "tiempo de estancia",
  "monto": 25.50,
  "espacio": "número de espacio",
  "tipoVehiculo": "automovil/motocicleta/camioneta"
}

Usa null para campos no visibles. Monto como número, no string.`;

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();
      const jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(jsonStr);
    } catch (error: any) {
      this.logger.error(`Error procesando ticket: ${error.message}`);
      return null;
    }
  }

  /**
   * Verifica si el servicio de vision está disponible
   */
  isVisionAvailable(): boolean {
    return this.genAI !== null;
  }
}
