import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  HandCoins,
  Landmark,
  MessageCircle,
  Plus,
  Shirt,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../lib/store";
import { dayLabel, formatTime, isToday, money, moneyBs, shortDate, startOfMonth } from "../lib/format";
import { debtorsList, salesProfit, totalReceivables } from "../lib/selectors";
import { reminderMessage, waLink } from "../lib/whatsapp";
import { useThemeColors } from "../lib/useThemeColors";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { StatCard } from "../components/ui/StatCard";
import { EmptyState } from "../components/ui/EmptyState";

export default function Dashboard() {
  const products = useApp((s) => s.products);
  const sales = useApp((s) => s.sales);
  const payments = useApp((s) => s.payments);
  const clients = useApp((s) => s.clients);
  const cajaCierres = useApp((s) => s.cajaCierres);
  const closeCaja = useApp((s) => s.closeCaja);
  const currency = useApp((s) => s.settings.currency);
  const storeName = useApp((s) => s.settings.storeName);
  const colors = useThemeColors();

  const todaySales = useMemo(() => sales.filter((s) => isToday(s.date)), [sales]);
  const todayTotal = todaySales.reduce((a, s) => a + s.total, 0);

  const yesterdayTotal = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return sales
      .filter((s) => new Date(s.date).toDateString() === y.toDateString())
      .reduce((a, s) => a + s.total, 0);
  }, [sales]);

  const monthSales = useMemo(() => sales.filter((s) => s.date >= startOfMonth()), [sales]);
  const monthTotal = monthSales.reduce((a, s) => a + s.total, 0);
  const monthProfit = useMemo(() => salesProfit(monthSales), [monthSales]);

  const receivable = useMemo(() => totalReceivables(sales, payments), [sales, payments]);
  const debtors = useMemo(() => debtorsList(clients, sales, payments), [clients, sales, payments]);
  const lowStock = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).sort((a, b) => a.stock - b.stock),
    [products]
  );
  const recent = useMemo(() => [...sales].sort((a, b) => b.date - a.date).slice(0, 6), [sales]);

  // Ventas por día (últimos 7 días)
  const chartData = useMemo(() => {
    const days: Array<{ label: string; total: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const total = sales
        .filter((s) => s.date >= d.getTime() && s.date < next.getTime())
        .reduce((a, s) => a + s.total, 0);
      days.push({ label: shortDate(d.getTime()), total });
    }
    return days;
  }, [sales]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const todayContado = todaySales.filter((s) => s.paymentType === "contado").reduce((a, s) => a + s.total, 0);
  const todayCredito = todaySales.filter((s) => s.paymentType === "credito").reduce((a, s) => a + s.total, 0);
  const todayCobros = payments
    .filter((p) => p.kind !== "saldo" && p.date >= todayStart)
    .reduce((a, p) => a + p.amount, 0);
  const todayContadoBs = todaySales
    .filter((s) => s.paymentType === "contado" && s.payCurrency === "bs")
    .reduce((a, s) => a + (s.payBsAmount ?? 0), 0);
  const todayCobrosBs = payments
    .filter((p) => p.kind !== "saldo" && p.currency === "bs" && p.date >= todayStart)
    .reduce((a, p) => a + (p.bsAmount ?? 0), 0);

  const closedToday = useMemo(
    () => cajaCierres.find((c) => c.date === todayStart),
    [cajaCierres, todayStart]
  );

  const clientName = (id?: string) => clients.find((c) => c.id === id)?.name ?? "Sin cliente";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {dayLabel(Date.now())}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">
            Hola 👋, {storeName}
          </h1>
          <p className="mt-1 text-sm text-muted">Resumen de tu tienda hoy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/cobrar">
            <Button variant="outline">
              <HandCoins className="h-4 w-4" /> Cobrar
              {debtors.length > 0 && (
                <span className="rounded-full bg-warning/15 px-1.5 text-xs font-bold text-warning">
                  {debtors.length}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/clientes">
            <Button variant="outline">
              <Users className="h-4 w-4" /> Cliente
            </Button>
          </Link>
          <Link to="/ventas">
            <Button>
              <Plus className="h-4 w-4" /> Nueva venta
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas de hoy"
          value={money(todayTotal, currency)}
          delta={`${todaySales.length} venta(s)`}
          sub={yesterdayTotal > 0 ? `vs ${money(yesterdayTotal, currency)} ayer` : undefined}
          icon={ShoppingCart}
          tone="primary"
        />
        <StatCard
          label="Ventas del mes"
          value={money(monthTotal, currency)}
          delta={`Ganancia ~${money(monthProfit, currency)}`}
          sub={`${monthSales.length} venta(s)`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Por cobrar"
          value={money(receivable, currency)}
          delta={`${debtors.length} deudor(es)`}
          sub="Cuentas a crédito"
          icon={HandCoins}
          tone="warning"
        />
        <StatCard
          label="Productos"
          value={String(products.length)}
          delta={`${lowStock.length} stock bajo`}
          sub="En inventario"
          icon={Shirt}
          tone="info"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Ventas últimos 7 días</h2>
              <Link to="/reportes" className="text-sm font-medium text-primary hover:underline">
                Ver reportes
              </Link>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.borderColor ?? "transparent"} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: colors.muted }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: colors.muted }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tickFormatter={(v: number) => money(v, "").replace(/\.00$/, "")}
                  />
                  <Tooltip
                    cursor={{ fill: colors.primarySoft }}
                    contentStyle={{
                      borderRadius: 12,
                      border: `1px solid ${colors.borderColor ?? "transparent"}`,
                      background: colors.surface ?? "#ffffff",
                      fontSize: 13,
                    }}
                    formatter={(value) => [money(Number(value), currency), "Ventas"]}
                  />
                  <Bar dataKey="total" fill={colors.primary} radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Últimas ventas</h2>
              <Link to="/ventas" className="text-sm font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Aún no hay ventas"
                description="Registra tu primera venta desde el punto de venta."
                action={
                  <Link to="/ventas">
                    <Button>Nueva venta</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        Venta #{s.number} · {clientName(s.clientId)}
                      </p>
                      <p className="text-xs text-muted">
                        {formatTime(s.date)} · {s.items.length} artículo(s)
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={s.paymentType === "credito" ? "warning" : "success"} dot>
                        {s.paymentType === "credito" ? "Crédito" : "Contado"}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {money(s.total, currency)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Deudores top</h2>
              <Link to="/cobrar" className="text-sm font-medium text-primary hover:underline">
                Cobrar
              </Link>
            </div>
            {debtors.length === 0 ? (
              <p className="text-sm text-muted">¡Todo al día! 🎉</p>
            ) : (
              <ul className="space-y-3">
                {debtors.slice(0, 4).map(({ client, debt }) => (
                  <li key={client.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{client.name}</p>
                      <p className="text-xs font-semibold tabular-nums text-warning">
                        {money(debt, currency)}
                      </p>
                    </div>
                    {client.phone && (
                      <a
                        href={waLink(
                          client.phone,
                          reminderMessage(storeName, client.name, debt, currency)
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-whatsapp/15 px-2.5 py-1.5 text-xs font-semibold text-whatsapp transition-colors hover:bg-whatsapp/25"
                        title="Recordar pago por WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Recordar
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Stock bajo</h2>
              <Link to="/inventario" className="text-sm font-medium text-primary hover:underline">
                Inventario
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted">Todo el inventario está en orden. 🎉</p>
            ) : (
              <ul className="space-y-3">
                {lowStock.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted">{p.category}</p>
                    </div>
                    <Badge variant={p.stock === 0 ? "danger" : "warning"} dot>
                      {p.stock === 0 ? "Agotado" : `${p.stock} disp.`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Cierre de caja */}
          <Card className="overflow-hidden">
            <div className="bg-primary-gradient px-5 py-4 text-white">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                <h2 className="text-base font-semibold">Cierre de caja · hoy</h2>
              </div>
              {closedToday ? (
                <p className="mt-1 text-xs text-white/80">
                  Cerrado a las {formatTime(closedToday.createdAt)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-white/80">Aún no cierras el día.</p>
              )}
            </div>
            <div className="space-y-3 p-5">
              <Row label="Ventas de contado" value={money(todayContado, currency)} tone="success" />
              {todayContadoBs > 0 && (
                <Row label="· en bolívares" value={moneyBs(todayContadoBs)} tone="success" />
              )}
              <Row label="Cobros recibidos" value={money(todayCobros, currency)} tone="success" />
              {todayCobrosBs > 0 && (
                <Row label="· en bolívares" value={moneyBs(todayCobrosBs)} tone="success" />
              )}
              <div className="border-t border-border pt-3">
                <Row
                  label="Efectivo esperado"
                  value={money(todayContado + todayCobros, currency)}
                  tone="primary"
                  strong
                />
              </div>
              <Row label="Ventas a crédito" value={money(todayCredito, currency)} tone="warning" />
              <Button
                fullWidth
                variant="outline"
                disabled={!!closedToday}
                onClick={() => closeCaja()}
                className="mt-2"
              >
                <Banknote className="h-4 w-4" />
                {closedToday ? "Día cerrado ✓" : "Cerrar día"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "primary";
  strong?: boolean;
}) {
  const color =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-primary";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${strong ? "text-foreground" : color}`}>
        {value}
      </span>
    </div>
  );
}
