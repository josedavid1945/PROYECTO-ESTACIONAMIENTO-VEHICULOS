import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtlMs = 60000; // 1 minuto
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpieza periódica cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Obtener valor del cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    entry.hits++;
    return entry.value as T;
  }

  /**
   * Guardar valor en cache
   */
  set<T>(key: string, value: T, ttlMs: number = this.defaultTtlMs): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      hits: 0,
    });
  }

  /**
   * Obtener o calcular valor (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttlMs: number = this.defaultTtlMs
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      this.logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    this.logger.debug(`Cache miss: ${key}`);
    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Eliminar entrada del cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Eliminar entradas que coincidan con patrón
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Limpiar todo el cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.log('Cache cleared');
  }

  /**
   * Estadísticas del cache
   */
  getStats(): {
    size: number;
    entries: { key: string; hits: number; ttlRemaining: number }[];
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        hits: entry.hits,
        ttlRemaining: Math.max(0, entry.expiresAt - now),
      }))
      .sort((a, b) => b.hits - a.hits);

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Limpieza de entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
