import { useMemo, type ReactNode } from "react";
import {
  Banknote,
  CreditCard,
  HandCoins,
  ReceiptText,
  Shirt,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../lib/store";
import { money, shortDate } from "../lib/format";
import { paymentTypeTotals, salesProfit, totalReceivables } from "../lib/selectors";
import { useThemeColors } from "../lib/useThemeColors";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { EmptyState } from "../components/ui/EmptyState";

const PALETTE = ["primary", "info", "warning", "success", "danger"] as const;

export default function Reportes() {
  const products = useApp((s) => s.products);
  const clients = useApp((s) => s.clients);
  const sales = useApp((s) => s.sales);
  const payments = useApp((s) => s.payments);
  const currency = useApp((s) => s.settings.currency);
  const colors = useThemeColors();

  const colorOf = (name: (typeof PALETTE)[number]) => colors[name];

  const last30From = useMemo(() => Date.now() - 30 * 24 * 60 * 60 * 1000, []);
  const last30 = useMemo(
    () => sales.filter((s) => s.date >= last30From),
    [sales, last30From]
  );

  const total30 = last30.reduce((a, s) => a + s.total, 0);
  const profit30 = useMemo(() => salesProfit(last30), [last30]);
  const receivable = useMemo(() => totalReceivables(sales, payments), [sales, payments]);
  const ticket = last30.length > 0 ? total30 / last30.length : 0;
  const split = useMemo(() => paymentTypeTotals(last30), [last30]);
  const cobros30 = useMemo(
    () =>
      payments
        .filter((p) => p.kind !== "saldo" && p.date >= last30From)
        .reduce((a, p) => a + p.amount, 0),
    [payments, last30From]
  );

  // Últimos 14 días
  const chartData = useMemo(() => {
    const days: Array<{ label: string; total: number }> = [];
    for (let i = 13; i >= 0; i--) {
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

  // Ventas por categoría (según el producto actual)
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) {
      for (const item of s.items) {
        const product = products.find((p) => p.id === item.productId);
        const cat = product?.category || "General";
        map.set(cat, (map.get(cat) ?? 0) + item.price * item.qty);
      }
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales, products]);

  // Top productos por unidades vendidas
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const s of sales) {
      for (const item of s.items) {
        const cur = map.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
        cur.qty += item.qty;
        cur.revenue += item.price * item.qty;
        map.set(item.productId, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales]);

  // Top clientes por compras totales
  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; total: number }>();
    for (const s of sales) {
      if (!s.clientId) continue;
      const client = clients.find((c) => c.id === s.clientId);
      const cur = map.get(s.clientId) ?? { name: client?.name ?? "Cliente", total: 0 };
      cur.total += s.total;
      map.set(s.clientId, cur);
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [sales, clients]);

  const maxQty = topProducts[0]?.qty ?? 1;
  const maxClient = topClients[0]?.total ?? 1;

  const tooltipStyle = {
    borderRadius: 12,
    border: `1px solid ${colors.borderColor}`,
    background: colors.surface,
    fontSize: 13,
  };

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Analiza el desempeño de tu tienda para tomar mejores decisiones."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas últimos 30 días"
          value={money(total30, currency)}
          delta={`${last30.length} venta(s)`}
          icon={TrendingUp}
          tone="primary"
        />
        <StatCard
          label="Ganancia estimada"
          value={money(profit30, currency)}
          delta="Ventas − costo"
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="Por cobrar"
          value={money(receivable, currency)}
          delta="Cartera a crédito"
          icon={HandCoins}
          tone="warning"
        />
        <StatCard
          label="Ticket promedio"
          value={money(ticket, currency)}
          delta={`${split.contado > 0 ? Math.round((split.contado / (split.contado + split.credito)) * 100) : 0}% contado`}
          sub="Por venta"
          icon={ReceiptText}
          tone="info"
        />
      </div>

      {sales.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Shirt}
            title="Sin datos todavía"
            description="Registra ventas para ver reportes y gráficas de tu tienda."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="p-5 lg:col-span-2">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                Ventas últimos 14 días
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.borderColor} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: colors.muted }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
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
                      contentStyle={tooltipStyle}
                      formatter={(value) => [money(Number(value), currency), "Ventas"]}
                    />
                    <Bar dataKey="total" fill={colors.primary} radius={[6, 6, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-base font-semibold text-foreground">Forma de pago</h2>
              <div className="space-y-4">
                <SplitRow
                  icon={<Banknote className="h-4 w-4" />}
                  label="Contado"
                  amount={split.contado}
                  total={split.contado + split.credito}
                  currency={currency}
                  color={colors.primary}
                />
                <SplitRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Crédito"
                  amount={split.credito}
                  total={split.contado + split.credito}
                  currency={currency}
                  color={colors.warning}
                />
                <div className="border-t border-border pt-3">
                  <SplitRow
                    icon={<HandCoins className="h-4 w-4" />}
                    label="Cobrado por abonos"
                    amount={cobros30}
                    total={split.contado + split.credito}
                    currency={currency}
                    color={colors.success}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="p-5">
              <h2 className="mb-2 text-base font-semibold text-foreground">Ventas por categoría</h2>
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted">Sin datos.</p>
              ) : (
                <>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={byCategory}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={70}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {byCategory.map((_, i) => (
                            <Cell key={i} fill={colorOf(PALETTE[i % PALETTE.length])} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value) => [money(Number(value), currency), ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {byCategory.slice(0, 5).map((c, i) => (
                      <li key={c.name} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 text-muted">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: colorOf(PALETTE[i % PALETTE.length]) }}
                          />
                          {c.name}
                        </span>
                        <span className="font-semibold tabular-nums text-foreground">
                          {money(c.value, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <Trophy className="h-4 w-4 text-warning" /> Top productos
              </h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted">Sin datos.</p>
              ) : (
                <ul className="space-y-3">
                  {topProducts.map((p, i) => (
                    <li key={p.name}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-foreground">
                          {i + 1}. {p.name}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {p.qty} ud · {money(p.revenue, currency)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((p.qty / maxQty) * 100)}%`,
                            background: colors.primary,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <Users className="h-4 w-4 text-primary" /> Top clientes
              </h2>
              {topClients.length === 0 ? (
                <p className="text-sm text-muted">Sin datos.</p>
              ) : (
                <ul className="space-y-3">
                  {topClients.map((c, i) => (
                    <li key={c.name}>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-foreground">
                          {i + 1}. {c.name}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-muted">
                          {money(c.total, currency)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((c.total / maxClient) * 100)}%`,
                            background: colors.info,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function SplitRow({
  icon,
  label,
  amount,
  total,
  currency,
  color,
}: {
  icon: ReactNode;
  label: string;
  amount: number;
  total: number;
  currency: string;
  color: string;
}) {
  const pct = total > 0 ? Math.max(0, Math.min(100, Math.round((amount / total) * 100))) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 text-muted">
          <span style={{ color }}>{icon}</span>
          {label}
        </span>
        <span className="font-semibold tabular-nums text-foreground">
          {money(amount, currency)}
          <span className="ml-1.5 text-xs font-medium text-muted">{pct}%</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
