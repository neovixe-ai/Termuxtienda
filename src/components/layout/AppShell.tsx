import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  HandCoins,
  LayoutDashboard,
  Menu,
  PackagePlus,
  Plus,
  Settings,
  Shirt,
  ShoppingCart,
  Store,
  Users,
  X,
} from "lucide-react";
import { useApp } from "../../lib/store";
import { cn } from "../../lib/cn";

const NAV = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, end: true },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart, end: false },
  { to: "/clientes", label: "Clientes", icon: Users, end: false },
  { to: "/cobrar", label: "Cobrar", icon: HandCoins, end: false },
  { to: "/inventario", label: "Inventario", icon: Shirt, end: false },
  { to: "/compras", label: "Compras", icon: PackagePlus, end: false },
  { to: "/reportes", label: "Reportes", icon: BarChart3, end: false },
  { to: "/ajustes", label: "Ajustes", icon: Settings, end: false },
];

/** Atajos que se muestran en la barra inferior en tablet/celular. */
const MOBILE_NAV = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, end: true },
  { to: "/ventas", label: "Vender", icon: ShoppingCart, end: false },
  { to: "/cobrar", label: "Cobrar", icon: HandCoins, end: false },
  { to: "/reportes", label: "Reportes", icon: BarChart3, end: false },
  { to: "/ajustes", label: "Ajustes", icon: Settings, end: false },
];

function pageTitle(path: string): string {
  if (path.startsWith("/clientes/")) return "Detalle del cliente";
  const item = NAV.find((n) => (n.end ? path === n.to : path.startsWith(n.to)));
  return item ? item.label : "Inicio";
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const storeName = useApp((s) => s.settings.storeName);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-gradient text-white shadow-md shadow-primary/30">
          <Store className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{storeName}</p>
          <p className="text-xs text-muted">Panel de ventas</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary-soft text-primary shadow-sm shadow-primary/10"
                  : "text-muted hover:bg-surface-2 hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "scale-110")} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-muted">Termuxtienda · PWA para tablet</div>
    </div>
  );

  return (
    <div className="flex h-full pb-16 md:pb-0">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
        {sidebar}
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 h-full w-72 border-r border-border bg-surface"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-2 text-muted hover:bg-surface-2"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-muted hover:bg-surface-2 md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-muted">{pageTitle(location.pathname)}</h2>
          <NavLink
            to="/ventas"
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary-hover active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva venta</span>
            <span className="sm:hidden">Venta</span>
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Barra de navegación inferior (celular/tablet) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {MOBILE_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-8 w-12 items-center justify-center rounded-full transition-all",
                      isActive && "bg-primary-soft"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
