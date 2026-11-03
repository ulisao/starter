import "server-only";

/**
 * Lee una variable de entorno obligatoria.
 *
 * Falla con un mensaje claro (en vez de un `undefined` silencioso) cuando falta.
 * Úsala SOLO en código de servidor. Las variables secretas nunca deben llevar el
 * prefijo NEXT_PUBLIC_, porque Next.js lo incluye en el JavaScript del navegador.
 *
 * Se llama de forma perezosa (al usar el servicio, no al importar el módulo) para
 * que `next build` no exija credenciales que solo existen en producción.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Revisa .env.example y docs/ENVIRONMENT.md.`,
    );
  }
  return value;
}
