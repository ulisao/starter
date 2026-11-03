import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

// Destino de los enlaces de Supabase (flujo PKCE): inicio de sesión con Google, enlace
// mágico y confirmación de correo. Llegan aquí con `?code=...`, que se intercambia por
// una sesión y se guarda en cookies.
//
// Esta URL (`<APP_URL>/auth/callback`) debe estar en Authentication → URL Configuration →
// Redirect URLs del dashboard de Supabase; si no, Supabase redirige a Site URL.

/** Solo se aceptan rutas internas: evita que `?next=` se use para redirigir a otro sitio. */
function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Se redirige a NEXT_PUBLIC_APP_URL (y no al host de la petición) porque detrás de un
    // balanceador el host interno no es el público.
    if (!error) return NextResponse.redirect(new URL(next, siteConfig.url));
  }

  return NextResponse.redirect(new URL("/login?error=callback", siteConfig.url));
}
