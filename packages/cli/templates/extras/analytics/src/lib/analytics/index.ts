import { consoleProvider } from "./console";
import type { AnalyticsProvider } from "./types";

export type { AnalyticsProperties, AnalyticsProvider } from "./types";

/**
 * PUNTO DE ENCHUFE: aquí se elige el proveedor de analytics de toda la aplicación.
 *
 * Por defecto es `consoleProvider` (solo imprime en desarrollo). Para usar uno real,
 * implementa `AnalyticsProvider` en un archivo nuevo (por ejemplo ./posthog.ts) y
 * asígnalo aquí. Ejemplos para PostHog, Plausible o Google Analytics en
 * docs/extras/analytics.md. Respeta el consentimiento de cookies que exija tu región.
 */
export const analytics: AnalyticsProvider = consoleProvider;
