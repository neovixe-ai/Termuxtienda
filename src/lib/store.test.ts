import "../test/setup";
import { beforeEach, describe, expect, it } from "vitest";
import { clientBalance } from "./selectors";
import { migrateState, useApp } from "./store";
import type { Client, Product } from "./types";

function product(over: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Producto",
    category: "General",
    cost: 10,
    price: 20,
    stock: 5,
    minStock: 1,
    createdAt: 0,
    ...over,
  };
}

function client(over: Partial<Client> = {}): Client {
  return { id: "c1", name: "Ana", createdAt: 0, ...over };
}

function resetState() {
  useApp.setState({
    products: [product()],
    clients: [client()],
    sales: [],
    payments: [],
    purchases: [],
    returns: [],
    cajaCierres: [],
    settings: { storeName: "T", currency: "$", themeColor: "verde", darkMode: false },
  });
}

beforeEach(() => {
  localStorage.clear();
  resetState();
});

describe("migrateState", () => {
  it("preserva datos v1 y añade los campos nuevos", () => {
    const migrated = migrateState(
      {
        products: [product()],
        clients: [client()],
        sales: [],
        payments: [{ id: "pm1", clientId: "c1", amount: 10, date: 1 }],
        purchases: [],
        settings: { storeName: "Old", currency: "$", themeColor: "azul", darkMode: false },
      },
      1
    );
    expect(migrated.products).toHaveLength(1);
    expect(migrated.returns).toEqual([]);
    expect(migrated.cajaCierres).toEqual([]);
    expect(migrated.payments[0].kind).toBe("abono");
    expect(migrated.payments[0].currency).toBe("usd");
    expect(migrated.settings.storeName).toBe("Old");
  });

  it("no rompe con datos vacíos o ausentes", () => {
    const migrated = migrateState(undefined, 1);
    expect(migrated.products).toEqual([]);
    expect(migrated.settings.storeName).toBe("Termuxtienda");
  });
});

describe("addSale", () => {
  it("descuenta stock y recalcula el total desde los items", () => {
    const sale = useApp.getState().addSale({
      items: [{ productId: "p1", name: "Producto", qty: 2, price: 20, cost: 10 }],
      total: 999, // debe ignorarse
      paymentType: "contado",
    });
    expect(sale.total).toBe(40);
    expect(useApp.getState().products[0].stock).toBe(3);
  });

  it("aplica el saldo a favor sin duplicar el descuento", () => {
    // c1 debe 50 y pagó 100 → 50 a favor.
    useApp.setState({
      sales: [
        {
          id: "s1",
          number: 1,
          date: 1,
          clientId: "c1",
          items: [{ productId: "p1", name: "Producto", qty: 1, price: 50, cost: 10 }],
          total: 50,
          paymentType: "credito",
        },
      ],
      payments: [{ id: "pm1", clientId: "c1", amount: 100, date: 2, kind: "abono" }],
    });

    useApp.getState().addSale({
      items: [{ productId: "p1", name: "Producto", qty: 1, price: 80, cost: 10 }],
      total: 80,
      paymentType: "credito",
      clientId: "c1",
    });

    const { sales, payments } = useApp.getState();
    expect(payments.filter((p) => p.kind === "saldo")).toHaveLength(0);
    // Debe 130, pagó 100 → deuda 30 (no −20, que era el bug anterior).
    expect(clientBalance(sales, payments, "c1")).toBeCloseTo(30);
  });
});

