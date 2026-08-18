import { describe, expect, it } from "vitest";
import { receiptMessage, reminderMessage, waLink, waNumber } from "./whatsapp";

describe("waNumber", () => {
  it("agrega el código +1 a números dominicanos de 10 dígitos", () => {
    expect(waNumber("809-555-0101")).toBe("18095550101");
    expect(waNumber("(829) 555-0142")).toBe("18295550142");
    expect(waNumber("8495550199")).toBe("18495550199");
  });

  it("agrega el código +58 a números venezolanos", () => {
    expect(waNumber("0412-123-4567")).toBe("584121234567");
    expect(waNumber("0212-555-1212")).toBe("582125551212");
  });

  it("conserva otros formatos", () => {
    expect(waNumber("+1 809-555-0101")).toBe("18095550101");
    expect(waNumber("+58 412 1234567")).toBe("584121234567");
    // 10 dígitos que no empiezan en 8xx → se deja tal cual.
    expect(waNumber("5512345678")).toBe("5512345678");
  });
});

describe("mensajes", () => {
  it("incluye monto y nombre de la tienda", () => {
    const msg = reminderMessage("MiTienda", "Ana", 1500, "$");
    expect(msg).toContain("MiTienda");
    expect(msg).toContain("Ana");
    expect(msg).toMatch(/1,?500\.00/);
  });

  it("genera un enlace wa.me con el texto codificado", () => {
    const link = waLink("8095550101", "Hola mundo");
    expect(link).toContain("https://wa.me/18095550101?text=");
    expect(link).toContain(encodeURIComponent("Hola mundo"));
  });

  it("construye recibos con el monto", () => {
    const msg = receiptMessage("MiTienda", "Ana", 500, "$", "pago");
    expect(msg).toContain("pago");
    expect(msg).toMatch(/500\.00/);
  });

  it("incluye el monto en Bs cuando es un pago bimonetario", () => {
    const msg = receiptMessage("MiTienda", "Ana", 100, "$", "abono", 3600);
    expect(msg).toContain("Bs");
    expect(msg).toContain("$100.00");
  });
});
