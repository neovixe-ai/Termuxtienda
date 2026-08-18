// Polyfill mínimo de localStorage para poder instanciar el store en Node.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, String(value));
  }
}

const storage = new MemoryStorage();

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  });
}

// zustand/persist usa `window.localStorage` por defecto, así que también lo exponemos.
if (typeof globalThis.window === "undefined") {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    writable: true,
    configurable: true,
  });
}
