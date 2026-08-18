import { v } from "convex/values";

export const paymentTypeValidator = v.union(v.literal("contado"), v.literal("credito"));
export const payCurrencyValidator = v.union(v.literal("usd"), v.literal("bs"));
export const themeColorValidator = v.union(
  v.literal("verde"),
  v.literal("azul"),
  v.literal("morado"),
  v.literal("naranja"),
  v.literal("rosa")
);

export const saleItemValidator = v.object({
  productId: v.string(),
  name: v.string(),
  qty: v.number(),
  price: v.number(),
  cost: v.number(),
});

export const purchaseItemValidator = v.object({
  productId: v.optional(v.string()),
  name: v.string(),
  qty: v.number(),
  unitCost: v.number(),
});

export const publishedValidator = v.optional(
  v.object({
    instagram: v.optional(v.number()),
    whatsapp: v.optional(v.number()),
  })
);

export const productValidator = v.object({
  id: v.string(),
  name: v.string(),
  category: v.string(),
  size: v.optional(v.string()),
  color: v.optional(v.string()),
  sku: v.optional(v.string()),
  cost: v.number(),
  price: v.number(),
  stock: v.number(),
  minStock: v.number(),
  image: v.optional(v.string()),
  published: publishedValidator,
  createdAt: v.number(),
});

export const clientValidator = v.object({
  id: v.string(),
  name: v.string(),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  notes: v.optional(v.string()),
  createdAt: v.number(),
});

export const saleValidator = v.object({
  id: v.string(),
  number: v.number(),
  date: v.number(),
  clientId: v.optional(v.string()),
  items: v.array(saleItemValidator),
  total: v.number(),
  paymentType: paymentTypeValidator,
  note: v.optional(v.string()),
  payCurrency: v.optional(payCurrencyValidator),
  payBsAmount: v.optional(v.number()),
  payRate: v.optional(v.number()),
});

export const paymentValidator = v.object({
  id: v.string(),
  clientId: v.string(),
  amount: v.number(),
  date: v.number(),
  note: v.optional(v.string()),
  kind: v.optional(v.union(v.literal("abono"), v.literal("saldo"))),
  currency: v.optional(payCurrencyValidator),
  bsAmount: v.optional(v.number()),
  rate: v.optional(v.number()),
});

export const purchaseValidator = v.object({
  id: v.string(),
  date: v.number(),
  supplier: v.optional(v.string()),
  items: v.array(purchaseItemValidator),
  total: v.number(),
  note: v.optional(v.string()),
});

export const returnValidator = v.object({
  id: v.string(),
  saleId: v.string(),
  saleNumber: v.number(),
  clientId: v.optional(v.string()),
  date: v.number(),
  items: v.array(saleItemValidator),
  total: v.number(),
  reason: v.optional(v.string()),
});

export const cajaCierreValidator = v.object({
  id: v.string(),
  date: v.number(),
  createdAt: v.number(),
  ventaCount: v.number(),
  contadoTotal: v.number(),
  creditoTotal: v.number(),
  cobrosTotal: v.number(),
  cajaEsperada: v.number(),
  contadoBs: v.optional(v.number()),
  cobrosBs: v.optional(v.number()),
});

export const settingsValidator = v.object({
  storeName: v.string(),
  currency: v.string(),
  bcvRate: v.optional(v.number()),
  pinHash: v.optional(v.string()),
  themeColor: themeColorValidator,
  darkMode: v.boolean(),
});

export const DEFAULT_SETTINGS = {
  storeName: "Termuxtienda",
  currency: "$",
  themeColor: "verde",
  darkMode: false,
} as const;

export function uid(): string {
  return crypto.randomUUID();
}
