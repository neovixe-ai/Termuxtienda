/**
 * Hash determinista (cyrb53) para guardar el PIN sin texto plano.
 * Es una barrera local de acceso, no un mecanismo criptográfico de banca.
 */
export function hashPin(pin: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < pin.length; i++) {
    const ch = pin.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** Valida que el PIN tenga de 4 a 6 dígitos. */
export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
