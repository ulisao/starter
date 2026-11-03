import "server-only";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { getAiProvider } from "@/lib/ai";

/**
 * Límite de la entrada. Controla el costo y reduce el abuso: ajústalo a tu caso.
 * (Un límite en caracteres es solo una aproximación al límite real en tokens.)
 */
const MAX_PROMPT_CHARS = 4000;

const summarizeSchema = z.object({
  text: z.string().trim().min(1, "El texto es obligatorio.").max(MAX_PROMPT_CHARS),
});

/**
 * Servicio de ejemplo: resume un texto con el proveedor de IA configurado.
 *
 * Patrón a seguir en tus propios servicios: validar la entrada con Zod, llamar a
 * `getAiProvider()` (nunca a un SDK directo) y traducir los fallos del proveedor
 * a `AppError` para no filtrar detalles internos al cliente.
 *
 * IMPORTANTE: llama a este servicio SOLO desde el servidor (Server Action o
 * Route Handler), autorizando al usuario antes y aplicando un límite de
 * peticiones; cada llamada tiene costo.
 */
export async function summarizeText(input: unknown): Promise<string> {
  const parsed = summarizeSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(z.prettifyError(parsed.error), 400, "invalid_input");
  }

  const provider = await getAiProvider();
  try {
    const { text } = await provider.generateText({
      system: "Resume el texto del usuario en español, en un máximo de tres frases.",
      prompt: parsed.data.text,
    });
    return text;
  } catch (error) {
    console.error(`[ai] falló el proveedor ${provider.name}`, error);
    throw new AppError("No se pudo generar la respuesta de IA.", 502, "ai_provider_error");
  }
}
