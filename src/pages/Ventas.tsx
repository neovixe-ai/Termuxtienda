import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useApp } from "../lib/store";
import type { Client, PayCurrency, PaymentType, Product, Sale } from "../lib/types";
import { bsToUsd, formatTime, isToday, money, moneyBs, usdToBs } from "../lib/format";
import { clientSaldoAFavor } from "../lib/selectors";
import { receiptMessage, waLink } from "../lib/whatsapp";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input, Field, Select } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import DevolucionModal from "../components/DevolucionModal";
import { cn } from "../lib/cn";

export default function Ventas() {
  const products = useApp((s) => s.products);
  const clients = useApp((s) => s.clients);
  const sales = useApp((s) => s.sales);
  const payments = useApp((s) => s.payments);
  const currency = useApp((s) => s.settings.currency);
  const storeName = useApp((s) => s.settings.storeName);
  const bcvRate = useApp((s) => s.settings.bcvRate);
  const addSale = useApp((s) => s.addSale);
  const addPayment = useApp((s) => s.addPayment);
  const addClient = useApp((s) => s.addClient);
  const addReturn = useApp((s) => s.addReturn);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [payType, setPayType] = useState<PaymentType>("contado");
  const [clientId, setClientId] = useState("");
  const [initial, setInitial] = useState("");
  const [note, setNote] = useState("");
  const [payCurrency, setPayCurrency] = useState<PayCurrency>("usd");
  const [cashRate, setCashRate] = useState("");
  const [initialCurrency, setInitialCurrency] = useState<PayCurrency>("usd");
  const [initialRate, setInitialRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [doneSale, setDoneSale] = useState<Sale | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort()],
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          (category === "Todas" || p.category === category) &&
          (!q || p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query, category]);

  const lines = useMemo(() => {
    return Object.entries(cart)
      .map(([pid, qty]) => {
        const product = products.find((p) => p.id === pid);
        return product ? { product, qty } : null;
      })
      .filter((l): l is { product: Product; qty: number } => l !== null);
  }, [cart, products]);

  const total = lines.reduce((a, l) => a + l.product.price * l.qty, 0);
  const cashRateNum = parseFloat(cashRate);
  const initialRateNum = parseFloat(initialRate);
  const initialNum = parseFloat(initial);
  const todaySales = useMemo(
    () => sales.filter((s) => isToday(s.date)).sort((a, b) => b.date - a.date),
    [sales]
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const saldoAFavor = useMemo(
    () => (clientId ? clientSaldoAFavor(sales, payments, clientId) : 0),
    [clientId, sales, payments]
  );

  const inCart = (pid: string) => cart[pid] ?? 0;

  const addToCart = (p: Product) => {
    const current = inCart(p.id);
    if (p.stock <= current) return;
    setCart((c) => ({ ...c, [p.id]: current + 1 }));
  };

  const setQty = (pid: string, qty: number) => {
    const product = products.find((p) => p.id === pid);
    const max = product?.stock ?? 0;
    const next = Math.max(1, Math.min(qty, max));
    setCart((c) => ({ ...c, [pid]: next }));
  };

  const removeLine = (pid: string) => {
    setCart((c) => {
      const next = { ...c };
      delete next[pid];
      return next;
    });
  };

  const reset = () => {
    setCart({});
    setPayType("contado");
    setClientId("");
    setInitial("");
    setNote("");
    setPayCurrency("usd");
    setCashRate("");
    setInitialCurrency("usd");
    setInitialRate("");
    setError(null);
  };

  const checkout = () => {
    if (lines.length === 0) {
      setError("Agrega al menos un producto al carrito.");
      return;
    }
    if (payType === "credito" && !clientId) {
      setError("Selecciona un cliente para la venta a crédito.");
      return;
    }
    if (payType === "contado" && payCurrency === "bs" && !(cashRateNum > 0)) {
      setError("Ingresa una tasa BCV válida para cobrar en bolívares.");
      return;
    }
    if (payType === "credito" && initialCurrency === "bs" && initialNum > 0 && !(initialRateNum > 0)) {
      setError("Ingresa una tasa BCV válida para el abono inicial en bolívares.");
      return;
    }
    const contadoInBs = payType === "contado" && payCurrency === "bs" && cashRateNum > 0;
    const sale = addSale({
      items: lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        qty: l.qty,
        price: l.product.price,
        cost: l.product.cost,
      })),
      total,
      paymentType: payType,
      clientId: payType === "credito" ? clientId : undefined,
      note: note.trim() || undefined,
      payCurrency: payType === "contado" ? payCurrency : undefined,
      payRate: contadoInBs ? cashRateNum : undefined,
      payBsAmount: contadoInBs ? usdToBs(total, cashRateNum) : undefined,
    });
    if (payType === "credito") {
      if (initialCurrency === "bs") {
        if (!Number.isNaN(initialNum) && initialNum > 0 && !Number.isNaN(initialRateNum) && initialRateNum > 0) {
          addPayment({
            clientId,
            amount: bsToUsd(initialNum, initialRateNum),
            note: `Abono inicial venta #${sale.number}`,
            currency: "bs",
            bsAmount: initialNum,
            rate: initialRateNum,
          });
        }
      } else if (!Number.isNaN(initialNum) && initialNum > 0) {
        addPayment({
          clientId,
          amount: initialNum,
          note: `Abono inicial venta #${sale.number}`,
          currency: "usd",
        });
      }
    }
    setDoneSale(sale);
    reset();
  };

  return (
    <div>
      <PageHeader
        title="Punto de venta"
        description="Agrega productos al carrito y registra la venta."
      />

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No hay productos para vender"
          description="Crea productos en Inventario para empezar a cobrar."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Catálogo */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar producto…"
                  className="pl-9"
                />
              </div>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-auto min-w-[140px]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No hay resultados.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => {
                  const qty = inCart(p.id);
                  const out = p.stock <= 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      disabled={out || qty >= p.stock}
                      className={cn(
                        "rounded-xl border border-border bg-surface p-3 text-left shadow-card transition-all",
                        !out && qty < p.stock && "hover:-translate-y-0.5 hover:shadow-pop",
                        out && "opacity-50"
                      )}
                    >
                      {p.image && (
                        <div className="mb-2 -mx-3 -mt-3 overflow-hidden rounded-t-xl bg-surface-2">
                          <img src={p.image} alt={p.name} className="h-24 w-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium text-foreground">{p.name}</p>
                        <Badge variant={out ? "danger" : p.stock <= p.minStock ? "warning" : "neutral"}>
                          {p.stock}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted">{p.category}</span>
                        {p.size && (
                          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                            Talla {p.size}
                          </span>
                        )}
                        {p.color && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                            <span className="h-2 w-2 rounded-full bg-current" />
                            {p.color}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-base font-bold tabular-nums text-foreground">
                          {money(p.price, currency)}
                        </span>
                        {qty > 0 && (
                          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                            {qty} en carrito
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carrito */}
          <Card className="flex h-fit flex-col p-5">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
              <ShoppingCart className="h-4 w-4" /> Carrito
            </h2>

            {lines.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                Toca un producto para agregarlo.
              </p>
            ) : (
              <ul className="mb-4 space-y-3">
                {lines.map(({ product, qty }) => (
                  <li key={product.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs tabular-nums text-muted">
                        {money(product.price, currency)} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setQty(product.id, qty - 1)}
                        className="rounded-md border border-border p-1 text-muted hover:bg-surface-2"
                        aria-label="Restar"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold tabular-nums">{qty}</span>
                      <button
                        onClick={() => setQty(product.id, qty + 1)}
                        disabled={qty >= product.stock}
                        className="rounded-md border border-border p-1 text-muted hover:bg-surface-2 disabled:opacity-40"
                        aria-label="Sumar"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeLine(product.id)}
                        className="ml-1 rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label="Quitar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="w-20 text-right text-sm font-semibold tabular-nums text-foreground">
                      {money(product.price * qty, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mb-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Total</span>
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  {money(total, currency)}
                </span>
              </div>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPayType("contado")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  payType === "contado"
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted hover:bg-surface-2"
                )}
              >
                <Banknote className="h-4 w-4" /> Contado
              </button>
              <button
                onClick={() => setPayType("credito")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  payType === "credito"
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted hover:bg-surface-2"
                )}
              >
                <CreditCard className="h-4 w-4" /> Crédito
              </button>
            </div>

            {payType === "contado" && (
              <div className="mb-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPayCurrency("usd")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      payCurrency === "usd"
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-muted hover:bg-surface-2"
                    )}
                  >
                    $ USD
                  </button>
                  <button
                    onClick={() => {
                      setPayCurrency("bs");
                      if (!cashRate) setCashRate(bcvRate != null ? String(bcvRate) : "");
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                      payCurrency === "bs"
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-muted hover:bg-surface-2"
                    )}
                  >
                    Bs Bolívares
                  </button>
                </div>
                {payCurrency === "bs" && (
                  <>
                    <Field label="Tasa BCV (Bs por $)" required hint="Bolívares por 1 dólar.">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.0001"
                        value={cashRate}
                        onChange={(e) => setCashRate(e.target.value)}
                        placeholder="Ej. 36.00"
                      />
                    </Field>
                    {cashRateNum > 0 && (
                      <p className="rounded-lg bg-info/10 px-3 py-2 text-sm font-medium text-info">
                        Cobrarás{" "}
                        <span className="font-bold">{moneyBs(usdToBs(total, cashRateNum))}</span>
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {payType === "credito" && (
              <div className="mb-3 space-y-3">
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-foreground">
                    Cliente <span className="text-danger"> *</span>
                  </span>
                  <div className="flex gap-2">
                    <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                      <option value="">Seleccionar cliente…</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="outline"
                      size="md"
                      className="shrink-0 px-3"
                      onClick={() => setShowNewClient(true)}
                      aria-label="Nuevo cliente"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {saldoAFavor > 0.004 && selectedClient && (
                  <p className="rounded-lg bg-info/10 px-3 py-2 text-sm font-medium text-info">
                    💚 {selectedClient.name} tiene {money(saldoAFavor, currency)} a favor — se
                    aplicará automáticamente a esta venta.
                  </p>
                )}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInitialCurrency("usd")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        initialCurrency === "usd"
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border text-muted hover:bg-surface-2"
                      )}
                    >
                      $ USD
                    </button>
                    <button
                      onClick={() => {
                        setInitialCurrency("bs");
                        if (!initialRate) setInitialRate(bcvRate != null ? String(bcvRate) : "");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        initialCurrency === "bs"
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border text-muted hover:bg-surface-2"
                      )}
                    >
                      Bs Bolívares
                    </button>
                  </div>
                  <Field label={initialCurrency === "bs" ? "Abono inicial (Bs)" : "Abono inicial (USD)"}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={initial}
                      onChange={(e) => setInitial(e.target.value)}
                      placeholder="0.00"
                    />
                  </Field>
                  {initialCurrency === "bs" && (
                    <>
                      <Field label="Tasa BCV (Bs por $)" required hint="Bolívares por 1 dólar.">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.0001"
                          value={initialRate}
                          onChange={(e) => setInitialRate(e.target.value)}
                          placeholder="Ej. 36.00"
                        />
                      </Field>
                      {initialNum > 0 && initialRateNum > 0 && (
                        <p className="rounded-lg bg-info/10 px-3 py-2 text-sm font-medium text-info">
                          Equivale a{" "}
                          <span className="font-bold">{money(bsToUsd(initialNum, initialRateNum), currency)}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <Field label="Nota (opcional)">
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej. Entregar el viernes"
              />
            </Field>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <Button size="lg" fullWidth className="mt-4" onClick={checkout} disabled={lines.length === 0}>
              {payType === "contado" && payCurrency === "bs" && cashRateNum > 0
                ? `Cobrar ${moneyBs(usdToBs(total, cashRateNum))}`
                : `Cobrar ${money(total, currency)}`}
            </Button>
          </Card>
        </div>
      )}

      {/* Últimas ventas de hoy */}
      {todaySales.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">Ventas de hoy</h2>
          <ul className="divide-y divide-border">
            {todaySales.slice(0, 8).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    Venta #{s.number} · {clients.find((c) => c.id === s.clientId)?.name ?? "Cliente general"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatTime(s.date)} · {s.items.length} artículo(s)
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={s.paymentType === "credito" ? "warning" : "success"}>
                    {s.paymentType === "credito" ? "Crédito" : "Contado"}
                  </Badge>
                  {s.payCurrency === "bs" && <Badge variant="info">Bs</Badge>}
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {money(s.total, currency)}
                  </span>
                  <button
                    onClick={() => setReturningSale(s)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Devolver"
                    title="Registrar devolución"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <SuccessModal
        sale={doneSale}
        currency={currency}
        storeName={storeName}
        clientPhone={doneSale?.clientId ? clients.find((c) => c.id === doneSale.clientId)?.phone : undefined}
        clientName={doneSale?.clientId ? clients.find((c) => c.id === doneSale.clientId)?.name : undefined}
        onClose={() => setDoneSale(null)}
      />
      <QuickClientModal
        open={showNewClient}
        onClose={() => setShowNewClient(false)}
        onSave={(c) => {
          setClientId(c.id);
          setShowNewClient(false);
        }}
        addClient={addClient}
      />
      <DevolucionModal
        open={!!returningSale}
        onClose={() => setReturningSale(null)}
        sale={returningSale}
        currency={currency}
        onConfirm={(data) => {
          if (returningSale) addReturn({ saleId: returningSale.id, ...data });
        }}
      />
    </div>
  );
}

function SuccessModal({
  sale,
  currency,
  storeName,
  clientPhone,
  clientName,
  onClose,
}: {
  sale: Sale | null;
  currency: string;
  storeName: string;
  clientPhone?: string;
  clientName?: string;
  onClose: () => void;
}) {
  const receiptHref =
    sale && clientPhone && clientName
      ? waLink(clientPhone, receiptMessage(storeName, clientName, sale.total, currency, "pago"))
      : null;

  return (
    <Modal open={!!sale} onClose={onClose} title="Venta registrada 🎉" size="sm">
      {sale && (
        <div className="space-y-3 text-center">
          <p className="text-4xl font-bold tabular-nums text-foreground">
            {money(sale.total, currency)}
          </p>
          <p className="text-sm text-muted">
            Venta #{sale.number} · {sale.paymentType === "credito" ? "a crédito" : "al contado"}
          </p>
          {sale.payCurrency === "bs" && sale.payBsAmount != null && (
            <p className="text-sm text-muted">
              {moneyBs(sale.payBsAmount)} · tasa {sale.payRate} Bs/$
            </p>
          )}
          {receiptHref && (
            <a
              href={receiptHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-whatsapp/30 transition-all hover:brightness-95 active:scale-[0.97]"
            >
              <MessageCircle className="h-4 w-4" /> Enviar recibo por WhatsApp
            </a>
          )}
          <Button fullWidth onClick={onClose}>
            Nueva venta
          </Button>
        </div>
      )}
    </Modal>
  );
}

function QuickClientModal({
  open,
  onClose,
  onSave,
  addClient,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (c: Client) => void;
  addClient: (c: Omit<Client, "id" | "createdAt">) => Client;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const valid = name.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo cliente"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              const c = addClient({ name: name.trim(), phone: phone.trim() || undefined });
              onSave(c);
            }}
          >
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del cliente" autoFocus />
        </Field>
        <Field label="Teléfono" hint="Con teléfono podrás enviarle recordatorios por WhatsApp.">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" />
        </Field>
      </div>
    </Modal>
  );
}