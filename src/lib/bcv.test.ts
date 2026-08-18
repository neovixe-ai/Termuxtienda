import { describe, expect, it } from "vitest";
import { parseBcvResponse } from "./bcv";

describe("parseBcvResponse", () => {
  it("extrae la tasa promedio y la fecha", () => {
    const r = parseBcvResponse({
      promedio: 773.3125,
      fechaActualizacion: "2026-08-18T00:00:00-04:00",
    });
    expect(r.rate).toBeCloseTo(773.3125);
    expect(r.date).toContain("2026-08-18");
  });

  it("rechaza respuestas inválidas o sin tasa", () => {
    expect(() => parseBcvResponse({})).toThrow();
    expect(() => parseBcvResponse(null)).toThrow();
    expect(() => parseBcvResponse({ promedio: 0 })).toThrow();
    expect(() => parseBcvResponse({ promedio: "nope" })).toThrow();
  });
});
