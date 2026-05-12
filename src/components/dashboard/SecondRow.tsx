import { BellRing, ArrowUpRight, MessageCircle, Phone, Send } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Link } from "@tanstack/react-router";
import { RevenueChart } from "./RevenueChart";
import { useDashboard } from "@/hooks/use-data";
import { brl } from "@/lib/format";

export function SecondRow() {
  const { data: dash } = useDashboard();
  const totals = dash?.totals;

  const aberto = totals?.totalAberto ?? 0;
  const vendido = totals?.totalVendido ?? 0;
  const pct = vendido > 0 ? Math.min(100, Math.round((aberto / vendido) * 100)) : 0;
  const valorMedio =
    (dash?.topDebtors?.length ?? 0) > 0
      ? aberto / (dash?.topDebtors?.length ?? 1)
      : 0;

  const gaugeData = [
    { name: "open", value: pct },
    { name: "rest", value: Math.max(1, 100 - pct) },
  ];
  const cobrancasHoje = totals?.cobrancasHoje ?? 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Cobranças de hoje */}
      <div className="lg:col-span-3 rounded-[22px] bg-surface p-5 shadow-soft flex flex-col">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-full bg-primary grid place-items-center">
            <BellRing className="h-5 w-5 text-primary-foreground" strokeWidth={1.8} />
          </div>
          <span className="rounded-full bg-success/15 text-success text-[10px] font-semibold px-2.5 py-1">
            Prioridade
          </span>
        </div>
        <h3 className="mt-4 text-[15px] font-semibold text-foreground">Cobranças de hoje</h3>
        <p className="text-[11px] text-muted-foreground mt-1">
          {cobrancasHoje} {cobrancasHoje === 1 ? "cliente aguardando" : "clientes aguardando"} contato
        </p>
        <div className="flex items-center gap-2 mt-4">
          <div className="h-8 w-8 rounded-full bg-surface-muted grid place-items-center text-foreground/70">
            <MessageCircle className="h-3.5 w-3.5" />
          </div>
          <div className="h-8 w-8 rounded-full bg-surface-muted grid place-items-center text-foreground/70">
            <Phone className="h-3.5 w-3.5" />
          </div>
          <div className="h-8 w-8 rounded-full bg-surface-muted grid place-items-center text-foreground/70">
            <Send className="h-3.5 w-3.5" />
          </div>
        </div>
        <Link
          to="/cobrancas"
          className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:opacity-80"
        >
          Ver todas <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Pendências gauge */}
      <div className="lg:col-span-3 rounded-[22px] bg-surface p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Pendências</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Em aberto</p>
          </div>
          <span className="rounded-full bg-success/15 text-success text-[10px] font-semibold px-2.5 py-1">
            {pct}%
          </span>
        </div>
        <div className="relative h-[140px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                dataKey="value"
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                cornerRadius={8}
              >
                <Cell fill="var(--color-primary)" />
                <Cell fill="var(--color-chart-2)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <p className="text-[20px] font-semibold tracking-tight text-foreground">
              {brl(valorMedio)}
            </p>
            <p className="text-[10px] text-muted-foreground">Valor médio em aberto</p>
          </div>
        </div>
      </div>

      {/* Big revenue chart */}
      <div className="lg:col-span-6">
        <RevenueChart />
      </div>
    </div>
  );
}
