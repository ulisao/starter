# Rate limiting

## Propósito

Limitar cuántas solicitudes puede hacer un cliente a endpoints públicos (formularios, Server Actions, Route Handlers) para frenar abuso, fuerza bruta y costos inesperados (emails, IA).

## Arquitectura

```
src/lib/rate-limit/
  types.ts     interfaz RateLimiter (lo único que usa tu código)
  upstash.ts   adaptador Upstash Redis (distribuido)  -> producción
  memory.ts    adaptador en memoria                   -> solo desarrollo y pruebas
  index.ts     createRateLimiter, getClientIp, enforceRateLimit
```

**Regla clave:** un `Map` en memoria NO es una protección válida en serverless. Cada instancia tiene su propio contador y se reinicia en cada arranque en frío, así que el límite real es inexistente. Por eso, con `NODE_ENV=production` y sin Upstash configurado, `createRateLimiter` lanza un error en la primera solicitud (no al compilar). En desarrollo usa el adaptador en memoria y avisa por consola.

Excederse del límite lanza `AppError` con estado 429 y código `rate_limited`, que `errorResponse()` (`src/lib/errors.ts`) convierte en JSON consistente.

## Configuración (Upstash)

1. Crea una cuenta en console.upstash.com y una base Redis (elige la región cercana a tu despliegue).
2. En la pestaña REST API copia la URL y el token en `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
3. Defínelas también en tu hosting. Son secretas: nunca con `NEXT_PUBLIC_`.

## Variables de entorno

| Variable | Secreta | Descripción |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Sí | URL REST de la base. |
| `UPSTASH_REDIS_REST_TOKEN` | Sí | Token REST. |

## Ejemplos

Route Handler:

```ts
// src/app/api/newsletter/route.ts
import { createRateLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/errors";

// Se crea una vez por módulo: 5 solicitudes por minuto y cliente.
const limiter = createRateLimiter({ name: "newsletter", requests: 5, window: "1 m" });

export async function POST(request: Request) {
  try {
    await enforceRateLimit(limiter, request.headers);
    // ...validar el cuerpo con Zod y ejecutar la lógica...
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
```

Server Action (por ejemplo la del formulario de contacto, `src/features/contact/actions.ts`):

```ts
import { headers } from "next/headers";
import { AppError } from "@/lib/errors";
import { createRateLimiter, enforceRateLimit } from "@/lib/rate-limit";

const limiter = createRateLimiter({ name: "contact", requests: 3, window: "10 m" });

export async function submitContact(_previous: ContactState, formData: FormData): Promise<ContactState> {
  try {
    await enforceRateLimit(limiter, await headers());
  } catch (error) {
    if (error instanceof AppError && error.status === 429) return { ok: false, message: error.message };
    throw error;
  }
  // ...resto de la acción...
}
```

Limitar por usuario autenticado en lugar de IP: `enforceRateLimit(limiter, await headers(), `user:${userId}`)`.

## Identificación del cliente

`getClientIp` lee `x-real-ip` y luego `x-forwarded-for`. Esos headers son confiables solo si los fija tu plataforma (Vercel lo hace). Detrás de tu propio proxy, configúralo para sobrescribir `x-forwarded-for`; si no, un cliente puede falsearlo. Sin IP disponible, todos comparten el identificador `unknown`.

## Alternativas

- **Upstash (incluido):** serverless, REST, sin conexiones persistentes; ideal para Vercel.
- **Redis propio:** implementa `RateLimiter` con un cliente Redis (por ejemplo `ioredis`) usando `INCR` + `EXPIRE` o un script Lua, y devuélvelo desde `createRateLimiter`. Requiere conexiones TCP: no apto para Edge.
- **Proxy o WAF:** reglas en Vercel Firewall, Cloudflare o tu balanceador, útiles como primera barrera además de este límite por aplicación.

## Errores frecuentes

- `Rate limiting: faltan UPSTASH_REDIS_REST_URL...` en producción: define las dos variables en el hosting. Es intencional.
- El límite parece no funcionar en local: el adaptador en memoria se reinicia al recargar el servidor de desarrollo.
- Todos los usuarios comparten límite: el proxy no entrega la IP real (`unknown`); revisa los headers.
