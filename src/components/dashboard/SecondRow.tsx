import { BellRing, ArrowUpRight, MessageCircle, Phone, Send } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { RevenueChart } from "./RevenueChart";

const gaugeData = [
  { name: "open", value: 48 },
  { name: "rest", value: 52 },
];

export function SecondRow() {
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
        <h3 className="mt-4 text-[15px] font-semibold text-foreground">
          Cobranças de hoje
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1">
          12 clientes aguardando contato
        </p>
        <div className="flex items-center gap-2 mt-4">
          <button className="h-8 w-8 rounded-full bg-surface-muted grid place-items-center text-foreground/70 hover:text-success transition">
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          <button className="h-8 w-8 rounded-full bg-surface-muted grid place-items-center text-foreground/70 hover:text-primary transition">
            <Phone className="h-3.5 w-3.5" />
          </button>
          <button className="h-8 w-8 rounded-full bg-surface-muted grid place-items-center text-foreground/70 hover:text-primary transition">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <button className="mt-auto pt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-primary hover:opacity-80">
          Ver todas <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {/* Pendências gauge */}
      <div className="lg:col-span-3 rounded-[22px] bg-surface p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">Pendências</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Em aberto
            </p>
          </div>
          <span className="rounded-full bg-success/15 text-success text-[10px] font-semibold px-2.5 py-1">
            48%
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
            <p className="text-[22px] font-semibold tracking-tight text-foreground">
              R$ 594
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
