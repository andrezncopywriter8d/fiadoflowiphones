import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCards } from "@/components/dashboard/StatCards";
import { SecondRow } from "@/components/dashboard/SecondRow";
import { SaleFormDialog } from "@/components/forms/SaleFormDialog";
import { Filter, Download, RefreshCw, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [openSale, setOpenSale] = useState(false);
  const qc = useQueryClient();

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
            <PillButton
              icon={RefreshCw}
              onClick={() => {
                qc.invalidateQueries();
                toast.success("Dados atualizados");
              }}
            >
              Atualizar dados
            </PillButton>
            <button
              onClick={() => setOpenSale(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-[12px] font-medium hover:opacity-95 transition shadow-soft"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova venda
            </button>
          </div>
        </div>

        <StatCards />

        <div className="pt-6">
          <SecondRow />
        </div>
      </div>

      <SaleFormDialog open={openSale} onOpenChange={setOpenSale} />
    </AppShell>
  );
}

function PillButton({
  icon: Icon,
  children,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full bg-surface border border-border px-4 py-2 text-[12px] font-medium text-foreground/80 hover:bg-surface-muted hover:text-foreground transition shadow-soft"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
