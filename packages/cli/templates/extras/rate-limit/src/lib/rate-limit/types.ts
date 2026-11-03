/**
 * Contrato de un limitador de solicitudes.
 *
 * El código de la aplicación depende solo de esta interfaz. Hay dos adaptadores:
 * Upstash Redis (distribuido, el único válido en producción) y memoria (solo
 * desarrollo y pruebas). Para usar otro almacenamiento (Redis propio, base de
 * datos...) implementa `RateLimiter` y devuélvelo desde `./index.ts`.
 */
export type RateLimitWindow = `${number} ${"s" | "m" | "h" | "d"}`;

export type RateLimitConfig = {
  /** Nombre del límite (por ejemplo "contact"). Separa los contadores de cada uso. */
  name: string;
  /** Solicitudes permitidas por ventana. */
  requests: number;
  /** Duración de la ventana, por ejemplo "1 m" o "10 s". */
  window: RateLimitWindow;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Momento (ms desde epoch) en que se reinicia la ventana. */
  resetAt: number;
};

export interface RateLimiter {
  /** Registra una solicitud del identificador (IP, id de usuario...) y dice si se permite. */
  limit(identifier: string): Promise<RateLimitResult>;
}
