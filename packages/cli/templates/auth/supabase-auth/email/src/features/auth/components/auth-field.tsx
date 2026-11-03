import type { InputHTMLAttributes } from "react";

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  name: string;
  label: string;
  error?: string;
};

/**
 * Campo de formulario con etiqueta y mensaje de error accesibles. Lo comparten los
 * formularios de acceso; para formularios fuera de "auth" crea tu propio componente.
 */
export function AuthField({ name, label, error, ...input }: AuthFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="h-10 w-full rounded-md border border-border bg-background px-3"
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        {...input}
      />
      <p id={`${name}-error`} className="text-sm text-danger">
        {error}
      </p>
    </div>
  );
}

/** Mensaje de estado del formulario (éxito o error). `role="status"` lo anuncia a lectores de pantalla. */
export function AuthMessage({ ok, message }: { ok: boolean; message: string }) {
  return (
    <p role="status" className={ok ? "text-sm" : "text-sm text-danger"}>
      {message}
    </p>
  );
}
