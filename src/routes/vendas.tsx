import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useSales, useDeleteSale, type Sale } from "@/hooks/use-data";
import { SaleFormDialog } from "@/components/forms/SaleFormDialog";
import { PaymentDialog } from "@/components/forms/PaymentDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { brl, fmtDate } from "@/lib/format";
import { Plus, Pencil, Trash2, Wallet, MessageCircle } from "lucide-react";
import { wppTemplates, openWhatsApp } from "@/lib/whatsapp";
import { toast } from "sonner";

export const Route = createFileRoute("/vendas")({
  head: () => ({ meta: [{ title: "Vendas — Fiado." }] }),
  component: Page,
});

function Page() {
  const [openSale, setOpenSale] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [paying, setPaying] = useState<Sale | null>(null);
  const [filter, setFilter] = useState<string>("");
  const { data: sales = [], isLoading } = useSales();
  const del = useDeleteSale();

  const filtered = filter ? sales.filter((s) => s.status === filter) : sales;

  const askDelete = async (s: Sale) => {
    if (!confirm(`Excluir venda "${s.descricao}"?`)) return;
    try {
      await del.mutateAsync(s.id);
      toast.success("Venda excluída");
    } catch (e: any) { toast.error(e.message); }
  };

  const cobrar = (s: Sale) => {
    if (!s.client?.telefone) { toast.error("Cliente sem telefone"); return; }
    const msg = wppTemplates[0].build({
      nome: s.client.nome,
      valor: s.saldo_restante,
      data: s.data_vencimento ?? s.data_venda,
    });
    openWhatsApp(s.client.telefone, msg);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Vendas fiadas</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Registre, cobre e acompanhe suas vendas a prazo.</p>
          </div>
          <button
            onClick={() => { setEditing(null); setOpenSale(true); }}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-[12px] font-medium hover:opacity-95 shadow-soft"
          >
            <Plus className="h-3.5 w-3.5" /> Nova venda
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { v: "", label: "Todas" },
            { v: "pendente", label: "Pendentes" },
            { v: "parcial", label: "Parciais" },
            { v: "vencido", label: "Vencidas" },
            { v: "pago", label: "Pagas" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium border transition ${
                filter === f.v ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-foreground/70 hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-[22px] bg-surface p-5 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Cliente</th>
                  <th className="py-2 font-medium">Descrição</th>
                  <th className="py-2 font-medium">Vencimento</th>
                  <th className="py-2 font-medium text-right">Total</th>
                  <th className="py-2 font-medium text-right">Saldo</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Carregando…</td></tr>}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhuma venda registrada.</td></tr>
                )}
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="py-3 font-medium">{s.client?.nome ?? "—"}</td>
                    <td className="py-3 text-muted-foreground max-w-[260px] truncate">{s.descricao}</td>
                    <td className="py-3 text-muted-foreground">{fmtDate(s.data_vencimento)}</td>
                    <td className="py-3 text-right">{brl(s.valor_total)}</td>
                    <td className="py-3 text-right font-medium">{brl(s.saldo_restante)}</td>
                    <td className="py-3"><StatusBadge status={s.status} /></td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        {s.saldo_restante > 0 && (
                          <button
                            onClick={() => setPaying(s)}
                            className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center hover:bg-primary/20"
                            title="Registrar pagamento"
                          >
                            <Wallet className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {s.client?.telefone && s.saldo_restante > 0 && (
                          <button
                            onClick={() => cobrar(s)}
                            className="h-8 w-8 rounded-full bg-success/10 text-success grid place-items-center hover:bg-success/20"
                            title="Cobrar via WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => { setEditing(s); setOpenSale(true); }} className="h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-muted/70" title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => askDelete(s)} className="h-8 w-8 rounded-full bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive/20" title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SaleFormDialog open={openSale} onOpenChange={setOpenSale} sale={editing} />
      <PaymentDialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)} sale={paying} />
    </AppShell>
  );
}
