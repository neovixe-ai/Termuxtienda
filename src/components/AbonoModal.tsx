import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Wallet } from "lucide-react";
import Modal from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input, Field } from "./ui/Input";
import type { PayCurrency } from "../lib/types";
import { bsToUsd, money, moneyBs } from "../lib/format";
import { receiptMessage, waLink } from "../lib/whatsapp";
import { cn } from "../lib/cn";

export default function AbonoModal({
  open,
  onClose,
  onSave,
  debt,
  currency = "$",
  clientName,
  phone,
  storeName,
  bcvRate,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    amount: number;
    note?: string;
    currency?: PayCurrency;
    bsAmount?: number;
    rate?: number;
  }) => void;
  /** Deuda actual del cliente (para avisar si el abono la supera). */
  debt?: number;
  currency?: string;
  clientName?: string;
  phone?: string;
  storeName?: string;
  /** Tasa BCV actual (Bs por USD) para prellenar el formulario. */
  bcvRate?: number;
}) {
  const [mode, setMode] = useState<PayCurrency>("usd");
  const [amount, setAmount] = useState("");
  const [bsAmount, setBsAmount] = useState("");
  const [rate, setRate] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setMode("usd");
      setAmount("");
      setBsAmount("");
      setRate(bcvRate != null && bcvRate > 0 ? String(bcvRate) : "");
      setNote("");
      setSaved(false);
    }
  }, [open, bcvRate]);

  const usdNum = parseFloat(amount);
  const bsNum = parseFloat(bsAmount);
  const rateNum = parseFloat(rate);

  const usdAmount = mode === "bs" ? bsToUsd(bsNum, rateNum) : usdNum;
  const valid =
    mode === "bs"
      ? !Number.isNaN(bsNum) && bsNum > 0 && !Number.isNaN(rateNum) && rateNum > 0
      : !Number.isNaN(usdNum) && usdNum > 0;

  const overpaid = debt !== undefined && valid && usdAmount > debt;
  const remaining = debt !== undefined && valid ? Math.max(0, debt - usdAmount) : undefined;

  const receiptHref =
    phone && valid && storeName
      ? waLink(
          phone,
          receiptMessage(
            storeName,
            clientName ?? "cliente",
            usdAmount,
            currency,
            "abono",
            mode === "bs" ? bsNum : undefined
          )
        )
      : null;

  const handleSave = () => {
    if (!valid) return;
    if (mode === "bs") {
      onSave({ amount: usdAmount, note: note.trim() || undefined, currency: "bs", bsAmount: bsNum, rate: rateNum });
    } else {
      onSave({ amount: usdAmount, note: note.trim() || undefined, currency: "usd" });
    }
    setSaved(true);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={saved ? "Abono guardado ✅" : "Registrar abono"}
      description={
        saved
          ? undefined
          : debt !== undefined && debt > 0.004
            ? `Deuda actual: ${money(debt, currency)}`
            : undefined
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          {saved ? (
            <>
              {receiptHref ? (
                <a
                  href={receiptHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-whatsapp hover:underline"
                >
                  <MessageCircle className="h-4 w-4" /> Enviar recibo
                </a>
              ) : (
                <span />
              )}
              <Button onClick={onClose}>Cerrar</Button>
            </>
          ) : (
            <>
              <span />
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button disabled={!valid} onClick={handleSave}>
                  <Wallet className="h-4 w-4" /> Guardar abono
                </Button>
              </div>
            </>
          )}
        </div>
      }
    >
      {saved ? (
        <div className="space-y-3 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {money(usdAmount, currency)}
          </p>
          {mode === "bs" && (
            <p className="text-sm text-muted">
              {moneyBs(bsNum)} · tasa {rateNum.toLocaleString("es-VE", { maximumFractionDigits: 4 })} Bs/$
            </p>
          )}
          <p className="text-sm text-muted">
            {clientName ? `Abono de ${clientName} registrado.` : "Abono registrado."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMode("usd")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                mode === "usd"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted hover:bg-surface-2"
              )}
            >
              $ USD
            </button>
            <button
              onClick={() => setMode("bs")}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                mode === "bs"
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted hover:bg-surface-2"
              )}
            >
              Bs Bolívares
            </button>
          </div>

          {mode === "usd" ? (
            <Field label="Monto (USD)" required>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </Field>
          ) : (
            <>
              <Field label="Monto (Bs)" required>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={bsAmount}
                  onChange={(e) => setBsAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </Field>
              <Field
                label="Tasa BCV (Bs por $)"
                required
                hint="Bolívares por 1 dólar. Usa la tasa BCV del día del pago."
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.0001"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Ej. 36.00"
                />
              </Field>
              {valid && (
                <p className="rounded-lg bg-info/10 px-3 py-2 text-sm font-medium text-info">
                  Equivale a <span className="font-bold">{money(usdAmount, currency)}</span>
                </p>
              )}
            </>
          )}

          {remaining !== undefined && (
            <p className="text-sm text-muted">
              Quedará pendiente:{" "}
              <span className="font-semibold text-foreground">{money(remaining, currency)}</span>
            </p>
          )}
          {overpaid && (
            <p className="rounded-lg bg-info/10 px-3 py-2 text-sm font-medium text-info">
              Este abono supera la deuda: el excedente quedará como{" "}
              <span className="font-bold">saldo a favor</span> del cliente para su próxima compra.
            </p>
          )}

          <Field label="Nota">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Abono quincenal"
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}
