import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "@/lib/payments/signature";

// Prueba la verificación de firma del webhook de Mercado Pago (función pura, sin I/O).
// Reconstruye la cabecera `x-signature` como la arma Mercado Pago: el "manifest" es
// `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` y v1 es su HMAC-SHA256 en hex con la clave.
const SECRET = "clave-secreta-de-prueba";

function signature(secret: string, dataId: string, requestId: string, ts: string) {
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${requestId};ts:${ts};`;
  const v1 = createHmac("sha256", secret).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("verifyWebhookSignature", () => {
  const dataId = "123456";
  const requestId = "req-abc";
  const ts = "1700000000";

  it("acepta una firma válida", () => {
    const header = signature(SECRET, dataId, requestId, ts);
    expect(verifyWebhookSignature({ secret: SECRET, signatureHeader: header, requestId, dataId })).toBe(true);
  });

  it("rechaza una firma hecha con otra clave", () => {
    const header = signature("otra-clave", dataId, requestId, ts);
    expect(verifyWebhookSignature({ secret: SECRET, signatureHeader: header, requestId, dataId })).toBe(false);
  });

  it("rechaza si falta la cabecera o la clave", () => {
    const header = signature(SECRET, dataId, requestId, ts);
    expect(verifyWebhookSignature({ secret: SECRET, signatureHeader: null, requestId, dataId })).toBe(false);
    expect(verifyWebhookSignature({ secret: "", signatureHeader: header, requestId, dataId })).toBe(false);
  });

  it("rechaza si el data.id no coincide con el que se firmó", () => {
    const header = signature(SECRET, dataId, requestId, ts);
    expect(verifyWebhookSignature({ secret: SECRET, signatureHeader: header, requestId, dataId: "999999" })).toBe(false);
  });

  it("rechaza una cabecera sin v1 o sin ts", () => {
    expect(verifyWebhookSignature({ secret: SECRET, signatureHeader: `ts=${ts}`, requestId, dataId })).toBe(false);
    expect(verifyWebhookSignature({ secret: SECRET, signatureHeader: "v1=deadbeef", requestId, dataId })).toBe(false);
  });

  it("normaliza a minúsculas un data.id alfanumérico (como Mercado Pago)", () => {
    // La firma se calcula con el id en minúsculas; verificar con el id en mayúsculas debe funcionar.
    const header = signature(SECRET, "ABCDEF", requestId, ts);
    expect(verifyWebhookSignature({ secret: SECRET, signatureHeader: header, requestId, dataId: "ABCDEF" })).toBe(true);
  });
});
