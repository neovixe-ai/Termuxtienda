import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import Modal from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input, Field } from "./ui/Input";
import type { Sale, SaleItem } from "../lib/types";
import { money } from "../lib/format";
import { cn } from "../lib/cn";

export default function DevolucionModal({
  open,
  onClose,
  sale,
  currency,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  currency: string;
  onConfirm: (data: { items: SaleItem[]; reason?: string }) => void;
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open && sale) {
      const initial: Record<string, number> = {};
      for (const item of sale.items) {
        initial[item.productId] = item.qty;
      }
      setSelected(initial);
      setReason("");
    }
  }, [open, sale]);

  if (!sale) return null;

  const items = sale.items;
  const total = items.reduce(
    (acc, item) => acc + item.price * (selected[item.productId] ?? 0),
    0
  );
  const anySelected = items.some((item) => (selected[item.productId] ?? 0) > 0);

  const setQty = (productId: string, qty: number) => {
    const item = items.find((i) => i.productId === productId);
    const max = item?.qty ?? 0;
    setSelected((s) => ({ ...s, [productId]: Math.max(0, Math.min(qty, max)) }));
  };

  const toggleAll = () => {
    const all = items.every((i) => (selected[i.productId] ?? 0) === i.qty);
    if (all) {
      const none: Record<string, number> = {};
      for (const item of items) none[item.productId] = 0;
      setSelected(none);
    } else {
      const full: Record<string, number> = {};
      for (const item of items) full[item.productId] = item.qty;
      setSelected(full);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Devolución · Venta #${sale.number}`}
      description="Selecciona los artículos a devolver. El stock se restaura automáticamente."
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            A devolver: <span className="font-bold text-foreground">{money(total, currency)}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={!anySelected}
              onClick={() => {
                onConfirm({
                  items: items
                    .map((item) => ({ ...item, qty: selected[item.productId] ?? 0 }))
                    .filter((item) => item.qty > 0),
                  reason: reason.trim() || undefined,
                });
                onClose();
              }}
            >
              <RotateCcw className="h-4 w-4" /> Registrar devolución
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={toggleAll}>
            {items.every((i) => (selected[i.productId] ?? 0) === i.qty)
              ? "Quitar todo"
              : "Seleccionar todo"}
          </Button>
        </div>
        <ul className="space-y-2">
          {items.map((item) => {
            const qty = selected[item.productId] ?? 0;
            return (
              <li
                key={item.productId}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors",
                  qty > 0 ? "border-danger/40 bg-danger/5" : "border-border"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {money(item.price, currency)} c/u · vendido: {item.qty}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQty(item.productId, qty - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-2"
                    aria-label="Restar"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty(item.productId, qty + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted hover:bg-surface-2"
                    aria-label="Sumar"
                  >
                    +
                  </button>
                </div>
                <span className="w-20 text-right text-sm font-semibold tabular-nums text-foreground">
                  {money(item.price * qty, currency)}
                </span>
              </li>
            );
          })}
        </ul>
        <Field label="Motivo (opcional)">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. Talla incorrecta, cliente no conforme…"
          />
        </Field>
      </div>
    </Modal>
  );
}