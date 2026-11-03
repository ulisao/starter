import "server-only";
import { AppError } from "@/lib/errors";
import type { AiProvider } from "./types";

export type { AiGenerateInput, AiGenerateResult, AiProvider } from "./types";

let cached: AiProvider | undefined;

/**
 * Devuelve el proveedor de IA elegido con la variable AI_PROVIDER ("openai" o
 * "anthropic"). Es el ÚNICO punto que conoce los adaptadores.
 *
 * Los adaptadores se cargan con import dinámico: solo se evalúa el SDK del
 * proveedor activo y solo se exige la clave de ese proveedor.
 *
 * Para agregar otro proveedor: crea `src/lib/ai/<nombre>.ts` que implemente
 * `AiProvider` y añade un `case` aquí (ver docs/extras/ai.md).
 */
export async function getAiProvider(): Promise<AiProvider> {
  if (cached) return cached;
  const choice = process.env.AI_PROVIDER;
  switch (choice) {
    case "openai":
      cached = (await import("./openai")).createOpenAiProvider();
      return cached;
    case "anthropic":
      cached = (await import("./anthropic")).createAnthropicProvider();
      return cached;
    default:
      throw new AppError(
        `AI_PROVIDER debe ser "openai" o "anthropic" (valor actual: ${choice ?? "sin definir"}).`,
        500,
        "ai_not_configured",
      );
  }
}
