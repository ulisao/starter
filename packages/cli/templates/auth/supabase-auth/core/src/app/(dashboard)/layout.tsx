import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";

// Todas las rutas de (dashboard) exigen sesión. Esta es la comprobación REAL (en el
// servidor); el proxy solo redirige antes por comodidad. Las Server Actions y Route
// Handlers que muten datos deben volver a comprobar el usuario: un layout no los protege.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return children;
}
