import { ContactForm } from "@/features/contact";

// Página inicial. El grupo de rutas (public) no altera la URL: esta página es "/".
// Reemplázala por tu landing real; el formulario es solo un ejemplo de Server Action.
export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">test</h1>
        <p className="max-w-prose text-muted">
          Proyecto generado con Baretta Starter. Lee AGENTS.md y docs/ARCHITECTURE.md para
          conocer la estructura y las convenciones antes de empezar a construir.
        </p>
      </div>
      <ContactForm />
    </section>
  );
}
