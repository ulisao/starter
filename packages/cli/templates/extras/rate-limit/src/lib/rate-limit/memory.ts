import type { RateLimitConfig, RateLimiter } from "./types";

const UNIT_MS = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

function windowToMs(window: RateLimitConfig["window"]): number {
  const [amount, unit] = window.split(" ") as [string, keyof typeof UNIT_MS];
  return Number(amount) * UNIT_MS[unit];
}

/**
 * Adaptador en memoria (ventana fija). SOLO para desarrollo local y pruebas.
 *
 * NO protege en producción: en serverless cada instancia tiene su propio Map
 * (el contador se reinicia en cada arranque en frío y no se comparte entre
 * instancias), así que un atacante lo esquiva fácilmente. `./index.ts` impide
 * usarlo cuando NODE_ENV es "production".
 */
export function createMemoryRateLimiter(config: RateLimitConfig): RateLimiter {
  const windowMs = windowToMs(config.window);
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    async limit(identifier) {
      const now = Date.now();
      let entry = hits.get(identifier);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(identifier, entry);
      }
      entry.count += 1;
      return {
        success: entry.count <= config.requests,
        limit: config.requests,
        remaining: Math.max(0, config.requests - entry.count),
        resetAt: entry.resetAt,
      };
    },
  };
}
