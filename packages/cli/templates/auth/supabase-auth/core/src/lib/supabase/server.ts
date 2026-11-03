import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

/**
 * Cliente de Supabase para código de servidor (Server Components, Server Actions y
 * Route Handlers). Crea uno NUEVO por petición: no lo guardes en una variable global,
 * porque la sesión del usuario viaja en las cookies de cada petición.
 *
 * La sesión se guarda en cookies (no en localStorage) para que el servidor pueda leerla.
 */
export async function createClient() {
  // Se lee primero `cookies()` para que Next.js trate esta función como dinámica
  // antes de exigir las variables de entorno (así `next build` no las necesita).
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Un Server Component no puede escribir cookies. Es esperado e inofensivo:
          // src/proxy.ts refresca la sesión y escribe las cookies en cada petición.
        }
      },
    },
  });
}
