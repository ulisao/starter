import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Panel" };

// Página protegida de ejemplo. Reemplázala por tu panel real.
export default async function DashboardPage() {
  const session = await getSession();
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">Panel</h1>
      <p className="text-muted">Sesión iniciada como {session?.user.email}.</p>
    </section>
  );
}
