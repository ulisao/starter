import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Proxy de Next.js 16 (antes "middleware"). Se ejecuta antes de renderizar las rutas del matcher.
//
// IMPORTANTE: esto es un chequeo OPTIMISTA. Solo comprueba que exista la cookie de sesión,
// no que sea válida, así que NO es una barrera de seguridad: sirve para redirigir rápido a
// quien claramente no inició sesión. La autorización real se hace en el servidor, cerca de los
// datos: src/app/(dashboard)/layout.tsx y `requireUserId()` en src/lib/auth/session.ts.
//
// Para proteger más rutas, agrégalas al matcher (y mantenlas fuera de /api/auth).
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
