import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth";
import { getCurrentUser } from "@/lib/auth/session";

// Reemplaza al header base: muestra "Ingresar" o el correo del usuario con "Salir".
// Es un Server Component y lee la sesión en cada petición, por lo que las páginas que
// lo incluyen se renderizan de forma dinámica (no se sirven como HTML estático).
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border">
      <nav aria-label="Principal" className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          {siteConfig.name}
        </Link>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Panel
            </Link>
            <span className="hidden text-muted sm:inline">{user.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" className="h-8 px-3">
                Salir
              </Button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="text-sm font-medium hover:underline">
            Ingresar
          </Link>
        )}
      </nav>
    </header>
  );
}
