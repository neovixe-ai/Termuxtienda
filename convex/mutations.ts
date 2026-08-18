import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_SETTINGS,
  payCurrencyValidator,
  paymentTypeValidator,
  publishedValidator,
  purchaseItemValidator,
  saleItemValidator,
  themeColorValidator,
  uid,
} from "./lib";

type Patch<T extends Record<string, unknown>> = { [K in keyof T]?: Exclude<T[K], undefined> };

/** Devuelve solo las claves presentes (sin `undefined`) para hacer un patch limpio. */
function compact<T extends Record<string, unknown>>(obj: T): Patch<T> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    const value = obj[key];
    if (value !== undefined) out[key as string] = value;
  }
  return out as Patch<T>;
}

function findProduct(ctx: MutationCtx, id: string) {
  return ctx.db.query("products").withIndex("by_app_id", (q) => q.eq("id", id)).unique();
}
function findClient(ctx: MutationCtx, id: string) {
  return ctx.db.query("clients").withIndex("by_app_id", (q) => q.eq("id", id)).unique();
}
function findSale(ctx: MutationCtx, id: string) {
  return ctx.db.query("sales").withIndex("by_app_id", (q) => q.eq("id", id)).unique();
}

// ---------- Productos ----------

export const addProduct = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("products", {
      id: uid(),
      createdAt: Date.now(),
      name: args.name,
      category: args.category,
      cost: args.cost,
      price: args.price,
      stock: args.stock,
      minStock: args.minStock,
      ...(args.size !== undefined ? { size: args.size } : {}),
      ...(args.color !== undefined ? { color: args.color } : {}),
      ...(args.sku !== undefined ? { sku: args.sku } : {}),
      ...(args.image !== undefined ? { image: args.image } : {}),
      ...(args.published !== undefined ? { published: args.published } : {}),
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.string(),
    patch: v.object({
      name: v.optional(v.string()),
      category: v.optional(v.string()),
      size: v.optional(v.string()),
      color: v.optional(v.string()),
      sku: v.optional(v.string()),
      cost: v.optional(v.number()),
      price: v.optional(v.number()),
      stock: v.optional(v.number()),
      minStock: v.optional(v.number()),
      image: v.optional(v.string()),
      published: publishedValidator,
    }),
  },
  handler: async (ctx, args) => {
    const product = await findProduct(ctx, args.id);
    if (product) await ctx.db.patch(product._id, compact(args.patch));
  },
});

export const deleteProduct = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const product = await findProduct(ctx, args.id);
    if (product) await ctx.db.delete(product._id);
  },
});

// ---------- Clientes ----------

export const addClient = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const client = {
      id: uid(),
      createdAt: Date.now(),
      name: args.name,
      ...(args.phone !== undefined ? { phone: args.phone } : {}),
      ...(args.address !== undefined ? { address: args.address } : {}),
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
    };
    await ctx.db.insert("clients", client);
    return client;
  },
});

export const updateClient = mutation({
  args: {
    id: v.string(),
    patch: v.object({
      name: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const client = await findClient(ctx, args.id);
    if (client) await ctx.db.patch(client._id, compact(args.patch));
  },
});

export const deleteClient = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const client = await findClient(ctx, args.id);
    if (!client) return false;

    if ((await clientDebt(ctx, args.id)) > 0.004) return false;

    await ctx.db.delete(client._id);
    return true;
  },
});

// ---------- Ventas ----------

export const addSale = mutation({
  args: {
    items: v.array(saleItemValidator),
    paymentType: paymentTypeValidator,
    clientId: v.optional(v.string()),
    note: v.optional(v.string()),
    payCurrency: v.optional(payCurrencyValidator),
    payBsAmount: v.optional(v.number()),
    payRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db.query("sales").collect();
    const number = sales.reduce((m, s) => Math.max(m, s.number), 0) + 1;
    const total = args.items.reduce((acc, i) => acc + i.price * i.qty, 0);

    for (const item of args.items) {
      const product = await findProduct(ctx, item.productId);
      if (product) {
        await ctx.db.patch(product._id, { stock: Math.max(0, product.stock - item.qty) });
      }
    }

    const sale = {
      id: uid(),
      number,
      date: Date.now(),
      items: args.items,
      total,
      paymentType: args.paymentType,
      ...(args.clientId !== undefined ? { clientId: args.clientId } : {}),
      ...(args.note !== undefined ? { note: args.note } : {}),
      ...(args.payCurrency !== undefined ? { payCurrency: args.payCurrency } : {}),
      ...(args.payBsAmount !== undefined ? { payBsAmount: args.payBsAmount } : {}),
      ...(args.payRate !== undefined ? { payRate: args.payRate } : {}),
    };
    await ctx.db.insert("sales", sale);
    return sale;
  },
});

export const addPayment = mutation({
  args: {
    clientId: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("abono"), v.literal("saldo"))),
    currency: v.optional(payCurrencyValidator),
    bsAmount: v.optional(v.number()),
    rate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const payment = {
      id: uid(),
      date: Date.now(),
      clientId: args.clientId,
      amount: args.amount,
      kind: args.kind ?? "abono",
      currency: args.currency ?? "usd",
      ...(args.note !== undefined ? { note: args.note } : {}),
      ...(args.bsAmount !== undefined ? { bsAmount: args.bsAmount } : {}),
      ...(args.rate !== undefined ? { rate: args.rate } : {}),
    };
    await ctx.db.insert("payments", payment);
    return payment;
  },
});

// ---------- Compras ----------

