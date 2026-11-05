"use client";

import type { ComponentProps, ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";

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

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Convex recibe el token de sesión de Clerk y lo usa en cada función (ctx.auth).
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
