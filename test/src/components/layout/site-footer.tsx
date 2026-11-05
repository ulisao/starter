import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted">
      © {new Date().getFullYear()} {siteConfig.name}
    </footer>
  );
}
