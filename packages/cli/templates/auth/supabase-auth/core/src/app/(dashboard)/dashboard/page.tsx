import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Panel" };

// Página protegida de ejemplo. Reemplázala por tu panel real. Para leer datos del
// usuario, filtra SIEMPRE por el id obtenido en el servidor (getSessionUserId), nunca
// por un id que llegue desde el cliente.
export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
      <p className="text-muted">
        Sesión iniciada como <strong>{user?.email}</strong>.
      </p>
    </section>
  );
}
