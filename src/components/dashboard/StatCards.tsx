import { ArrowUpRight, ArrowDown } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer } from "recharts";

const barData = [
  { v: 8 }, { v: 14 }, { v: 9 }, { v: 18 }, { v: 12 },
  { v: 22 }, { v: 16 }, { v: 26 }, { v: 19 }, { v: 14 },
];

const dotsData = [
  { v: 4 }, { v: 7 }, { v: 5 }, { v: 9 }, { v: 6 },
  { v: 11 }, { v: 8 }, { v: 13 }, { v: 9 }, { v: 7 },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
      {/* Card 1 - Total vendido */}
      <div className="rounded-[22px] bg-surface p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Total vendido</p>
            <h3 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground">
              R$ 45.230
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1">
              Vendas registradas no mês
            </p>
          </div>
          <button className="h-9 w-9 rounded-full bg-surface-muted grid place-items-center text-foreground/70 hover:text-primary transition">
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <button className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-[11px] font-medium text-foreground/80 hover:bg-foreground/5 transition">
          Ver vendas
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {/* Card 2 - Total recebido com bar chart */}
      <div className="rounded-[22px] bg-surface p-5 shadow-soft">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Total recebido</p>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">
              Pagamentos confirmados
            </p>
          </div>
          <button className="rounded-full bg-surface-muted px-3 py-1.5 text-[10px] font-medium text-foreground/70">
            Ver tudo
          </button>
        </div>
        <div className="h-12 mt-3 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barCategoryGap={4}>
              <Bar dataKey="v" radius={[4, 4, 4, 4]}>
                {barData.map((_, i) => (
                  <rect
                    key={i}
                    fill={i === 7 ? "var(--color-primary)" : "var(--color-chart-2)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <h3 className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
          R$ 23.890
        </h3>
      </div>

      {/* Card 3 - Clientes em aberto */}
      <div className="rounded-[22px] bg-surface p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">Clientes em aberto</p>
          <button className="rounded-full bg-surface-muted px-3 py-1.5 text-[10px] font-medium text-foreground/70">
            Ver todos
          </button>
        </div>
        <div className="h-10 mt-3 flex items-end gap-1">
          {dotsData.map((d, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full ${i % 3 === 1 ? "bg-primary" : "bg-chart-2"}`}
              style={{ height: `${(d.v / 13) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Pendentes
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-chart-2" /> Sem dívida
            </span>
          </div>
          <h3 className="text-[32px] font-semibold tracking-tight text-foreground leading-none">
            64
          </h3>
        </div>
      </div>

      {/* Floating dark card */}
      <div className="absolute -bottom-10 right-6 hidden lg:block w-[200px] rounded-[18px] bg-ink text-ink-foreground p-4 shadow-ink z-10">
        <div className="flex items-start justify-between">
          <div className="h-8 w-8 rounded-full bg-white/10 grid place-items-center">
            <ArrowDown className="h-4 w-4" />
          </div>
          <button className="h-7 w-7 rounded-full bg-white/10 grid place-items-center hover:bg-white/15 transition">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-white/60">Recebido hoje</p>
        <h4 className="mt-1 text-[22px] font-semibold tracking-tight">R$ 234,90</h4>
        <p className="mt-1 text-[10px] text-success font-medium">
          ↑ 12% acima de ontem
        </p>
      </div>
    </div>
  );
}
