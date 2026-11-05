import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { siteConfig } from "@/config/site";

// Header con acceso de Clerk. `Show` decide qué ver según la sesión; es solo presentación:
// la protección real de las rutas está en src/proxy.ts y en las comprobaciones del servidor.
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav aria-label="Principal" className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          {siteConfig.name}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton />
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">Panel</Link>
            <UserButton />
          </Show>
        </div>
      </nav>
    </header>
  );
}
