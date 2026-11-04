"use client";

import type { ComponentProps, ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
<%#if isConvexAuth%>
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
<%#endif%>
<%#if isClerk%>
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
<%#endif%>
<%#if isBetterAuth%>
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth/auth-client";
<%#endif%>
<%#if !hasAuth%>
import { ConvexProvider } from "convex/react";
<%#endif%>

// Cliente de Convex para el navegador: habilita `useQuery`, `useMutation` y las suscripciones en
// tiempo real dentro de los Client Components. Se crea UNA sola vez por carga de página.
//
// NEXT_PUBLIC_CONVEX_URL la escribe `npx convex dev` en .env.local. Es pública (viaja al navegador)
// y Next.js la incrusta al compilar, así que debe existir también en `next build` y en Docker.
const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  throw new Error("Falta NEXT_PUBLIC_CONVEX_URL. Ejecuta `npx convex dev` o revisa .env.example y docs/DATABASE.md.");
}
const convex = new ConvexReactClient(url);
<%#if isBetterAuth%>

// El tipo `AuthClient` de @convex-dev/better-auth 0.12.x no coincide estructuralmente con el cliente que
// infiere better-auth 1.6.34 (`useSession().data` queda como `never`). El cliente es el correcto en
// ejecución; el doble cast (vía `unknown`) solo evita ese falso error de tipos. Quítalo si una versión futura lo corrige.
type AuthClientProp = ComponentProps<typeof ConvexBetterAuthProvider>["authClient"];
<%#endif%>

export function ConvexClientProvider({ children }: { children: ReactNode }) {
<%#if isConvexAuth%>
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
<%#endif%>
<%#if isClerk%>
  // Convex recibe el token de sesión de Clerk y lo usa en cada función (ctx.auth).
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
<%#endif%>
<%#if isBetterAuth%>
  // Convex recibe el token de la sesión de Better Auth y lo usa en cada función (ctx.auth).
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient as unknown as AuthClientProp}>
      {children}
    </ConvexBetterAuthProvider>
  );
<%#endif%>
<%#if !hasAuth%>
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
<%#endif%>
}
