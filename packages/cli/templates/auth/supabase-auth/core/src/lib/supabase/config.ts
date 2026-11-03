/**
 * Lee la URL y la clave publishable de Supabase.
 *
 * Ambas son públicas (llegan al navegador), por eso viven en NEXT_PUBLIC_* y este
 * archivo NO es "server-only": lo usan el cliente del navegador, el del servidor y el
 * proxy. Cada variable se referencia de forma estática (process.env.NEXT_PUBLIC_X)
 * porque Next.js solo reemplaza ese formato literal en el código del navegador.
 *
 * Se evalúa al usarla, no al importar, para que `next build` no exija credenciales.
 *
 * IMPORTANTE: aquí va la clave *publishable* (sb_publishable_...). La clave
 * secret/service_role salta las políticas RLS y jamás debe usarse con este patrón
 * ni llevar el prefijo NEXT_PUBLIC_.
 */
export function getSupabaseConfig(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Revisa .env.example y docs/AUTHENTICATION.md.",
    );
  }
  return { url, publishableKey };
}
