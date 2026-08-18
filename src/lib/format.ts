export function uid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

export function money(amount: number, currency = "$"): string {
  const n = Math.round((amount + Number.EPSILON) * 100) / 100;
  return (
    currency +
    n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

/** Formatea bolívares (moneda secundaria) con el prefijo Bs. */
export function moneyBs(amount: number): string {
  const n = Math.round((amount + Number.EPSILON) * 100) / 100;
  return (
    "Bs " +
    n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

/** Convierte bolívares a dólares usando la tasa BCV (Bs por USD). */
export function bsToUsd(bs: number, rate: number): number {
  return rate > 0 ? bs / rate : 0;
}

/** Convierte dólares a bolívares usando la tasa BCV (Bs por USD). */
export function usdToBs(usd: number, rate: number): number {
  return usd * rate;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(ts: number): string {
  return `${formatDate(ts)} · ${formatTime(ts)}`;
}

export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
}

export function dayLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function isToday(ts: number): boolean {
  return new Date(ts).toDateString() === new Date().toDateString();
}

export function startOfMonth(ts: number = Date.now()): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export function startOfDay(ts: number = Date.now()): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function endOfDay(ts: number = Date.now()): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}
