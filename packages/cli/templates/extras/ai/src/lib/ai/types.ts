/**
 * Contrato común de los proveedores de IA.
 *
 * El resto de la aplicación (servicios, Server Actions, Route Handlers) depende
 * SOLO de esta interfaz, nunca de un SDK concreto. Así cambiar de OpenAI a
 * Anthropic (o a otro proveedor) es un cambio de configuración, no de código.
 *
 * Es deliberadamente mínima: texto entra, texto sale. Si necesitas streaming,
 * herramientas o imágenes, amplía esta interfaz e implementa el método nuevo en
 * cada adaptador (ver docs/extras/ai.md).
 */
export interface AiGenerateInput {
  /** Instrucciones de sistema (rol y reglas). Opcional. */
  system?: string;
  /** Mensaje del usuario. Ya debe venir validado y acotado en tamaño. */
  prompt: string;
}

export interface AiGenerateResult {
  text: string;
}

export interface AiProvider {
  /** Nombre del proveedor, útil para logs. */
  readonly name: string;
  generateText(input: AiGenerateInput): Promise<AiGenerateResult>;
}
