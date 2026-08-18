import { useMemo, useState } from "react";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import { useApp } from "../lib/store";
import type { Product } from "../lib/types";
import { formatDateTime, money } from "../lib/format";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Field, Select } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";

interface Row {
  key: number;
  productId: string;
  qty: string;
  unitCost: string;
}

export default function Compras() {
  const products = useApp((s) => s.products);
  const purchases = useApp((s) => s.purchases);
  const currency = useApp((s) => s.settings.currency);
  const addPurchase = useApp((s) => s.addPurchase);

  const [open, setOpen] = useState(false);

  const sorted = useMemo(() => [...purchases].sort((a, b) => b.date - a.date), [purchases]);

  return (
    <div>
      <PageHeader
        title="Compras"
        description="Entradas de mercancía para reponer inventario."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Registrar compra
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Sin compras registradas"
          description="Registra las compras de mercancía para aumentar tu inventario."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Registrar compra
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((p) => (
            <li key={p.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {p.supplier || "Compra de mercancía"}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(p.date)} · {p.items.reduce((a, i) => a + i.qty, 0)} unidad(es)
                    </p>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {money(p.total, currency)}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm text-muted">
                  {p.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <PurchaseModal
        open={open}
        onClose={() => setOpen(false)}
        products={products}
        currency={currency}
        onSave={(data) => {
          addPurchase(data);
          setOpen(false);
        }}
      />
    </div>
  );
}

function PurchaseModal({
  open,
  onClose,
  products,
  currency,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  products: Product[];
  currency: string;
  onSave: (data: { supplier?: string; items: { productId?: string; name: string; qty: number; unitCost: number }[]; note?: string }) => void;
}) {
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Row[]>([{ key: 0, productId: "", qty: "1", unitCost: "" }]);
  const [key, setKey] = useState(1);

  const addRow = () => {
    setRows((r) => [...r, { key, productId: "", qty: "1", unitCost: "" }]);
    setKey((k) => k + 1);
  };

  const updateRow = (keyId: number, patch: Partial<Row>) => {
    setRows((r) => r.map((row) => (row.key === keyId ? { ...row, ...patch } : row)));
  };

  const removeRow = (keyId: number) => {
    setRows((r) => (r.length === 1 ? r : r.filter((row) => row.key !== keyId)));
  };

  const onSelectProduct = (keyId: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    updateRow(keyId, { productId, unitCost: product ? String(product.cost) : "" });
  };

  const parsedRows = rows
    .map((row) => {
      const product = products.find((p) => p.id === row.productId);
      const qty = parseFloat(row.qty);
      const unitCost = parseFloat(row.unitCost);
      if (!product || Number.isNaN(qty) || qty <= 0 || Number.isNaN(unitCost) || unitCost < 0) {
        return null;
      }
      return { productId: product.id, name: product.name, qty, unitCost };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const total = parsedRows.reduce((a, r) => a + r.qty * r.unitCost, 0);
  const valid = parsedRows.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar compra"
      size="lg"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            Total: <span className="font-bold text-foreground">{money(total, currency)}</span>
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!valid}
              onClick={() =>
                onSave({
                  supplier: supplier.trim() || undefined,
                  note: note.trim() || undefined,
                  items: parsedRows,
                })
              }
            >
              <PackagePlus className="h-4 w-4" /> Guardar compra
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Proveedor">
            <Input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej. Distribuidora Moda RD"
            />
          </Field>
          <Field label="Nota">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Productos</span>
            <Button size="sm" variant="outline" onClick={addRow}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.key} className="grid grid-cols-[1fr_4.5rem_6rem_2rem] items-center gap-2">
                <Select
                  value={row.productId}
                  onChange={(e) => onSelectProduct(row.key, e.target.value)}
                >
                  <option value="">Seleccionar producto…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={row.qty}
                  onChange={(e) => updateRow(row.key, { qty: e.target.value })}
                  aria-label="Cantidad"
                />
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={row.unitCost}
                  onChange={(e) => updateRow(row.key, { unitCost: e.target.value })}
                  placeholder="Costo"
                  aria-label="Costo unitario"
                />
                <button
                  onClick={() => removeRow(row.key)}
                  className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  aria-label="Quitar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {products.length === 0 && (
            <p className="mt-2 text-xs text-warning">
              No tienes productos todavía. Crea primero los productos en Inventario.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
