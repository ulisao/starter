"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

// Menú de usuario del header. Es un Client Component para que el resto del sitio siga
// siendo estático: lee la sesión desde el navegador con `useSession`.
// Es solo presentación; la autorización real ocurre en el servidor.
export function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (!session) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/login" className="hover:underline">
          Iniciar sesión
        </Link>
        <Link href="/register" className="hover:underline">
          Crear cuenta
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link href="/dashboard" className="hover:underline">
        {session.user.email}
      </Link>
      <Button
        variant="outline"
        onClick={() =>
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                router.push("/");
                router.refresh();
              },
            },
          })
        }
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
