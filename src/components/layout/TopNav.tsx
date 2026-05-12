import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Mail, LogOut } from "lucide-react";
import { useProfile } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const tabs = [
  { to: "/", label: "Dashboard" },
  { to: "/clientes", label: "Clientes" },
  { to: "/produtos", label: "Produtos" },
  { to: "/vendas", label: "Vendas" },
  { to: "/pagamentos", label: "Pagamentos" },
  { to: "/cobrancas", label: "Cobranças" },
  { to: "/relatorios", label: "Relatórios" },
] as const;

export function TopNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { user, signOut } = useAuth();

  const name = profile?.nome ?? user?.email?.split("@")[0] ?? "Usuário";
  const email = profile?.email ?? user?.email ?? "";
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <header className="flex min-w-0 flex-col gap-3 px-1 pt-1 sm:px-2 md:flex-row md:items-center md:justify-between md:gap-4">
      <nav className="no-scrollbar -mx-1 flex min-w-0 items-center gap-1 overflow-x-auto rounded-full bg-surface-muted p-1.5 md:mx-0">
        {tabs.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              preload="intent"
              className={`shrink-0 rounded-full px-3 py-2 text-[12px] font-medium transition sm:px-4 sm:text-[12.5px] ${
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

      <div className="flex min-w-0 items-center justify-end gap-2.5 md:ml-auto">
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-foreground/70 shadow-soft transition hover:text-foreground">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </button>
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-foreground/70 shadow-soft transition hover:text-foreground">
          <Mail className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </button>
        <div className="flex min-w-0 items-center gap-3 rounded-full bg-surface py-1.5 pr-2 pl-1.5 shadow-soft">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-ink text-xs font-semibold text-primary-foreground uppercase">
            {initials}
          </div>
          <div className="hidden min-w-0 leading-tight pr-2 sm:block">
            <p className="text-[12.5px] font-medium text-foreground capitalize">{name}</p>
            <p className="max-w-[160px] truncate text-[10px] text-muted-foreground">{email}</p>
          </div>
          <button
            title="Sair"
            onClick={async () => {
              await signOut();
              toast.success("Sessão encerrada");
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-muted text-muted-foreground transition hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
