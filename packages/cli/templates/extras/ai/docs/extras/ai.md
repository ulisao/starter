# IA (OpenAI / Anthropic)

## Propósito

Arquitectura del lado del servidor para usar un modelo de lenguaje sin acoplar la aplicación a un proveedor. Incluye adaptadores para OpenAI y Anthropic sobre sus SDK oficiales, y se elige uno con una variable de entorno.

## Arquitectura

```text
src/lib/ai/types.ts       Interfaz AiProvider: generateText({ system?, prompt }) → { text }
src/lib/ai/openai.ts      Adaptador OpenAI (API Responses)
src/lib/ai/anthropic.ts   Adaptador Anthropic (API Messages)
src/lib/ai/index.ts       getAiProvider(): elige el adaptador según AI_PROVIDER
src/services/ai-service.ts  Servicio de ejemplo (summarizeText) con validación Zod
```

- Todo es `server-only`: las claves jamás llegan al navegador.
- Los adaptadores se cargan con import dinámico y leen sus variables solo al crearse. Con `AI_PROVIDER=openai` no se necesita `ANTHROPIC_API_KEY` (y viceversa), y `next build` no exige ninguna clave.

## Configuración

1. Elige proveedor en `.env.local`: `AI_PROVIDER=openai` o `AI_PROVIDER=anthropic`.
2. Crea una clave de API:
   - OpenAI: https://platform.openai.com/api-keys → `OPENAI_API_KEY`.
   - Anthropic: https://console.anthropic.com/settings/keys → `ANTHROPIC_API_KEY`.
3. Define el modelo en `OPENAI_MODEL` o `ANTHROPIC_MODEL`. No hay valor por defecto porque los modelos cambian: consulta la lista vigente en https://platform.openai.com/docs/models o https://docs.anthropic.com/en/docs/about-claude/models.

## Variables de entorno

| Variable | Secreta | Uso |
| --- | --- | --- |
| `AI_PROVIDER` | no | `openai` o `anthropic` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | clave sí | solo si `AI_PROVIDER=openai` |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | clave sí | solo si `AI_PROVIDER=anthropic` |

## Uso

```ts
// Server Action o Route Handler
import { summarizeText } from "@/services/ai-service";

const summary = await summarizeText({ text: userInput });
```

## Agregar otro proveedor

1. Crea `src/lib/ai/<nombre>.ts` con una función que devuelva un `AiProvider` (lee sus claves con `requireEnv` dentro de la función).
2. Añade un `case "<nombre>"` en `getAiProvider()` (`src/lib/ai/index.ts`).
3. Documenta sus variables en `.env.example`.

## Validación, límites y costos

- Valida SIEMPRE la entrada con Zod y limita su tamaño (`MAX_PROMPT_CHARS` en el servicio). Nunca concatenes entrada del usuario dentro de `system`.
- Autoriza al usuario en el servidor antes de llamar al modelo: cada petición cuesta dinero.
- Limita los tokens de salida (`MAX_OUTPUT_TOKENS` en el adaptador de Anthropic; en OpenAI puedes pasar `max_output_tokens` a `responses.create`).
- Configura límites de gasto en el panel de cada proveedor.
- Se recomienda combinar este módulo con rate limiting (el extra `rate-limit` de Baretta, u otro): aplica el límite por usuario o IP antes de llamar al servicio. Este módulo funciona sin él.

## Errores frecuentes

- `Falta la variable de entorno ...`: define la clave o el modelo del proveedor activo.
- `AI_PROVIDER debe ser "openai" o "anthropic"`: la variable falta o tiene un valor no soportado.
- Error 502 `ai_provider_error`: el proveedor rechazó la petición (clave inválida, modelo inexistente, cuota). El detalle queda en los logs del servidor.
