import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { getSessionUserId } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Panel" };

// Página protegida. Hay dos capas:
//   1. src/proxy.ts redirige a /sign-in si no hay sesión (autenticación).
//   2. Aquí se vuelve a verificar en el servidor y se decide qué puede ver el usuario
//      (autorización). Autenticación responde "quién eres"; autorización, "qué puedes hacer".
export default async function DashboardPage() {
  const userId = await getSessionUserId();
  // Defensa en profundidad: si el proxy no cubriera esta ruta, no se filtra nada.
  if (!userId) return <p>Necesitas iniciar sesión.</p>;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "sin email";

  // Ejemplo de autorización en el servidor: el rol vive en `publicMetadata`, que el
  // usuario NO puede modificar desde el navegador (solo desde el Dashboard de Clerk o
  // la Backend API). Asígnalo en Users → tu usuario → Public metadata: { "role": "admin" }.
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Panel</h1>
        <p className="text-muted">
          Sesión iniciada como {email} (id: {userId}). Método elegido para este proyecto: <%= authMethodLabel %>.
        </p>
      </div>
      {isAdmin ? (
        <p className="rounded-md border border-border p-4">
          Eres administrador: este bloque solo se renderiza para el rol &quot;admin&quot;.
        </p>
      ) : (
        <p className="rounded-md border border-border p-4 text-muted">
          No tienes el rol &quot;admin&quot;. Asígnalo en <code>publicMetadata</code> para ver el bloque restringido.
        </p>
      )}
    </section>
  );
}
