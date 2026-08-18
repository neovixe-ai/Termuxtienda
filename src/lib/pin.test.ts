import { describe, expect, it } from "vitest";
import { hashPin, isValidPin } from "./pin";

describe("hashPin", () => {
  it("es determinista", () => {
    expect(hashPin("1234")).toBe(hashPin("1234"));
  });

  it("no guarda el PIN en texto plano", () => {
    const h = hashPin("1234");
    expect(h).not.toBe("1234");
    expect(h).not.toContain("1234");
  });

  it("distingue PINs diferentes", () => {
    expect(hashPin("1234")).not.toBe(hashPin("1235"));
  });
});

describe("isValidPin", () => {
  it("acepta de 4 a 6 dígitos", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
  });

  it("rechaza otros valores", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});
