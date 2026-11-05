import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

// Envuelve a ClerkProvider y, si todavía no configuraste las claves de Clerk, muestra una
// pantalla de ayuda en vez del error críptico "Publishable key not valid".
// Cuando pongas claves reales en .env.local (pk_test_... / sk_test_...) todo funciona normal.
const CLAVE_VALIDA = /^pk_(test|live)_[A-Za-z0-9+/=_-]{8,}$/;

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const clave = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (!CLAVE_VALIDA.test(clave)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Falta configurar Clerk</h1>
        <p className="mt-4">
          Este proyecto usa Clerk para la autenticación, pero{" "}
          <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> no está definida o no tiene un formato
          válido (<code>pk_test_...</code> o <code>pk_live_...</code>).
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-6">
          <li>
            Crea una aplicación en <code>https://dashboard.clerk.com</code> o ejecuta{" "}
            <code>npx clerk@latest init</code> (no requiere cuenta y escribe claves temporales).
          </li>
          <li>
            Copia <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> y <code>CLERK_SECRET_KEY</code> a{" "}
            <code>.env.local</code> (guía en <code>.env.example</code>).
          </li>
          <li>Reinicia <code>npm run dev</code>.</li>
        </ol>
        <p className="mt-4 text-sm opacity-70">
          Más detalles en <code>docs/AUTHENTICATION.md</code>.
        </p>
      </main>
    );
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}
