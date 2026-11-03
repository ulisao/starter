import "server-only";
import { AppError } from "@/lib/errors";
import { createMemoryRateLimiter } from "./memory";
import { createUpstashRateLimiter } from "./upstash";
import type { RateLimitConfig, RateLimiter } from "./types";

export type { RateLimitConfig, RateLimitResult, RateLimiter } from "./types";

function hasUpstash(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Crea un limitador y elige el adaptador en la primera solicitud (no al importar,
 * para que `next build` no exija credenciales):
 *
 * - Con variables de Upstash: adaptador distribuido (Redis).
 * - Sin ellas y en producción: lanza un error. Un limitador en memoria no
 *   protege en serverless, y fallar en voz alta es mejor que creerse protegido.
 * - Sin ellas en desarrollo/pruebas: adaptador en memoria con un aviso.
 *
 * Para otro almacenamiento (Redis propio, base de datos), implementa `RateLimiter`
 * y devuélvelo aquí. Ver docs/extras/rate-limit.md.
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  let instance: RateLimiter | undefined;

  function resolve(): RateLimiter {
    if (hasUpstash()) return createUpstashRateLimiter(config);
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Rate limiting: faltan UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN. " +
          "El adaptador en memoria no está permitido en producción (ver docs/extras/rate-limit.md).",
      );
    }
    console.warn(
      `[rate-limit] "${config.name}" usa el adaptador en memoria (solo desarrollo). Configura Upstash para producción.`,
    );
    return createMemoryRateLimiter(config);
  }

  return {
    limit(identifier) {
      instance ??= resolve();
      return instance.limit(identifier);
    },
  };
}

/**
 * Identifica al cliente por IP a partir de los headers de la solicitud.
 *
 * Los headers los controla quien hace la solicitud, salvo los que reescribe tu
 * proxy. En Vercel `x-real-ip` y `x-forwarded-for` los fija la plataforma. Si
 * despliegas detrás de tu propio proxy o balanceador, configúralo para que
 * sobrescriba `x-forwarded-for` (no que lo concatene); de lo contrario un cliente
 * puede falsear su IP y esquivar el límite. Si no hay IP, todos comparten el
 * identificador "unknown" (falla hacia más restricción, no hacia menos).
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

/**
 * Aplica el límite al cliente de la solicitud. Si lo excede lanza `AppError` 429,
 * que `errorResponse()` convierte en una respuesta JSON consistente; en una
 * Server Action captura el error y devuelve tu estado de formulario.
 *
 * `scope` permite limitar por algo más que la IP (por ejemplo `user:${id}`).
 */
export async function enforceRateLimit(limiter: RateLimiter, headers: Headers, scope?: string): Promise<void> {
  const result = await limiter.limit(scope ?? getClientIp(headers));
  if (result.success) return;
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  throw new AppError(`Demasiadas solicitudes. Intenta de nuevo en ${retryAfter} segundos.`, 429, "rate_limited");
}
