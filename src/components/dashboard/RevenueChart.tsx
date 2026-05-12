import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { MoreHorizontal, ArrowRight, TrendingUp } from "lucide-react";

const data = [
  { mes: "Jan", recebido: 76500, fiado: 42000 },
  { mes: "Fev", recebido: 92000, fiado: 38000 },
  { mes: "Mar", recebido: 64000, fiado: 51000 },
  { mes: "Abr", recebido: 110000, fiado: 47000 },
  { mes: "Mai", recebido: 156098, fiado: 80112 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink text-ink-foreground px-3 py-2 shadow-ink">
      <p className="text-[13px] font-semibold">
        R$ {payload[0].value.toLocaleString("pt-BR")}
      </p>
      <p className="text-[10px] text-white/60">{label} 2024</p>
    </div>
  );
}

export function RevenueChart() {
  return (
    <div className="rounded-[22px] bg-surface p-6 shadow-soft h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 grid place-items-center">
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">
              Receita x Fiados
            </h3>
            <p className="text-[11px] text-muted-foreground">Últimos 5 meses</p>
          </div>
        </div>
        <button className="h-8 w-8 rounded-full grid place-items-center text-muted-foreground hover:bg-surface-muted">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-5">
        <div>
          <p className="text-[11px] text-muted-foreground">Recebido</p>
          <h4 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
            R$ 156.098,10
          </h4>
          <p className="mt-1 text-[10.5px] text-success font-medium">
            ↑ 41% vs mês anterior
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Fiado</p>
          <h4 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
            R$ 80.112,02
          </h4>
          <p className="mt-1 text-[10.5px] text-success font-medium">
            ↑ 2% vs mês anterior
          </p>
        </div>
      </div>

      <div className="mt-6 flex-1 min-h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
            <Bar dataKey="fiado" radius={[8, 8, 0, 0]} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell key={i} fill="var(--color-chart-2)" />
              ))}
            </Bar>
            <Bar dataKey="recebido" radius={[8, 8, 0, 0]} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell key={i} fill="var(--color-primary)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <button className="absolute right-2 bottom-12 h-9 w-9 rounded-full bg-surface-muted grid place-items-center text-foreground/70 hover:text-primary shadow-soft">
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
