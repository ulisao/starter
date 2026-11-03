import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";
import type { AiProvider } from "./types";

/**
 * Tope de tokens de salida por respuesta. La API de Anthropic exige `max_tokens`.
 * Súbelo si necesitas respuestas más largas; ten en cuenta que impacta el costo.
 */
const MAX_OUTPUT_TOKENS = 1024;

/**
 * Adaptador de Anthropic (SDK oficial `@anthropic-ai/sdk`, API Messages).
 *
 * El cliente y las variables se leen al CREAR el proveedor (no al importar el
 * archivo), por lo que `next build` no exige ANTHROPIC_API_KEY.
 *
 * ANTHROPIC_MODEL no tiene valor por defecto a propósito: los modelos cambian
 * con frecuencia. Consulta la lista vigente en
 * https://docs.anthropic.com/en/docs/about-claude/models
 */
export function createAnthropicProvider(): AiProvider {
  const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  const model = requireEnv("ANTHROPIC_MODEL");

  return {
    name: "anthropic",
    async generateText({ system, prompt }) {
      const message = await client.messages.create({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        messages: [{ role: "user", content: prompt }],
      });
      const text = message.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("");
      return { text };
    },
  };
}
