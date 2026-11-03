import type { Metadata } from "next";
import { SignInForm } from "@/features/auth";

export const metadata: Metadata = { title: "Iniciar sesión" };

// Página pública de acceso. El proxy (src/proxy.ts) redirige a /dashboard si ya hay sesión.
export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
      <SignInForm />
    </section>
  );
}
