import { describe, expect, it } from "vitest";
import { contactSchema } from "@/features/contact/schemas/contact-schema";

describe("contactSchema", () => {
  const valid = { name: "Ada Lovelace", email: "ada@example.com", message: "Hola, quiero más información." };

  it("acepta datos válidos y recorta espacios", () => {
    const result = contactSchema.safeParse({ ...valid, name: "  Ada Lovelace  " });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Ada Lovelace");
  });

  it("rechaza un email inválido", () => {
    expect(contactSchema.safeParse({ ...valid, email: "no-es-un-email" }).success).toBe(false);
  });

  it("rechaza un mensaje demasiado corto o demasiado largo", () => {
    expect(contactSchema.safeParse({ ...valid, message: "corto" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
  });

  it("rechaza un nombre vacío", () => {
    expect(contactSchema.safeParse({ ...valid, name: " " }).success).toBe(false);
  });
});
