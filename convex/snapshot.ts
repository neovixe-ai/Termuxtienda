import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_SETTINGS,
  cajaCierreValidator,
  clientValidator,
  paymentValidator,
  productValidator,
  purchaseValidator,
  returnValidator,
  saleValidator,
  settingsValidator,
} from "./lib";

/**
 * Devuelve todo el estado de la tienda. Es la fuente de verdad que el cliente
 * se suscribe de forma reactiva.
 */
export const getSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const [products, clients, sales, payments, purchases, returns, cajaCierres, settings] =
      await Promise.all([
        ctx.db.query("products").collect(),
        ctx.db.query("clients").collect(),
        ctx.db.query("sales").collect(),
        ctx.db.query("payments").collect(),
        ctx.db.query("purchases").collect(),
        ctx.db.query("returns").collect(),
        ctx.db.query("cajaCierres").collect(),
        ctx.db.query("settings").first(),
      ]);

    return {
      products,
      clients,
      sales,
      payments,
      purchases,
      returns,
      cajaCierres,
      settings: settings ?? DEFAULT_SETTINGS,
    };
  },
});

/**
 * Reemplaza TODO el estado. Solo para operaciones administrativas poco frecuentes
 * (cargar datos de ejemplo, importar/exportar, restablecer). Las operaciones del
 * día a día usan mutaciones granulares en `mutations.ts`.
 */
export const replaceAll = mutation({
  args: {
    products: v.array(productValidator),
    clients: v.array(clientValidator),
    sales: v.array(saleValidator),
    payments: v.array(paymentValidator),
    purchases: v.array(purchaseValidator),
    returns: v.array(returnValidator),
    cajaCierres: v.array(cajaCierreValidator),
    settings: settingsValidator,
  },
  handler: async (ctx, args) => {
    const [oldProducts, oldClients, oldSales, oldPayments, oldPurchases, oldReturns, oldCaja, oldSettings] =
      await Promise.all([
        ctx.db.query("products").collect(),
        ctx.db.query("clients").collect(),
        ctx.db.query("sales").collect(),
        ctx.db.query("payments").collect(),
        ctx.db.query("purchases").collect(),
        ctx.db.query("returns").collect(),
        ctx.db.query("cajaCierres").collect(),
        ctx.db.query("settings").collect(),
      ]);

    await Promise.all([
      ...oldProducts.map((d) => ctx.db.delete(d._id)),
      ...oldClients.map((d) => ctx.db.delete(d._id)),
      ...oldSales.map((d) => ctx.db.delete(d._id)),
      ...oldPayments.map((d) => ctx.db.delete(d._id)),
      ...oldPurchases.map((d) => ctx.db.delete(d._id)),
      ...oldReturns.map((d) => ctx.db.delete(d._id)),
      ...oldCaja.map((d) => ctx.db.delete(d._id)),
      ...oldSettings.map((d) => ctx.db.delete(d._id)),
    ]);

    for (const p of args.products) await ctx.db.insert("products", p);
    for (const c of args.clients) await ctx.db.insert("clients", c);
    for (const s of args.sales) await ctx.db.insert("sales", s);
    for (const p of args.payments) await ctx.db.insert("payments", p);
    for (const p of args.purchases) await ctx.db.insert("purchases", p);
    for (const r of args.returns) await ctx.db.insert("returns", r);
    for (const c of args.cajaCierres) await ctx.db.insert("cajaCierres", c);
    await ctx.db.insert("settings", args.settings);
  },
});
