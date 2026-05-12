import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { StatCards } from "@/components/dashboard/StatCards";
import { SecondRow } from "@/components/dashboard/SecondRow";
import { Filter, Download, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Cobranças — Fiado." },
      { name: "description", content: "Controle suas vendas fiadas, pagamentos e clientes em um só lugar." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-[26px] md:text-[30px] font-semibold tracking-tight text-foreground">
              Painel de Cobranças
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-md">
              Controle suas vendas fiadas, pagamentos e clientes em um só lugar.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PillButton icon={Filter}>Filtrar período</PillButton>
            <PillButton icon={Download}>Exportar</PillButton>
            <PillButton icon={RefreshCw}>Atualizar dados</PillButton>
          </div>
        </div>

        <StatCards />

        <div className="pt-6">
          <SecondRow />
        </div>
      </div>
    </AppShell>
  );
}

function PillButton({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full bg-surface border border-border px-4 py-2 text-[12px] font-medium text-foreground/80 hover:bg-surface-muted hover:text-foreground transition shadow-soft">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
