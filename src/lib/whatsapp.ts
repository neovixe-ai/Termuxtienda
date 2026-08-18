import { money, moneyBs } from "./format";

/**
 * Normaliza un teléfono a formato internacional para wa.me.
 * - República Dominicana: 10 dígitos iniciando en 8xx → +1.
 * - Venezuela: 11 dígitos iniciando en 0 (móvil o fijo) → +58.
 */
export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && /^8\d{2}/.test(digits)) {
    return "1" + digits;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return "58" + digits.slice(1);
  }
  return digits;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** Recordatorio de pago con monto y nombre de la tienda. */
export function reminderMessage(storeName: string, clientName: string, amount: number, currency: string): string {
  return (
    `Hola ${clientName} 👋, te saluda ${storeName}.\n\n` +
    `Te recordamos que tienes un saldo pendiente de ${money(amount, currency)}.\n` +
    `Puedes pasar a abonar cuando te sea posible. ¡Gracias por tu preferencia! 🙏`
  );
}

/** Recibo de abono o venta para enviar por WhatsApp. */
export function receiptMessage(
  storeName: string,
  clientName: string,
  amount: number,
  currency: string,
  label = "abono",
  bsAmount?: number
): string {
  const amountText =
    bsAmount != null ? `${moneyBs(bsAmount)} (${money(amount, currency)})` : money(amount, currency);
  return (
    `Hola ${clientName} 👋, te saluda ${storeName}.\n\n` +
    `✅ Recibimos tu ${label} de ${amountText}.\n` +
    `¡Gracias por tu confianza! 🙏`
  );
}
