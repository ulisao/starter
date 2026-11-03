import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth/session";

// Layout de las rutas protegidas. Verifica la sesión REAL en el servidor (el proxy solo
// revisa la cookie). Todo lo que viva dentro de (dashboard) queda protegido.
// Recuerda: un layout no protege Server Actions ni Route Handlers; esos deben llamar a
// requireUserId() por su cuenta.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (!(await getSessionUserId())) redirect("/login");
  return children;
}
