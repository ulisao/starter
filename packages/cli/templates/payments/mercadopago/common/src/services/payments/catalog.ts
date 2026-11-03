/**
 * Catálogo de cobros. LOS PRECIOS VIVEN AQUÍ, en el servidor.
 *
 * El navegador solo envía un identificador (por ejemplo "ejemplo-basico"); el monto
 * y el título se leen de este archivo. Nunca aceptes un precio enviado por el cliente.
 *
 * TODO (decisión de negocio): reemplaza el ejemplo por tus productos reales y usa la
 * moneda de tu cuenta de Mercado Pago (ARS, BRL, CLP, COP, MXN, PEN, UYU...). Si el
 * catálogo cambia con frecuencia, muévelo a la base de datos manteniendo la regla:
 * el servidor decide el precio.
 */
<%#if payOneTime%>
export type Product = {
  title: string;
  /** Precio unitario, en la unidad principal de la moneda (por ejemplo pesos, no centavos). */
  unitPrice: number;
  currency: string;
};

export const PRODUCTS: Record<string, Product> = {
  "ejemplo-basico": { title: "Producto de ejemplo", unitPrice: 1000, currency: "ARS" },
};

/** Busca un producto por id. `Object.hasOwn` evita que claves como "toString" resuelvan al prototipo. */
export function getProduct(id: string): Product | undefined {
  return Object.hasOwn(PRODUCTS, id) ? PRODUCTS[id] : undefined;
}
<%#endif%>
<%#if paySubscription%>
export type SubscriptionPlan = {
  title: string;
  /** Monto de cada cobro, en la unidad principal de la moneda. */
  amount: number;
  currency: string;
  /** Cada cuántas unidades de `frequencyType` se cobra (1 + "months" = mensual). */
  frequency: number;
  frequencyType: "days" | "months";
};

export const PLANS: Record<string, SubscriptionPlan> = {
  "plan-mensual": { title: "Plan mensual de ejemplo", amount: 1000, currency: "ARS", frequency: 1, frequencyType: "months" },
};

/** Busca un plan por id. `Object.hasOwn` evita que claves como "toString" resuelvan al prototipo. */
export function getPlan(id: string): SubscriptionPlan | undefined {
  return Object.hasOwn(PLANS, id) ? PLANS[id] : undefined;
}
<%#endif%>
