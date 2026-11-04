import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Panel" };

// Página protegida de ejemplo. Reemplázala por tu panel real.
export default async function DashboardPage() {
  const user = await getSessionUser();
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">Panel</h1>
      <p className="text-muted">Sesión iniciada como {user?.email}.</p>
    </section>
  );
}
