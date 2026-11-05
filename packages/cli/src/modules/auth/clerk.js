// Módulo de autenticación: Clerk (@clerk/nextjs 7.x, App Router).
// Los 5 métodos de acceso (contraseña, contraseña + Google, Google, magic link, OTP) se
// activan en el Dashboard de Clerk, no en el código: por eso las plantillas son casi
// idénticas y solo cambian los textos y la documentación según `cfg.authMethod`.
// La integración con Convex vive en clerk-convex.js.

export default {
  id: 'auth-clerk',
  when: (cfg) => cfg.auth === 'clerk',
  templates: 'auth/clerk',
  // Reemplaza el header base para mostrar el botón de acceso / UserButton.
  overrides: ['src/components/layout/site-header.tsx'],
  dependencies: ['@clerk/nextjs'],
  providers: [
    {
      importLine: 'import { ClerkAuthProvider } from "@/components/auth/clerk-auth-provider";',
      open: '<ClerkAuthProvider>',
      close: '</ClerkAuthProvider>',
      order: 10,
    },
  ],
  env: [
    {
      key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      description: 'Clave pública (publishable key) de tu aplicación en Clerk.',
      secret: false,
      example: 'pk_test_...',
      where: 'Clerk Dashboard → tu aplicación → API keys.',
    },
    {
      key: 'CLERK_SECRET_KEY',
      description: 'Clave secreta de Clerk, usada por el servidor para verificar sesiones.',
      secret: true,
      example: 'sk_test_...',
      where: 'Clerk Dashboard → tu aplicación → API keys.',
    },
    {
      key: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
      description: 'Ruta de tu página de inicio de sesión.',
      secret: false,
      example: '/sign-in',
      where: 'Déjala en /sign-in salvo que muevas la página.',
    },
    {
      key: 'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
      description: 'Ruta de tu página de registro.',
      secret: false,
      example: '/sign-up',
      where: 'Déjala en /sign-up salvo que muevas la página.',
    },
    {
      key: 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL',
      description: 'Destino tras iniciar sesión cuando no hay una redirección previa.',
      secret: false,
      example: '/dashboard',
      where: 'Cualquier ruta de tu aplicación.',
    },
    {
      key: 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL',
      description: 'Destino tras registrarse cuando no hay una redirección previa.',
      secret: false,
      example: '/dashboard',
      where: 'Cualquier ruta de tu aplicación.',
    },
  ],
  stack: ['Clerk (autenticación, `@clerk/nextjs`) con `proxy.ts` y componentes oficiales'],
  notes: [
    'Clerk: `src/proxy.ts` protege `/dashboard`; la autorización fina se verifica en el servidor (ver `src/app/(dashboard)/dashboard/page.tsx`). Los métodos de acceso se activan en el Dashboard de Clerk: ver `docs/AUTHENTICATION.md`.',
    'Clerk: usa `getSessionUserId()` de `src/lib/auth/session.ts` para obtener el usuario en el servidor; no leas la sesión del cliente para decidir permisos.',
  ],
};
