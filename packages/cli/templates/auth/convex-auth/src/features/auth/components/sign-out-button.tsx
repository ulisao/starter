"use client";

import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";

// Cierra la sesión: Convex invalida la sesión en el servidor y se borran las cookies.
// Es Client Component porque `signOut` se ejecuta en el navegador.
export function SignOutButton() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => {
        void signOut().then(() => router.push("/login"));
      }}
    >
      Cerrar sesión
    </Button>
  );
}
