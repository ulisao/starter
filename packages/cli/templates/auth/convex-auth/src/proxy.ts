import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Proxy de Next.js 16 (antes "middleware"). Hace dos cosas:
//   1. Mantiene la sesión: renueva los tokens en cookies y atiende /api/auth, el canal por el que el
//      navegador habla con Convex Auth. Debe correr en todas las rutas de la aplicación.
//   2. Redirige: sin sesión no se entra a rutas protegidas, y con sesión no se vuelve a /login.
//
// Esto es una comodidad, NO la seguridad real: la autorización definitiva se comprueba en cada
// página/acción del servidor (getSessionUserId) y dentro de las funciones de Convex.
//
// Para proteger más rutas, agrégalas a `isProtectedRoute`.
const isLoginPage = createRouteMatcher(["/login"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authenticated = await convexAuth.isAuthenticated();
  if (isLoginPage(request) && authenticated) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }
  if (isProtectedRoute(request) && !authenticated) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  // Todas las rutas excepto archivos estáticos y _next.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
