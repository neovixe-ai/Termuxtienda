import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, HandCoins, MessageCircle } from "lucide-react";
import { useApp } from "../lib/store";
import type { Client } from "../lib/types";
import { clientDebt, debtorsList, totalReceivables } from "../lib/selectors";
import { money } from "../lib/format";
import { reminderMessage, waLink } from "../lib/whatsapp";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import AbonoModal from "../components/AbonoModal";

export default function Cobrar() {
  const navigate = useNavigate();
  const clients = useApp((s) => s.clients);
  const sales = useApp((s) => s.sales);
  const payments = useApp((s) => s.payments);
  const currency = useApp((s) => s.settings.currency);
  const storeName = useApp((s) => s.settings.storeName);
  const bcvRate = useApp((s) => s.settings.bcvRate);
  const addPayment = useApp((s) => s.addPayment);

  const [target, setTarget] = useState<Client | null>(null);

  const debtors = useMemo(
    () => debtorsList(clients, sales, payments),
    [clients, sales, payments]
  );

  const total = useMemo(() => totalReceivables(sales, payments), [sales, payments]);

  return (
    <div>
      <PageHeader
        title="Cuentas por cobrar"
        description="Cobros pendientes de tus ventas a crédito."
      />

      <Card className="mb-6 flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted">Total por cobrar</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
            {money(total, currency)}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/15 text-warning">
          <HandCoins className="h-6 w-6" />
        </div>
      </Card>

      {debtors.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="¡Todo al día!"
          description="No tienes cuentas pendientes por cobrar."
        />
      ) : (
        <ul className="space-y-3">
          {debtors.map(({ client, debt }) => (
            <li key={client.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => navigate(`/clientes/${client.id}`)}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{client.name}</p>
                    <p className="text-xs text-muted">{client.phone ?? "Sin teléfono"}</p>
                  </div>
                  <ChevronRight className="ml-1 h-4 w-4 shrink-0 text-muted" />
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold tabular-nums text-warning">
                    {money(debt, currency)}
                  </span>
                  {client.phone && (
                    <a
                      href={waLink(
                        client.phone,
                        reminderMessage(storeName, client.name, debt, currency)
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-whatsapp/15 px-2.5 py-2 text-xs font-semibold text-whatsapp transition-colors hover:bg-whatsapp/25"
                    >
                      <MessageCircle className="h-4 w-4" /> Recordar
                    </a>
                  )}
                  <Button size="sm" onClick={() => setTarget(client)}>
                    <HandCoins className="h-4 w-4" /> Abono
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <AbonoModal
        open={!!target}
        onClose={() => setTarget(null)}
        onSave={(data) => {
          if (target) addPayment({ clientId: target.id, ...data });
        }}
        debt={target ? clientDebt(sales, payments, target.id) : undefined}
        currency={currency}
        clientName={target?.name}
        phone={target?.phone}
        storeName={storeName}
        bcvRate={bcvRate}
      />
    </div>
  );
}
