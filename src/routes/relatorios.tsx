import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BarChart3, CircleDollarSign, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useDashboard, usePayments, useSales } from "@/hooks/use-data";
import { brl, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios - Fiado." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: dash, isLoading } = useDashboard();
  const { data: sales = [] } = useSales();
  const { data: payments = [] } = usePayments();

  const totals = dash?.totals;
  const totalVendido = totals?.totalVendido ?? 0;
  const totalRecebido = totals?.totalRecebido ?? 0;
  const totalAberto = totals?.totalAberto ?? 0;
  const totalVencido = totals?.totalVencido ?? 0;
  const conversion = totalVendido ? Math.round((totalRecebido / totalVendido) * 100) : 0;
  const ticket = sales.length
    ? sales.reduce((acc, sale) => acc + sale.valor_total, 0) / sales.length
    : 0;
  const maxMonth = Math.max(
    ...(dash?.months ?? []).map((month) => Math.max(month.recebido, month.fiado)),
    1,
  );

  return (
    <AppShell>
      <div className="motion-list flex min-w-0 flex-col gap-4 sm:gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Relatórios</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Acompanhe recebido, fiado, vencido e os clientes que mais precisam de atenção.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="Vendido no mês"
            value={brl(totalVendido)}
          />
          <Metric
            icon={<CircleDollarSign className="h-5 w-5 text-success" />}
            label="Recebido no mês"
            value={brl(totalRecebido)}
          />
          <Metric
            icon={<BarChart3 className="h-5 w-5 text-warning" />}
            label="Em aberto"
            value={brl(totalAberto)}
          />
          <Metric
            icon={<Users className="h-5 w-5 text-destructive" />}
            label="Vencido"
            value={brl(totalVencido)}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-foreground">Receita x fiado</h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {conversion}% recebido
              </span>
            </div>
            <div className="mt-6 grid gap-4">
              {(dash?.months ?? []).map((month) => {
                const recebido = Math.max(2, Math.round((month.recebido / maxMonth) * 100));
                const fiado = Math.max(2, Math.round((month.fiado / maxMonth) * 100));
                return (
                  <div key={month.key} className="grid gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium capitalize text-foreground">{month.mes}</span>
                      <span className="text-muted-foreground">
                        {brl(month.recebido)} recebido · {brl(month.fiado)} fiado
                      </span>
                    </div>
                    <div className="grid gap-1.5">
                      <span className="h-2 rounded-full bg-success/15">
                        <span
                          className="block h-full rounded-full bg-success"
                          style={{ width: `${recebido}%` }}
                        />
                      </span>
                      <span className="h-2 rounded-full bg-primary/15">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${fiado}%` }}
                        />
                      </span>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Carregando relatório...
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
              <h2 className="text-[15px] font-semibold text-foreground">Resumo operacional</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <InfoRow label="Vendas registradas" value={String(sales.length)} />
                <InfoRow label="Pagamentos registrados" value={String(payments.length)} />
                <InfoRow label="Ticket médio" value={brl(ticket)} />
                <InfoRow label="Clientes ativos" value={String(totals?.totalClientes ?? 0)} />
              </div>
            </div>

            <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
              <h2 className="text-[15px] font-semibold text-foreground">Maiores pendências</h2>
              <div className="mt-4 grid gap-3">
                {(dash?.topDebtors ?? []).length === 0 && (
                  <p className="py-5 text-center text-sm text-muted-foreground">
                    Nenhuma pendência em aberto.
                  </p>
                )}
                {(dash?.topDebtors ?? []).map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-3 py-3"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-foreground">
                      {client.nome}
                    </span>
                    <strong className="shrink-0 text-sm text-foreground">
                      {brl(client.saldo)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Últimas vendas</h2>
          <div className="mt-4 grid gap-3">
            {sales.slice(0, 6).map((sale) => (
              <div
                key={sale.id}
                className="flex flex-col gap-2 rounded-2xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{sale.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.client?.nome ?? "Cliente"} · {fmtDate(sale.data_venda)}
                  </p>
                </div>
                <strong className="text-sm text-foreground">{brl(sale.valor_total)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-surface p-5 shadow-soft">
      {icon}
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <strong className="mt-1 block text-2xl text-foreground">{value}</strong>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-3 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <strong className="text-foreground">{value}</strong>
    </div>
  );
}
