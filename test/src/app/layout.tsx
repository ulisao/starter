import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
  description: siteConfig.description,
};

// Layout raíz. Es un Server Component: no agregues "use client" aquí.
// Los proveedores de contexto (autenticación, backend...) se montan en
// src/components/providers.tsx, no aquí.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col antialiased">
        <ClerkProvider>
          <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
          <SiteFooter />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}