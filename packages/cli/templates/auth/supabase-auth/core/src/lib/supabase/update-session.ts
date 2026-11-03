import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

// Rutas que exigen sesión. Es solo una comodidad (redirigir antes de renderizar):
// la autorización real se vuelve a comprobar en el servidor, ver (dashboard)/layout.tsx.
const PROTECTED_PREFIXES = ["/dashboard"];

/**
 * Refresca la sesión de Supabase en cada petición y redirige a /login si una ruta
 * protegida se visita sin sesión.
 *
 * Por qué hace falta: los tokens caducan y los Server Components no pueden escribir
 * cookies; este es el único punto que renueva el token y actualiza las cookies del
 * navegador y de la petición en curso.
 *
 * REGLAS (de la documentación oficial; romperlas cierra sesiones al azar):
 * - No ejecutes código entre createServerClient y supabase.auth.getUser().
 * - Devuelve siempre `supabaseResponse`. Si creas otra respuesta, copia sus cookies
 *   y cabeceras de caché (ver el redirect de abajo).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) supabaseResponse.cookies.set(name, value, options);
        // Cabeceras anti-caché: evitan que una CDN guarde una respuesta con la sesión de alguien.
        for (const [key, value] of Object.entries(headers)) supabaseResponse.headers.set(key, value);
      },
    },
  });

  // getUser() valida el token contra el servidor de Supabase. No lo reemplaces por getSession().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user && isProtected) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    // Conserva las cookies y cabeceras de caché que haya escrito el refresco de sesión.
    for (const cookie of supabaseResponse.cookies.getAll()) redirect.cookies.set(cookie);
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(header);
      if (value) redirect.headers.set(header, value);
    }
    return redirect;
  }

  return supabaseResponse;
}