export const addPurchase = mutation({
  args: {
    supplier: v.optional(v.string()),
    items: v.array(purchaseItemValidator),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const total = args.items.reduce((acc, i) => acc + i.qty * i.unitCost, 0);

    for (const item of args.items) {
      if (!item.productId) continue;
      const product = await findProduct(ctx, item.productId);
      if (product) {
        await ctx.db.patch(product._id, {
          stock: product.stock + item.qty,
          cost: item.unitCost,
        });
      }
    }

    await ctx.db.insert("purchases", {
      id: uid(),
      date: Date.now(),
      items: args.items,
      total,
      ...(args.supplier !== undefined ? { supplier: args.supplier } : {}),
      ...(args.note !== undefined ? { note: args.note } : {}),
    });
  },
});

// ---------- Devoluciones ----------

export const addReturn = mutation({
  args: {
    saleId: v.string(),
    items: v.array(saleItemValidator),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sale = await findSale(ctx, args.saleId);
    if (!sale) return null;

    for (const ret of args.items) {
      const sold = sale.items.find((i) => i.productId === ret.productId);
      if (!sold || ret.qty <= 0 || ret.qty > sold.qty) return null;
    }

    const returnTotal = args.items.reduce((acc, ret) => {
      const sold = sale.items.find((i) => i.productId === ret.productId);
      return acc + (sold ? sold.price : 0) * ret.qty;
    }, 0);

    for (const item of args.items) {
      const product = await findProduct(ctx, item.productId);
      if (product) {
        await ctx.db.patch(product._id, { stock: product.stock + item.qty });
      }
    }

    const items = sale.items
      .map((item) => {
        const ret = args.items.find((r) => r.productId === item.productId);
        return ret ? { ...item, qty: item.qty - ret.qty } : item;
      })
      .filter((i) => i.qty > 0);
    const total = items.reduce((acc, i) => acc + i.price * i.qty, 0);
    await ctx.db.patch(sale._id, { items, total });

    const record = {
      id: uid(),
      saleId: sale.id,
      saleNumber: sale.number,
      date: Date.now(),
      items: args.items,
      total: returnTotal,
      ...(sale.clientId !== undefined ? { clientId: sale.clientId } : {}),
      ...(args.reason?.trim() ? { reason: args.reason.trim() } : {}),
    };
    await ctx.db.insert("returns", record);
    return record;
  },
});

// ---------- Cierre de caja ----------

export const closeCaja = mutation({
  args: {
    dayStart: v.number(),
    dayEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = (await ctx.db.query("cajaCierres").collect()).find(
      (c) => c.date === args.dayStart
    );
    if (existing) return null;

    const sales = await ctx.db.query("sales").collect();
    const payments = await ctx.db.query("payments").collect();
    const today = sales.filter((s) => s.date >= args.dayStart && s.date <= args.dayEnd);
    const todayPayments = payments.filter(
      (p) => p.date >= args.dayStart && p.date <= args.dayEnd
    );

    const contadoTotal = today
      .filter((s) => s.paymentType === "contado")
      .reduce((a, s) => a + s.total, 0);
    const creditoTotal = today
      .filter((s) => s.paymentType === "credito")
      .reduce((a, s) => a + s.total, 0);
    const cobrosTotal = todayPayments
      .filter((p) => p.kind !== "saldo")
      .reduce((a, p) => a + p.amount, 0);
    const contadoBsTotal = today
      .filter((s) => s.paymentType === "contado" && s.payCurrency === "bs")
      .reduce((a, s) => a + (s.payBsAmount ?? 0), 0);
    const cobrosBsTotal = todayPayments
      .filter((p) => p.kind !== "saldo" && p.currency === "bs")
      .reduce((a, p) => a + (p.bsAmount ?? 0), 0);

    const cierre = {
      id: uid(),
      date: args.dayStart,
      createdAt: Date.now(),
      ventaCount: today.length,
      contadoTotal,
      creditoTotal,
      cobrosTotal,
      cajaEsperada: contadoTotal + cobrosTotal,
      contadoBs: contadoBsTotal,
      cobrosBs: cobrosBsTotal,
    };
    await ctx.db.insert("cajaCierres", cierre);
    return cierre;
  },
});

// ---------- Ajustes ----------

export const updateSettings = mutation({
  args: {
    patch: v.object({
      storeName: v.optional(v.string()),
      currency: v.optional(v.string()),
      bcvRate: v.optional(v.number()),
      pinHash: v.optional(v.string()),
      themeColor: v.optional(themeColorValidator),
      darkMode: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    const patch = compact(args.patch);
    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("settings", {
        storeName: DEFAULT_SETTINGS.storeName,
        currency: DEFAULT_SETTINGS.currency,
        themeColor: DEFAULT_SETTINGS.themeColor,
        darkMode: DEFAULT_SETTINGS.darkMode,
        ...(patch.storeName !== undefined ? { storeName: patch.storeName } : {}),
        ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
        ...(patch.bcvRate !== undefined ? { bcvRate: patch.bcvRate } : {}),
        ...(patch.pinHash !== undefined ? { pinHash: patch.pinHash } : {}),
        ...(patch.themeColor !== undefined ? { themeColor: patch.themeColor } : {}),
        ...(patch.darkMode !== undefined ? { darkMode: patch.darkMode } : {}),
      });
    }
  },
});

// ---------- Utilidades ----------

async function clientDebt(ctx: MutationCtx, clientId: string): Promise<number> {
  const sales = await ctx.db
    .query("sales")
    .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
    .collect();
  const credit = sales
    .filter((s) => s.paymentType === "credito")
    .reduce((a, s) => a + s.total, 0);
  const payments = await ctx.db
    .query("payments")
    .withIndex("by_clientId", (q) => q.eq("clientId", clientId))
    .collect();
  const paid = payments.reduce((a, p) => a + p.amount, 0);
  return Math.max(0, credit - paid);
}
