// Piezas de presentación compartidas por los formularios de acceso.

const inputClass = "h-10 w-full rounded-md border border-border bg-background px-3";

export function AuthField({ label, name, type = "text", autoComplete, inputMode }: { label: string; name: string; type?: string; autoComplete?: string; inputMode?: "numeric" }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input id={name} name={name} type={type} autoComplete={autoComplete} inputMode={inputMode} required className={inputClass} />
    </div>
  );
}

// Los errores se muestran con un mensaje genérico a propósito: no reveles si un email existe o no.
export function AuthFeedback({ error, info }: { error: string | null; info?: string | null }) {
  return (
    <>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {info ? <p className="text-sm text-muted">{info}</p> : null}
    </>
  );
}
