import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface McpTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
  handler: (params: Record<string, any>) => Promise<any>;
  timeout?: number;
}

export interface McpToolResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

/**
 * McpToolsService - Registro y ejecución de herramientas MCP
 */
@Injectable()
export class McpToolsService {
  private readonly logger = new Logger(McpToolsService.name);
  private tools = new Map<string, McpTool>();
  private cache = new Map<string, { data: any; expiry: number }>();

  constructor(private configService: ConfigService) {}

  /**
   * Registra una herramienta MCP
   */
  registerTool(tool: McpTool): void {
    this.tools.set(tool.name, tool);
    this.logger.log(`Herramienta MCP registrada: ${tool.name}`);
  }

  /**
   * Obtiene todas las herramientas disponibles (para el LLM)
   */
  getToolsDefinition(): Array<{
    name: string;
    description: string;
    parameters: McpTool['parameters'];
  }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  /**
   * Ejecuta una herramienta por nombre
   */
  async executeTool(name: string, params: Record<string, any>): Promise<McpToolResult> {
    const tool = this.tools.get(name);
    
    if (!tool) {
      return {
        success: false,
        error: `Herramienta "${name}" no encontrada`,
        duration: 0,
      };
    }

    const startTime = Date.now();
    const timeout = tool.timeout || 30000;

    try {
      // Validar parámetros requeridos
      for (const required of tool.parameters.required) {
        if (params[required] === undefined) {
          return {
            success: false,
            error: `Parámetro requerido faltante: ${required}`,
            duration: Date.now() - startTime,
          };
        }
      }

      // Ejecutar con timeout
      const result = await Promise.race([
        tool.handler(params),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);

      this.logger.debug(`Herramienta ${name} ejecutada en ${Date.now() - startTime}ms`);

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      this.logger.error(`Error ejecutando ${name}: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Cache helper
   */
  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  clearCache(): void {
    this.cache.clear();
  }
}
