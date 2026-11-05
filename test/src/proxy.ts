import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next.js 16 usa `proxy.ts` (antes `middleware.ts`). Este archivo se ejecuta antes de
// cada petición que coincide con `config.matcher` y deja a Clerk leer la sesión.
//
// Rutas que exigen sesión. Agrega aquí los prefijos privados de tu aplicación
// (ejemplo: "/account(.*)"). Si cambias el grupo (dashboard), actualiza esta lista.
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Sin sesión, redirige a la página de acceso. Es una primera barrera: la autorización
  // real (roles, propiedad de los datos) se vuelve a comprobar en el servidor.
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Omite archivos internos de Next.js y estáticos, salvo que aparezcan en la query.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre ejecuta para rutas de API.
    "/(api|trpc)(.*)",
  ],
};
