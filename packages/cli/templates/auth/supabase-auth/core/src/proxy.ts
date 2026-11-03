import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/update-session";

// Next.js 16 renombró `middleware.ts` a `proxy.ts`. Se ejecuta antes de cada petición
// que coincida con `config.matcher`. Aquí solo refresca la sesión de Supabase y protege
// rutas (ver src/lib/supabase/update-session.ts). No pongas lógica de negocio aquí.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Todas las rutas salvo archivos estáticos y optimización de imágenes.
  // Si añades otro tipo de archivo público (por ejemplo .pdf), añádelo a la lista.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)"],
};
