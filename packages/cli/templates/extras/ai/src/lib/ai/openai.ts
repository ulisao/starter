import "server-only";
import OpenAI from "openai";
import { requireEnv } from "@/lib/env";
import type { AiProvider } from "./types";

/**
 * Adaptador de OpenAI (SDK oficial `openai`, API Responses).
 *
 * El cliente y las variables se leen al CREAR el proveedor (no al importar el
 * archivo), por lo que `next build` no exige OPENAI_API_KEY.
 *
 * OPENAI_MODEL no tiene valor por defecto a propósito: los modelos cambian con
 * frecuencia. Consulta la lista vigente en https://platform.openai.com/docs/models
 */
export function createOpenAiProvider(): AiProvider {
  const client = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  const model = requireEnv("OPENAI_MODEL");

  return {
    name: "openai",
    async generateText({ system, prompt }) {
      const response = await client.responses.create({
        model,
        instructions: system,
        input: prompt,
      });
      return { text: response.output_text };
    },
  };
}
