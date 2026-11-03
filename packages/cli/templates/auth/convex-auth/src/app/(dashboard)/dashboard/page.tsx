import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/features/auth";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Panel" };

// Ruta protegida (grupo (dashboard), URL /dashboard). Doble protección:
//   1. src/proxy.ts redirige a /login sin sesión (comodidad).
//   2. Esta comprobación en el servidor es la que cuenta: no confía en el proxy.
// Toda página, acción o Route Handler que dependa del usuario debe repetirla.
export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
      <p className="text-muted">Sesión iniciada como {user.email ?? user.name ?? user.id}.</p>
      <SignOutButton />
    </section>
  );
}
