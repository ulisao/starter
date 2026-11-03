import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { requireEnv } from "@/lib/env";
import type { RateLimitConfig, RateLimiter } from "./types";

/**
 * Adaptador de Upstash Redis (REST). Es distribuido: todas las instancias
 * serverless comparten los mismos contadores, por eso es el adaptador para
 * producción. Usa una ventana deslizante.
 *
 * Las credenciales se leen al crear el limitador (en la primera solicitud),
 * no al importar el módulo.
 */
export function createUpstashRateLimiter(config: RateLimitConfig): RateLimiter {
  const ratelimit = new Ratelimit({
    redis: new Redis({
      url: requireEnv("UPSTASH_REDIS_REST_URL"),
      token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
    }),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix: `ratelimit:${config.name}`,
  });

  return {
    async limit(identifier) {
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    },
  };
}
