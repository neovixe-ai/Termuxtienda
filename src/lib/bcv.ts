const BCV_ENDPOINT = "https://ve.dolarapi.com/v1/dolares/oficial";

export interface BcvRate {
  /** Bolívares por 1 dólar (tasa BCV oficial). */
  rate: number;
  /** Fecha de actualización publicada por la fuente (ISO). */
  date: string;
}

/**
 * Parsea la respuesta de la API pública de la tasa BCV (DolarApi).
 * Se mantiene como función pura para poder testearla sin red.
 */
export function parseBcvResponse(data: unknown): BcvRate {
  const obj = (data ?? {}) as Record<string, unknown>;
  const rate = Number(obj.promedio);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("La fuente no devolvió una tasa BCV válida.");
  }
  return {
    rate,
    date: typeof obj.fechaActualizacion === "string" ? obj.fechaActualizacion : "",
  };
}

/** Consulta la tasa BCV oficial del día desde una API pública y gratuita. */
export async function fetchBcvRate(): Promise<BcvRate> {
  const res = await fetch(BCV_ENDPOINT, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error("No se pudo consultar la tasa BCV.");
  return parseBcvResponse(await res.json());
}