describe("addReturn", () => {
  it("restaura stock y recalcula el total de la venta", () => {
    useApp.setState({
      products: [product({ stock: 1 })],
      sales: [
        {
          id: "s1",
          number: 1,
          date: 1,
          items: [{ productId: "p1", name: "Producto", qty: 2, price: 20, cost: 10 }],
          total: 40,
          paymentType: "contado",
        },
      ],
    });

    const record = useApp.getState().addReturn({
      saleId: "s1",
      items: [{ productId: "p1", name: "Producto", qty: 1, price: 20, cost: 10 }],
    });

    expect(record).not.toBeNull();
    const { sales, products } = useApp.getState();
    expect(products[0].stock).toBe(2);
    expect(sales[0].total).toBe(20);
    expect(sales[0].items[0].qty).toBe(1);
  });

  it("rechaza devoluciones inválidas", () => {
    useApp.setState({
      products: [product()],
      sales: [
        {
          id: "s1",
          number: 1,
          date: 1,
          items: [{ productId: "p1", name: "Producto", qty: 1, price: 20, cost: 10 }],
          total: 20,
          paymentType: "contado",
        },
      ],
    });

    const store = useApp.getState();
    expect(
      store.addReturn({
        saleId: "s1",
        items: [{ productId: "p1", name: "Producto", qty: 2, price: 20, cost: 10 }],
      })
    ).toBeNull();
    expect(
      store.addReturn({
        saleId: "s1",
        items: [{ productId: "p2", name: "Otro", qty: 1, price: 20, cost: 10 }],
      })
    ).toBeNull();
  });
});

describe("closeCaja", () => {
  it("solo permite un cierre por día", () => {
    expect(useApp.getState().closeCaja()).not.toBeNull();
    expect(useApp.getState().closeCaja()).toBeNull();
    expect(useApp.getState().cajaCierres).toHaveLength(1);
  });
});

describe("deleteClient", () => {
  it("bloquea el borrado de clientes con deuda", () => {
    useApp.setState({
      sales: [
        {
          id: "s1",
          number: 1,
          date: 1,
          clientId: "c1",
          items: [{ productId: "p1", name: "Producto", qty: 1, price: 100, cost: 10 }],
          total: 100,
          paymentType: "credito",
        },
      ],
    });
    expect(useApp.getState().deleteClient("c1")).toBe(false);
    expect(useApp.getState().clients).toHaveLength(1);
  });

  it("permite borrar clientes al día", () => {
    expect(useApp.getState().deleteClient("c1")).toBe(true);
    expect(useApp.getState().clients).toHaveLength(0);
  });
});

describe("importData", () => {
  it("rechaza JSON inválido o con productos/cliente incorrectos", () => {
    expect(useApp.getState().importData("no es json")).toBe(false);
    expect(useApp.getState().importData(JSON.stringify({ products: "nope" }))).toBe(false);
    expect(useApp.getState().importData(JSON.stringify({ products: [], clients: "nope" }))).toBe(false);
  });

  it("acepta respaldos válidos y normaliza arrays ausentes", () => {
    const ok = useApp
      .getState()
      .importData(JSON.stringify({ products: [product()], clients: [client()], sales: "bad" }));
    expect(ok).toBe(true);
    expect(useApp.getState().products).toHaveLength(1);
    expect(useApp.getState().sales).toEqual([]);
  });
});

describe("pagos bimonetarios", () => {
  it("guarda el monto en USD y el original en Bs", () => {
    useApp.getState().addPayment({
      clientId: "c1",
      amount: 100,
      currency: "bs",
      bsAmount: 3600,
      rate: 36,
    });
    const p = useApp.getState().payments[0];
    expect(p.amount).toBe(100);
    expect(p.currency).toBe("bs");
    expect(p.bsAmount).toBe(3600);
    expect(p.rate).toBe(36);
  });

  it("closeCaja separa los bolívares recibidos", () => {
    useApp.setState({
      sales: [
        {
          id: "s1",
          number: 1,
          date: Date.now(),
          items: [{ productId: "p1", name: "Producto", qty: 1, price: 20, cost: 10 }],
          total: 20,
          paymentType: "contado",
          payCurrency: "bs",
          payRate: 36,
          payBsAmount: 720,
        },
      ],
      payments: [
        { id: "pm1", clientId: "c1", amount: 10, date: Date.now(), currency: "bs", bsAmount: 360, rate: 36 },
      ],
    });

    const cierre = useApp.getState().closeCaja();
    expect(cierre).not.toBeNull();
    expect(cierre!.contadoBs).toBe(720);
    expect(cierre!.cobrosBs).toBe(360);
    expect(cierre!.cajaEsperada).toBeCloseTo(30);
  });
});
