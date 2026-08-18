import { describe, expect, it } from "vitest";
import {
  clientBalance,
  clientCreditTotal,
  clientDebt,
  clientPaid,
  clientSaldoAFavor,
  debtorsList,
  paymentTypeTotals,
  saleProfit,
  salesByDay,
  totalReceivables,
} from "./selectors";
import type { Client, Payment, Sale } from "./types";

function sale(over: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    number: 1,
    date: Date.now(),
    items: [{ productId: "p1", name: "X", qty: 1, price: 100, cost: 60 }],
    total: 100,
    paymentType: "credito",
    clientId: "c1",
    ...over,
  };
}

function payment(over: Partial<Payment> = {}): Payment {
  return { id: "pm1", clientId: "c1", amount: 100, date: Date.now(), ...over };
}

describe("saldo de cliente", () => {
  it("calcula deuda y saldo a favor", () => {
    expect(clientCreditTotal([sale()], "c1")).toBe(100);
    expect(clientPaid([payment({ amount: 120 })], "c1")).toBe(120);
    expect(clientBalance([sale()], [payment({ amount: 120 })], "c1")).toBe(-20);
    expect(clientDebt([sale()], [payment({ amount: 120 })], "c1")).toBe(0);
    expect(clientSaldoAFavor([sale()], [payment({ amount: 120 })], "c1")).toBe(20);
  });

  it("solo cuenta las ventas a crédito del cliente", () => {
    const sales = [
      sale(),
      sale({ id: "s2", paymentType: "contado", clientId: "c1" }),
      sale({ id: "s3", clientId: "c2" }),
    ];
    expect(clientCreditTotal(sales, "c1")).toBe(100);
  });
});

describe("totalReceivables", () => {
  it("suma solo la deuda positiva por cliente", () => {
    const sales = [
      sale(), // c1 debe 100
      sale({ id: "s2", clientId: "c2", total: 200 }), // c2 debe 200
      sale({ id: "s3", clientId: "c3" }), // c3 debe 100
    ];
    const payments = [
      payment({ clientId: "c1", amount: 150 }), // c1 queda con 50 a favor
      payment({ clientId: "c3", amount: 100 }), // c3 al día
    ];
    expect(totalReceivables(sales, payments)).toBeCloseTo(200);
  });
});

describe("debtorsList", () => {
  it("ordena de mayor a menor deuda", () => {
    const clients: Client[] = [
      { id: "c1", name: "A", createdAt: 0 },
      { id: "c2", name: "B", createdAt: 0 },
    ];
    const sales = [sale(), sale({ id: "s2", clientId: "c2", total: 300 })];
    const list = debtorsList(clients, sales, []);
    expect(list.map((d) => d.client.id)).toEqual(["c2", "c1"]);
    expect(list[0].debt).toBe(300);
  });
});

describe("saleProfit y paymentTypeTotals", () => {
  it("calcula ganancia y totales por tipo de pago", () => {
    const s = sale({
      items: [{ productId: "p1", name: "X", qty: 2, price: 100, cost: 60 }],
      total: 200,
    });
    expect(saleProfit(s)).toBe(80);

    const totals = paymentTypeTotals([
      s,
      sale({ id: "s2", paymentType: "contado", total: 50 }),
    ]);
    expect(totals.credito).toBe(200);
    expect(totals.contado).toBe(50);
  });
});

describe("salesByDay", () => {
  it("agrupa por día dentro del rango", () => {
    const day = new Date(2026, 0, 5, 10, 0, 0).getTime();
    const sales = [sale({ date: day }), sale({ id: "s2", date: day + 60_000, total: 30 })];
    const result = salesByDay(sales, day - 1, day + 86_400_000);
    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(130);
  });
});
