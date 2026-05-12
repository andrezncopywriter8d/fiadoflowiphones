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
    <header className="flex items-center justify-between gap-4 px-2 pt-1">
      <nav className="hidden md:flex items-center gap-1 rounded-full bg-surface-muted p-1.5">
        {tabs.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              preload="intent"
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

      <div className="flex items-center gap-2.5 ml-auto">
        <button className="h-10 w-10 rounded-full bg-surface grid place-items-center text-foreground/70 hover:text-foreground transition shadow-soft">
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </button>
        <button className="h-10 w-10 rounded-full bg-surface grid place-items-center text-foreground/70 hover:text-foreground transition shadow-soft">
          <Mail className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </button>
        <div className="flex items-center gap-3 rounded-full bg-surface pl-1.5 pr-2 py-1.5 shadow-soft">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-ink grid place-items-center text-primary-foreground text-xs font-semibold uppercase">
            {initials}
          </div>
          <div className="leading-tight pr-2 hidden sm:block">
            <p className="text-[12.5px] font-medium text-foreground capitalize">{name}</p>
            <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{email}</p>
          </div>
          <button
            title="Sair"
            onClick={async () => {
              await signOut();
              toast.success("Sessão encerrada");
            }}
            className="h-8 w-8 rounded-full bg-surface-muted grid place-items-center text-muted-foreground hover:text-destructive transition"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
