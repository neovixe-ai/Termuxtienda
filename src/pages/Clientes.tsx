import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Phone, Plus, Search, Users } from "lucide-react";
import { useApp } from "../lib/store";
import type { Client } from "../lib/types";
import { clientDebt, clientSaldoAFavor } from "../lib/selectors";
import { money } from "../lib/format";
import { reminderMessage, waLink } from "../lib/whatsapp";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Input, Field } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";

export default function Clientes() {
  const navigate = useNavigate();
  const clients = useApp((s) => s.clients);
  const sales = useApp((s) => s.sales);
  const payments = useApp((s) => s.payments);
  const currency = useApp((s) => s.settings.currency);
  const storeName = useApp((s) => s.settings.storeName);
  const addClient = useApp((s) => s.addClient);

  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? clients.filter(
          (c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").toLowerCase().includes(q)
        )
      : clients;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, query]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Tu lista de clientes y su estado de cuenta."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nuevo cliente
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay clientes todavía"
          description="Agrega tu primer cliente para poder venderle a crédito."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Nuevo cliente
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const debt = clientDebt(sales, payments, c.id);
            const saldo = clientSaldoAFavor(sales, payments, c.id);
            return (
              <Card
                key={c.id}
                hover
                className="cursor-pointer p-5"
                onClick={() => navigate(`/clientes/${c.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{c.name}</p>
                      {c.phone && (
                        <p className="flex items-center gap-1 text-xs text-muted">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  {debt > 0.004 ? (
                    <Badge variant="warning">{money(debt, currency)}</Badge>
                  ) : saldo > 0.004 ? (
                    <Badge variant="info">A favor {money(saldo, currency)}</Badge>
                  ) : (
                    <Badge variant="success" dot>
                      Al día
                    </Badge>
                  )}
                </div>
                {debt > 0.004 && c.phone && (
                  <a
                    href={waLink(c.phone, reminderMessage(storeName, c.name, debt, currency))}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-whatsapp/15 px-3 py-2 text-sm font-semibold text-whatsapp transition-colors hover:bg-whatsapp/25"
                  >
                    <MessageCircle className="h-4 w-4" /> Recordar pago
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <ClientFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSave={(data) => {
          addClient(data);
          setCreating(false);
        }}
      />
    </div>
  );
}

function ClientFormModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Client, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const valid = name.trim().length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo cliente"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              onSave({
                name: name.trim(),
                phone: phone.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
              });
            }}
          >
            Guardar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del cliente"
            autoFocus
          />
        </Field>
        <Field label="Teléfono">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="809-555-0000" />
        </Field>
        <Field label="Dirección">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, sector…" />
        </Field>
        <Field label="Notas">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
        </Field>
      </div>
    </Modal>
  );
}
