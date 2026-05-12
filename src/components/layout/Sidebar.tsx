import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Users,
  Package,
  ShoppingBag,
  Wallet,
  BellRing,
  CalendarClock,
  BarChart3,
  Settings,
  ArrowRight,
} from "lucide-react";
import { useProfile, useDashboard } from "@/hooks/use-data";
import { AppLogo } from "./AppLogo";

const items = [
  { to: "/", label: "Visão Geral", icon: LayoutGrid },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/vendas", label: "Vendas", icon: ShoppingBag },
  { to: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { to: "/cobrancas", label: "Cobranças", icon: BellRing },
  { to: "/lembretes", label: "Lembretes", icon: CalendarClock },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { data: dash } = useDashboard();

  const firstName = profile?.nome?.split(" ")[0] ?? profile?.email?.split("@")[0] ?? "você";
  const overdueCount = dash?.overdueSales?.length ?? 0;

  return (
    <aside className="hidden shrink-0 flex-col gap-5 rounded-l-[28px] bg-surface p-5 md:flex md:w-[268px]">
      <div className="px-1 pt-1">
        <AppLogo />
      </div>

      <div className="px-1">
        <h2 className="text-[26px] leading-[1.1] font-semibold tracking-tight text-foreground">
          Bem-vindo
          <br />
          de volta
          <br />
          <span className="text-primary capitalize">{firstName}</span>
        </h2>
        <p className="mt-3 text-[11px] text-muted-foreground">Última atualização: hoje</p>
      </div>

      <nav className="flex flex-col gap-0.5 rounded-2xl bg-surface-muted p-2">
        {items.map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          const showBadge = item.to === "/cobrancas" && overdueCount > 0;
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                active
                  ? "bg-surface text-primary shadow-soft"
                  : "text-foreground/70 hover:bg-surface/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">
                  {overdueCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-ink p-4 text-ink-foreground">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
            <BellRing className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-[10.5px] text-white/60">Cobranças do mês</p>
            <p className="mt-0.5 text-[22px] leading-none font-semibold">
              {(dash?.totals.cobrancasHoje ?? 0) + (dash?.overdueSales?.length ?? 0)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[10.5px] text-white/60">clientes com pendência</p>
        <Link
          to="/cobrancas"
          preload="intent"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[12px] font-medium text-ink transition hover:opacity-95"
        >
          Ver cobranças <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
