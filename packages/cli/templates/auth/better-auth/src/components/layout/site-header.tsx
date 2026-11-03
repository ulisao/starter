import Link from "next/link";
import { siteConfig } from "@/config/site";
import { UserMenu } from "@/features/auth";

// Header con acceso a login / cierre de sesión. Reemplaza al header base (el módulo de
// autenticación lo declara como override). Sigue siendo un Server Component; solo UserMenu
// corre en el navegador.
export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav aria-label="Principal" className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          {siteConfig.name}
        </Link>
        <UserMenu />
      </nav>
    </header>
  );
}
