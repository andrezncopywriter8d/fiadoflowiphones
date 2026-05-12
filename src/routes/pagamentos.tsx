import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { usePayments } from "@/hooks/use-data";
import { brl, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos — Fiado." }] }),
  component: Page,
});

function Page() {
  const { data: payments = [], isLoading } = usePayments();
  const total = payments.reduce((a, p) => a + p.valor_pago, 0);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Pagamentos</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Histórico de todos os recebimentos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[18px] bg-surface p-5 shadow-soft">
            <p className="text-[11px] text-muted-foreground">Total recebido</p>
            <h3 className="mt-2 text-[24px] font-semibold tracking-tight">{brl(total)}</h3>
          </div>
          <div className="rounded-[18px] bg-surface p-5 shadow-soft">
            <p className="text-[11px] text-muted-foreground">Quantidade</p>
            <h3 className="mt-2 text-[24px] font-semibold tracking-tight">{payments.length}</h3>
          </div>
          <div className="rounded-[18px] bg-surface p-5 shadow-soft">
            <p className="text-[11px] text-muted-foreground">Ticket médio</p>
            <h3 className="mt-2 text-[24px] font-semibold tracking-tight">
              {brl(payments.length ? total / payments.length : 0)}
            </h3>
          </div>
        </div>

        <div className="rounded-[22px] bg-surface p-5 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Cliente</th>
                  <th className="py-2 font-medium">Venda</th>
                  <th className="py-2 font-medium">Forma</th>
                  <th className="py-2 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Carregando…</td></tr>}
                {!isLoading && payments.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Nenhum pagamento registrado.</td></tr>
                )}
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="py-3">{fmtDate(p.data_pagamento)}</td>
                    <td className="py-3 font-medium">{p.client?.nome ?? "—"}</td>
                    <td className="py-3 text-muted-foreground max-w-[260px] truncate">{p.sale?.descricao ?? "—"}</td>
                    <td className="py-3 capitalize">{p.forma_pagamento ?? "—"}</td>
                    <td className="py-3 text-right font-semibold">{brl(p.valor_pago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
