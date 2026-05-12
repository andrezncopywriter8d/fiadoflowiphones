import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Users,
  ShoppingBag,
  Wallet,
  BellRing,
  BarChart3,
  Settings,
  ArrowRight,
} from "lucide-react";

const items = [
  { to: "/", label: "Visão Geral", icon: LayoutGrid },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { to: "/cobrancas", label: "Cobranças", icon: BellRing, badge: 23 },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex md:w-[260px] shrink-0 flex-col gap-6 bg-surface p-5 rounded-l-[28px]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="relative h-9 w-9 rounded-full bg-primary grid place-items-center shadow-soft">
          <span className="text-primary-foreground text-sm font-semibold">F</span>
          <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />
        </div>
        <span className="text-[13px] font-medium tracking-tight text-foreground/80">
          Fia<span className="text-primary">do</span>.
        </span>
      </div>

      {/* Welcome */}
      <div className="px-1">
        <h2 className="text-[28px] leading-[1.1] font-semibold text-foreground tracking-tight">
          Bem-vindo
          <br />
          de volta
          <br />
          <span className="text-primary">André</span>
        </h2>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Última atualização: hoje
        </p>
      </div>

      {/* Menu */}
      <nav className="rounded-2xl bg-surface-muted p-2 flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-surface text-primary shadow-soft"
                  : "text-foreground/70 hover:bg-surface/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge ? (
                <span className="text-[10px] font-semibold rounded-full bg-destructive text-destructive-foreground px-1.5 py-0.5">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Bottom card */}
      <div className="mt-auto rounded-2xl bg-surface-muted p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center">
            <BellRing className="h-5 w-5 text-primary" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">Cobranças do mês</p>
            <p className="text-xl font-semibold text-foreground leading-none mt-0.5">23</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          clientes com pendência
        </p>
        <Link
          to="/cobrancas"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink text-ink-foreground px-4 py-2.5 text-[12px] font-medium hover:opacity-90 transition"
        >
          Ver cobranças
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
