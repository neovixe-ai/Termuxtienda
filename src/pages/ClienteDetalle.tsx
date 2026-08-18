import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  HandCoins,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { useApp } from "../lib/store";
import type { Client, Sale } from "../lib/types";
import {
  clientCreditTotal,
  clientDebt,
  clientPaid,
  clientSaldoAFavor,
} from "../lib/selectors";
import { formatDateTime, money, moneyBs } from "../lib/format";
import { reminderMessage, waLink } from "../lib/whatsapp";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input, Field } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import AbonoModal from "../components/AbonoModal";
import DevolucionModal from "../components/DevolucionModal";

export default function ClienteDetalle() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const client = useApp((s) => s.clients.find((c) => c.id === id));
  const sales = useApp((s) => s.sales);
  const payments = useApp((s) => s.payments);
  const currency = useApp((s) => s.settings.currency);
  const storeName = useApp((s) => s.settings.storeName);
  const bcvRate = useApp((s) => s.settings.bcvRate);
  const updateClient = useApp((s) => s.updateClient);
  const deleteClient = useApp((s) => s.deleteClient);
  const addPayment = useApp((s) => s.addPayment);
  const addReturn = useApp((s) => s.addReturn);

  const [paying, setPaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toDelete, setToDelete] = useState(false);
  const [returningSale, setReturningSale] = useState<Sale | null>(null);

  const debt = useMemo(() => (client ? clientDebt(sales, payments, client.id) : 0), [client, sales, payments]);
  const saldo = useMemo(
    () => (client ? clientSaldoAFavor(sales, payments, client.id) : 0),
    [client, sales, payments]
  );
  const creditTotal = useMemo(
    () => (client ? clientCreditTotal(sales, client.id) : 0),
    [client, sales]
  );
  const paid = useMemo(() => (client ? clientPaid(payments, client.id) : 0), [client, payments]);
  const clientSales = useMemo(
    () =>
      sales
        .filter((s) => s.clientId === client?.id && s.paymentType === "credito")
        .sort((a, b) => b.date - a.date),
    [sales, client]
  );
  const clientPayments = useMemo(
    () => payments.filter((p) => p.clientId === client?.id).sort((a, b) => b.date - a.date),
    [payments, client]
  );

  if (!client) {
    return (
      <EmptyState
        icon={UserRound}
        title="Cliente no encontrado"
        description="Este cliente ya no existe o el enlace no es válido."
        action={
          <Button onClick={() => navigate("/clientes")}>
            <ArrowLeft className="h-4 w-4" /> Volver a clientes
          </Button>
        }
      />
    );
  }

  const reminderHref =
    client.phone && debt > 0.004
      ? waLink(client.phone, reminderMessage(storeName, client.name, debt, currency))
      : null;
  const chatHref = client.phone ? waLink(client.phone, `Hola ${client.name} 👋, te saluda ${storeName}.`) : null;

  return (
    <div>
      <button
        onClick={() => navigate("/clientes")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Clientes
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-xl font-bold text-primary">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{client.name}</h1>
              {debt > 0.004 ? (
                <Badge variant="warning" dot>
                  Debe {money(debt, currency)}
                </Badge>
              ) : saldo > 0.004 ? (
                <Badge variant="info" dot>
                  A favor {money(saldo, currency)}
                </Badge>
              ) : (
                <Badge variant="success" dot>
                  Al día
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
              {client.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> {client.phone}
                </span>
              )}
              {client.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {client.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button
            variant="outline"
            disabled={debt > 0.004}
            title={debt > 0.004 ? "No se puede eliminar: tiene deuda pendiente" : "Eliminar cliente"}
            onClick={() => setToDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          {chatHref && (
            <a href={chatHref} target="_blank" rel="noreferrer">
              <Button variant="whatsapp">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </a>
          )}
          {reminderHref && (
            <a href={reminderHref} target="_blank" rel="noreferrer">
              <Button variant="whatsapp">
                <MessageCircle className="h-4 w-4" /> Recordar pago
              </Button>
            </a>
          )}
          <Button onClick={() => setPaying(true)}>
            <HandCoins className="h-4 w-4" /> Registrar abono
          </Button>
        </div>
      </div>

      {saldo > 0.004 && (
        <div className="mb-6 rounded-xl border border-info/30 bg-info/10 px-4 py-3 text-sm text-info">
          💚 {client.name} tiene <span className="font-bold">{money(saldo, currency)}</span> a favor.
          Se aplicará automáticamente en su próxima venta a crédito.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-muted">Deuda actual</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{money(debt, currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted">Total a crédito</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {money(creditTotal, currency)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted">Total abonado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-success">{money(paid, currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted">Saldo a favor</p>
          <p
            className={
              saldo > 0.004
                ? "mt-1 text-2xl font-bold tabular-nums text-info"
                : "mt-1 text-2xl font-bold tabular-nums text-muted"
            }
          >
            {money(saldo, currency)}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">Ventas a crédito</h2>
          {clientSales.length === 0 ? (
            <p className="text-sm text-muted">Este cliente no tiene ventas a crédito.</p>
          ) : (
            <ul className="divide-y divide-border">
              {clientSales.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Venta #{s.number}</p>
                    <p className="text-xs text-muted">{formatDateTime(s.date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
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
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">Abonos</h2>
          {clientPayments.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay abonos registrados.</p>
          ) : (
            <ul className="divide-y divide-border">
              {clientPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.kind === "saldo" ? "Saldo a favor aplicado" : p.note || "Abono"}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(p.date)}
                      {p.currency === "bs" && p.bsAmount != null && p.rate != null && (
                        <> · {moneyBs(p.bsAmount)} @ {p.rate} Bs/$</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {p.kind === "saldo" && <Badge variant="info">Saldo</Badge>}
                    <span className="text-sm font-semibold tabular-nums text-success">
                      +{money(p.amount, currency)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {client.notes && (
        <Card className="mt-6 p-5">
          <h2 className="mb-2 text-base font-semibold text-foreground">Notas</h2>
          <p className="text-sm text-muted">{client.notes}</p>
        </Card>
      )}

      <AbonoModal
        open={paying}
        onClose={() => setPaying(false)}
        onSave={(data) => {
          addPayment({ clientId: client.id, ...data });
        }}
        debt={debt}
        currency={currency}
        clientName={client.name}
        phone={client.phone}
        storeName={storeName}
        bcvRate={bcvRate}
      />
      <EditClientModal
        open={editing}
        onClose={() => setEditing(false)}
        initial={client}
        onSave={(data) => {
          updateClient(client.id, data);
          setEditing(false);
        }}
      />
      <ConfirmDialog
        open={toDelete}
        onClose={() => setToDelete(false)}
        title="Eliminar cliente"
        description={`¿Seguro que quieres eliminar a ${client.name}? Sus ventas e historial se conservarán, pero ya no aparecerá en la lista.`}
        onConfirm={() => {
          if (deleteClient(client.id)) navigate("/clientes");
        }}
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

function EditClientModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Client;
  onSave: (data: Omit<Client, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const valid = name.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar cliente"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onSave({
                name: name.trim(),
                phone: phone.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Teléfono" hint="Con teléfono podrás enviar recordatorios por WhatsApp.">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Dirección">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>
        <Field label="Notas">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
