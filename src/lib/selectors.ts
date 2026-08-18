import type { Client, Payment, Sale } from "./types";

export function clientCreditTotal(sales: Sale[], clientId: string): number {
  return sales
    .filter((s) => s.clientId === clientId && s.paymentType === "credito")
    .reduce((acc, s) => acc + s.total, 0);
}

export function clientPaid(payments: Payment[], clientId: string): number {
  return payments.filter((p) => p.clientId === clientId).reduce((acc, p) => acc + p.amount, 0);
}

/** Saldo del cliente: negativo = saldo a favor (pagó de más). */
export function clientBalance(sales: Sale[], payments: Payment[], clientId: string): number {
  return clientCreditTotal(sales, clientId) - clientPaid(payments, clientId);
}

export function clientDebt(sales: Sale[], payments: Payment[], clientId: string): number {
  return Math.max(0, clientBalance(sales, payments, clientId));
}

/** Dinero que el cliente tiene a favor (pagó de más). */
export function clientSaldoAFavor(sales: Sale[], payments: Payment[], clientId: string): number {
  return Math.max(0, -clientBalance(sales, payments, clientId));
}

export function totalReceivables(sales: Sale[], payments: Payment[]): number {
  const ids = new Set(
    sales
      .filter((s) => s.paymentType === "credito" && s.clientId)
      .map((s) => s.clientId as string)
  );
  return [...ids].reduce((acc, id) => acc + clientDebt(sales, payments, id), 0);
}

/** Clientes que deben, ordenados de mayor a menor deuda. */
export function debtorsList(
  clients: Client[],
  sales: Sale[],
  payments: Payment[]
): Array<{ client: Client; debt: number }> {
  return clients
    .map((client) => ({ client, debt: clientDebt(sales, payments, client.id) }))
    .filter((d) => d.debt > 0.004)
    .sort((a, b) => b.debt - a.debt);
}

/** Total vendido por tipo de pago. */
export function paymentTypeTotals(sales: Sale[]): { contado: number; credito: number } {
  return sales.reduce(
    (acc, s) => {
      acc[s.paymentType] += s.total;
      return acc;
    },
    { contado: 0, credito: 0 }
  );
}

export function saleProfit(sale: Sale): number {
  return sale.items.reduce((acc, i) => acc + (i.price - i.cost) * i.qty, 0);
}

export function salesProfit(sales: Sale[]): number {
  return sales.reduce((acc, s) => acc + saleProfit(s), 0);
}

/** Ventas agrupadas por día (clave = inicio del día) dentro de un rango. */
export function salesByDay(sales: Sale[], from: number, to: number): Array<{ day: number; total: number }> {
  const days = new Map<number, number>();
  for (const s of sales) {
    if (s.date < from || s.date > to) continue;
    const day = new Date(s.date);
    day.setHours(0, 0, 0, 0);
    const key = day.getTime();
    days.set(key, (days.get(key) ?? 0) + s.total);
  }
  return [...days.entries()]
    .map(([day, total]) => ({ day, total }))
    .sort((a, b) => a.day - b.day);
}
