/**
 * Contrato de un proveedor de analytics.
 *
 * La aplicación llama siempre a `analytics` (ver ./index.ts) y nunca al SDK de un
 * proveedor concreto. Así cambiar de PostHog a Plausible, GA u otro es reemplazar
 * una implementación, no tocar cada llamada.
 */
export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsProvider {
  /** Registra un evento de producto, por ejemplo `track("plan_selected", { plan: "pro" })`. */
  track(event: string, properties?: AnalyticsProperties): void;
  /** Asocia las siguientes acciones a un usuario. Envía solo datos que puedas tratar legalmente. */
  identify(userId: string, traits?: AnalyticsProperties): void;
  /** Registra una vista de página. */
  page(name?: string, properties?: AnalyticsProperties): void;
}
