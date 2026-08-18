import { describe, expect, it } from "vitest";
import { bsToUsd, endOfDay, money, moneyBs, startOfDay, uid, usdToBs } from "./format";

describe("money", () => {
  it("usa dos decimales y antepone la moneda", () => {
    const out = money(1234.5, "$");
    expect(out.startsWith("$1")).toBe(true);
    expect(out.endsWith(".50")).toBe(true);
  });

  it("corrige el error de punto flotante", () => {
    expect(money(0.1 + 0.2, "$")).toBe("$0.30");
  });

  it("redondea al centavo más cercano", () => {
    expect(money(1.005, "$")).toBe("$1.01");
    expect(money(1.004, "$")).toBe("$1.00");
  });
});

describe("bolívares", () => {
  it("convierte entre USD y Bs usando la tasa BCV", () => {
    expect(bsToUsd(3600, 36)).toBeCloseTo(100);
    expect(usdToBs(100, 36)).toBeCloseTo(3600);
    expect(bsToUsd(100, 0)).toBe(0); // tasa inválida → 0
  });

  it("formatea bolívares con prefijo Bs", () => {
    const out = moneyBs(3600);
    expect(out.startsWith("Bs ")).toBe(true);
    expect(out).toMatch(/3\.?600/);
  });
});

describe("uid", () => {
  it("genera ids únicos", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBe(100);
  });
});

describe("límites del día", () => {
  it("startOfDay y endOfDay delimitan el día local", () => {
    const ts = new Date(2026, 0, 15, 13, 30, 45).getTime();
    expect(new Date(startOfDay(ts)).getHours()).toBe(0);
    expect(new Date(startOfDay(ts)).getMinutes()).toBe(0);

    const end = new Date(endOfDay(ts));
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getTime()).toBeGreaterThan(startOfDay(ts));
  });
});
