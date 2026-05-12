import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Mail } from "lucide-react";

const tabs = [
  { to: "/", label: "Dashboard" },
  { to: "/clientes", label: "Clientes" },
  { to: "/vendas", label: "Vendas" },
  { to: "/pagamentos", label: "Pagamento" },
  { to: "/cobrancas", label: "Cobranças" },
  { to: "/relatorios", label: "Relatórios" },
] as const;

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="flex items-center justify-between gap-4 px-2 pt-1">
      {/* Capsule menu */}
      <nav className="hidden md:flex items-center gap-1 rounded-full bg-surface-muted p-1.5">
        {tabs.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`px-4 py-2 rounded-full text-[12.5px] font-medium transition ${
                active
                  ? "bg-surface text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 ml-auto">
        <button className="h-10 w-10 rounded-full bg-surface grid place-items-center text-foreground/70 hover:text-foreground transition shadow-soft">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </button>
        <button className="h-10 w-10 rounded-full bg-surface grid place-items-center text-foreground/70 hover:text-foreground transition shadow-soft">
          <Mail className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </button>
        <div className="flex items-center gap-3 rounded-full bg-surface pl-1.5 pr-4 py-1.5 shadow-soft">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-ink grid place-items-center text-primary-foreground text-xs font-semibold">
            AR
          </div>
          <div className="leading-tight">
            <p className="text-[12.5px] font-medium text-foreground">André Ribeiro</p>
            <p className="text-[10px] text-muted-foreground">andre@loja.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
