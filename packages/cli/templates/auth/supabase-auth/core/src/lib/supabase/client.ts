import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

/**
 * Cliente de Supabase para Client Components (navegador).
 *
 * Úsalo solo para lo que de verdad debe ocurrir en el navegador (por ejemplo,
 * suscribirte a cambios con onAuthStateChange). Los flujos de acceso de esta plantilla
 * pasan por Server Actions, así que normalmente no lo necesitarás. No lo uses para
 * autorizar: el navegador puede manipularse.
 */
export function createClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
