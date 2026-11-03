# Analytics

## Propósito

Medir el uso del producto con una interfaz propia (`track`, `identify`, `page`) desacoplada de cualquier proveedor. No se instala ningún proveedor: elige el que cumpla tus necesidades y tu normativa de privacidad.

## Arquitectura

```
src/lib/analytics/
  types.ts    interfaz AnalyticsProvider
  console.ts  proveedor de desarrollo (imprime en consola, no envía nada)
  index.ts    exporta `analytics`; aquí se enchufa el proveedor elegido
```

Usa `analytics` en cualquier parte (no depende de `server-only`):

```ts
import { analytics } from "@/lib/analytics";

analytics.track("signup_completed", { method: "google" });
analytics.identify(userId, { plan: "pro" });
analytics.page("pricing");
```

## Incorporar un proveedor real

1. Instala el SDK del proveedor con tu gestor de paquetes (consulta su documentación vigente y fija la versión; no uses `latest`).
2. Crea `src/lib/analytics/<proveedor>.ts` que exporte un `AnalyticsProvider` y traduzca los tres métodos al SDK.
3. En `src/lib/analytics/index.ts` reemplaza `consoleProvider` por el nuevo.

Esquema orientativo (las llamadas exactas dependen del proveedor):

| Proveedor | `track` | `identify` | `page` |
| --- | --- | --- | --- |
| PostHog | `posthog.capture(event, props)` | `posthog.identify(id, traits)` | `posthog.capture("$pageview")` |
| Plausible | `plausible(event, { props })` | no aplica (sin usuarios) | automático con su script |
| Google Analytics | `gtag("event", event, props)` | `gtag("set", { user_id })` | `gtag("event", "page_view")` |

Los SDK de navegador necesitan inicializarse en un Client Component (por ejemplo montado en `src/components/providers.tsx`) y sus claves públicas van en variables `NEXT_PUBLIC_*` (son públicas por diseño; las claves privadas nunca).

## Registrar vistas de página

El App Router no emite un evento por navegación. Crea un Client Component pequeño que llame a `analytics.page()` dentro de un `useEffect` con `usePathname()` y móntalo en `providers.tsx`.

## Privacidad

- Revisa si tu región exige consentimiento (GDPR, ePrivacy) antes de cargar scripts o cookies de analytics.
- No envíes datos personales sensibles en las propiedades ni en `identify`.

## Errores frecuentes

- No se ven eventos en producción: `consoleProvider` no hace nada con `NODE_ENV=production`; enchufa un proveedor real.
- Un SDK de navegador falla en el servidor: inicialízalo solo en Client Components.
