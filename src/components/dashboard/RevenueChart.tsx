import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { MoreHorizontal, TrendingUp } from "lucide-react";
import { useDashboard } from "@/hooks/use-data";
import { brl } from "@/lib/format";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-ink text-ink-foreground px-3 py-2 shadow-ink">
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-[12px] font-medium">
          {p.dataKey === "recebido" ? "Recebido" : "Fiado"}: R$ {Number(p.value).toLocaleString("pt-BR")}
        </p>
      ))}
      <p className="text-[10px] text-white/60 mt-0.5 capitalize">{label}</p>
    </div>
  );
}

export function RevenueChart() {
  const { data: dash } = useDashboard();
  const data = dash?.months ?? [];
  const totalRecebido = data.reduce((a, m) => a + m.recebido, 0);
  const totalFiado = data.reduce((a, m) => a + m.fiado, 0);
  const prev = data[data.length - 2];
  const cur = data[data.length - 1];
  const pct = (a?: number, b?: number) =>
    a && b ? `${(((a - b) / b) * 100).toFixed(0)}%` : "—";

  return (
    <div className="rounded-[22px] bg-surface p-6 shadow-soft h-full flex flex-col">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 grid place-items-center">
            <TrendingUp className="h-4 w-4 text-primary" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Receita x Fiados</h3>
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
            {brl(totalRecebido)}
          </h4>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            Variação mês: {pct(cur?.recebido, prev?.recebido)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Fiado</p>
          <h4 className="mt-1 text-[22px] font-semibold tracking-tight text-foreground">
            {brl(totalFiado)}
          </h4>
          <p className="mt-1 text-[10.5px] text-muted-foreground">
            Variação mês: {pct(cur?.fiado, prev?.fiado)}
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
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
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
      </div>
    </div>
  );
}
