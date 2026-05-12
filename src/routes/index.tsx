import { createFileRoute, Link, Navigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDashboard, useProfile } from "@/hooks/use-data";
import { SaleFormDialog } from "@/components/forms/SaleFormDialog";
import { brl } from "@/lib/format";
import "../dashboard.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — Fiado." },
      { name: "description", content: "Controle suas vendas fiadas, pagamentos e clientes em um só lugar." },
    ],
  }),
  component: Dashboard,
});

const menuItems = [
  { label: "Overview", icon: "▦", to: "/" as const },
  { label: "Clientes", icon: "◌", to: "/clientes" as const },
  { label: "Vendas", icon: "▣", to: "/vendas" as const },
  { label: "Pagamentos", icon: "▭", to: "/pagamentos" as const },
  { label: "Cobranças", icon: "♧", to: "/cobrancas" as const },
  { label: "Relatórios", icon: "▥", to: "/relatorios" as const },
];

const navItems = [
  { label: "Dashboard", to: "/" as const },
  { label: "Clientes", to: "/clientes" as const },
  { label: "Vendas", to: "/vendas" as const },
  { label: "Pagamentos", to: "/pagamentos" as const },
  { label: "Cobranças", to: "/cobrancas" as const },
  { label: "Relatórios", to: "/relatorios" as const },
];

function Dashboard() {
  const { session, loading, signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { data: dash } = useDashboard();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const [openSale, setOpenSale] = useState(false);

  if (loading) {
    return (
      <div className="page-shell" style={{ display: "grid", placeItems: "center" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#5b55f6" }} />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;

  const totals = dash?.totals;
  const months = dash?.months ?? [];
  const totalVendido = totals?.totalVendido ?? 0;
  const totalRecebido = totals?.totalRecebido ?? 0;
  const recebidoHoje = totals?.recebidoHoje ?? 0;
  const totalAberto = totals?.totalAberto ?? 0;
  const totalClientes = totals?.totalClientes ?? 0;
  const cobrancasHoje = totals?.cobrancasHoje ?? 0;

  const aberto = totalAberto;
  const vendidoBase = totalVendido || 1;
  const pendPct = Math.min(100, Math.round((aberto / vendidoBase) * 100));

  // Sales bar mini-chart from monthly fiado (last 10 sale entries condensed -> use months padded)
  const salesBars = months.length
    ? (() => {
        const max = Math.max(...months.map((m) => m.fiado), 1);
        const padded = [...months];
        while (padded.length < 10) padded.unshift({ mes: "", recebido: 0, fiado: 0, key: "" });
        return padded.slice(-10).map((m, i) => ({
          h: Math.max(8, Math.round((m.fiado / max) * 88)),
          active: i === padded.length - 1 && m.fiado > 0,
        }));
      })()
    : Array.from({ length: 10 }).map((_, i) => ({ h: 14 + ((i * 7) % 30), active: false }));

  const productDots = months.length
    ? (() => {
        const max = Math.max(...months.map((m) => m.recebido), 1);
        const padded = [...months];
        while (padded.length < 9) padded.unshift({ mes: "", recebido: 0, fiado: 0, key: "" });
        return padded.slice(-9).map((m, i) => [
          Math.max(20, Math.round((m.recebido / max) * 80)),
          i >= 3 && i <= 5 && m.recebido > 0,
        ]) as [number, boolean][];
      })()
    : Array.from({ length: 9 }).map((_, i) => [30 + ((i * 11) % 50), false] as [number, boolean]);

  const chartMax = Math.max(
    ...months.map((m) => Math.max(m.recebido, m.fiado)),
    1
  );
  const chartData = (months.length
    ? months
    : Array.from({ length: 5 }).map((_, i) => ({
        mes: ["Jan", "Fev", "Mar", "Abr", "Mai"][i],
        recebido: 0,
        fiado: 0,
        key: "",
      }))
  ).map((m) => ({
    month: m.mes,
    grey: Math.max(2, Math.round((m.fiado / chartMax) * 90)),
    blue: Math.max(2, Math.round((m.recebido / chartMax) * 90)),
    recebido: m.recebido,
  }));

  const recPrev = months[months.length - 2]?.recebido ?? 0;
  const recCur = months[months.length - 1]?.recebido ?? 0;
  const fiaPrev = months[months.length - 2]?.fiado ?? 0;
  const fiaCur = months[months.length - 1]?.fiado ?? 0;
  const variation = (a: number, b: number) =>
    b ? `${(((a - b) / b) * 100).toFixed(0)}%` : "—";

  const firstName = profile?.nome?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "você";
  const email = profile?.email ?? user?.email ?? "";
  const initials =
    (profile?.nome ?? user?.email ?? "U")
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="page-shell">
      <div className="dashboard-window">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="logo" title="Fiado.">
            <span className="logo-dot" />
          </div>

          <div className="welcome">
            <h1>
              Bem-vindo
              <br />
              de volta, <span style={{ color: "#5b55f6" }}>{firstName}</span>
            </h1>
            <p>Última atualização: hoje</p>
          </div>

          <nav className="side-nav">
            {menuItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`side-item ${active ? "active" : ""}`}
                >
                  <span className="side-icon">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-actions">
            <button className="round-btn">⌄</button>
            <Link to="/configuracoes" className="round-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>⚙</Link>
            <button className="round-btn dark">✣</button>
            <button className="round-btn active">◇</button>
          </div>

          <div className="avatar-card">
            <div className="avatar-head">
              <span className="hair hair-1" />
              <span className="hair hair-2" />
              <span className="hair hair-3" />
              <span className="hair hair-4" />
              <div className="face">
                <span className="eye left" />
                <span className="eye right" />
                <span className="mouth" />
              </div>
              <div className="body" />
            </div>

            <div className="trial">
              <strong>{cobrancasHoje}</strong>
              <span>/{Math.max(cobrancasHoje, totalClientes || 30)}</span>
            </div>
            <p>
              cobranças pendentes hoje
              <br />
              precisando de atenção
            </p>
            <Link to="/cobrancas" className="unlock-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              Ver cobranças
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          <div className="topbar">
            <nav className="pill-nav">
              {navItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} className={`pill ${active ? "active" : ""}`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="profile-area">
              <button className="icon-btn" title="Notificações">♧</button>
              <button className="icon-btn" title="Mensagens">✉</button>

              <div className="profile">
                <div className="profile-avatar" style={{ display: "grid", placeItems: "center", color: "#fff", fontWeight: 600, fontSize: 14 }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ textTransform: "capitalize" }}>{firstName}</h3>
                  <p style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
                </div>
                <button
                  className="icon-btn"
                  title="Sair"
                  style={{ width: 36, height: 36, fontSize: 14 }}
                  onClick={async () => {
                    await signOut();
                    toast.success("Sessão encerrada");
                  }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="content-panel">
            <div className="panel-header">
              <h2>Painel de Cobranças</h2>
              <div className="panel-actions">
                <button className="circle-action" title="Filtrar">◉</button>
                <button className="soft-action">◎ Filtrar período</button>
                <button className="circle-action" title="Exportar">□</button>
                <button
                  className="soft-action"
                  onClick={() => {
                    qc.invalidateQueries();
                    toast.success("Dados atualizados");
                  }}
                >
                  ↻ Atualizar dados
                </button>
                <button
                  className="soft-action"
                  onClick={() => setOpenSale(true)}
                  style={{ background: "#5b55f6", color: "white", border: "1px solid #5b55f6" }}
                >
                  + Nova venda
                </button>
              </div>
            </div>

            <div className="top-grid">
              {/* Sales Revenue */}
              <div className="card revenue-card">
                <div>
                  <h4>Total vendido</h4>
                  <div className="revenue-row">
                    <strong>{brl(totalVendido).replace("R$", "").trim()}</strong>
                    <Link to="/vendas" style={{ display: "inline-flex" }}>
                      <button>›</button>
                    </Link>
                  </div>
                </div>
                <p>Vendas registradas no mês</p>
                <Link to="/vendas" className="mini-outline" style={{ display: "inline-flex", alignItems: "center" }}>
                  Ver vendas
                </Link>
              </div>

              {/* Sales Total mini bars */}
              <div className="card sales-total-card">
                <div className="card-row">
                  <div>
                    <h4>Total recebido</h4>
                    <p>{brl(totalRecebido)} no mês</p>
                  </div>
                  <Link to="/pagamentos" className="view-all" style={{ display: "inline-flex", alignItems: "center" }}>
                    Ver todos
                  </Link>
                </div>
                <div className="mini-chart">
                  {salesBars.map((bar, i) => (
                    <span
                      key={i}
                      className={`mini-bar ${bar.active ? "active" : ""}`}
                      style={{ height: `${bar.h}%` }}
                    />
                  ))}
                </div>
                <div className="axis-labels">
                  {months.length
                    ? months.slice(-5).map((m) => <span key={m.key}>{m.mes}</span>)
                    : ["Jan", "Fev", "Mar", "Abr", "Mai"].map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>

              {/* Top Product (clientes) */}
              <div className="card top-product-card">
                <div className="card-row">
                  <div>
                    <h4>Clientes em aberto</h4>
                    <p>{totals?.totalClientes ?? 0} cadastrados</p>
                  </div>
                  <Link to="/clientes" className="view-all" style={{ display: "inline-flex", alignItems: "center" }}>
                    Ver todos
                  </Link>
                </div>
                <div className="dot-chart">
                  {productDots.map(([h, active], i) => (
                    <div key={i} className="dot-line">
                      <span
                        className={`dot ${active ? "active" : ""}`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="product-footer">
                  <div className="legend">
                    <div>
                      <span className="legend-dot active" /> Pendentes
                    </div>
                    <div>
                      <span className="legend-dot" /> Sem dívida
                    </div>
                  </div>
                  <strong>{totalClientes}</strong>
                </div>
              </div>

              {/* Floating dark card */}
              <div className="floating-card">
                <div className="float-layer" />
                <div className="float-content">
                  <div className="float-top">
                    <div className="float-icon">↧</div>
                  </div>
                  <p style={{ marginTop: 0 }}>
                    Hoje
                    <br />
                    Recebido
                  </p>
                  <strong>{brl(recebidoHoje)}</strong>
                  <div className="float-bottom">
                    <span>pagamentos confirmados</span>
                    <button>⌄</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bottom-grid">
              <div className="left-stack">
                {/* Top item / Cobranças de hoje */}
                <div className="card top-item-card">
                  <div className="top-item-head">
                    <div className="purple-icon">♧</div>
                    <div className="green-badge">Prioridade</div>
                  </div>
                  <h4>Cobranças de hoje</h4>
                  <p style={{ marginTop: 6, color: "#777", fontSize: 13 }}>
                    {cobrancasHoje} {cobrancasHoje === 1 ? "cliente aguardando" : "clientes aguardando"} contato
                  </p>
                  <div className="small-actions">
                    <button title="WhatsApp">◴</button>
                    <button title="Ligar">▷</button>
                    <button title="E-mail">♇</button>
                  </div>
                  <Link to="/cobrancas" className="view-all item-btn" style={{ display: "inline-flex", alignItems: "center" }}>
                    Ver todas
                  </Link>
                </div>

                {/* Gauge */}
                <div className="card gauge-card">
                  <div className="card-row">
                    <h4>Pendências em aberto</h4>
                    <div className="green-badge percent">{pendPct}%</div>
                  </div>
                  <div className="gauge">
                    <div
                      style={{
                        content: "",
                        width: 260,
                        height: 260,
                        borderRadius: "50%",
                        position: "absolute",
                        left: 0,
                        top: 0,
                        background: `conic-gradient(from 225deg, #e4e4e4 0deg, #e4e4e4 ${
                          (100 - pendPct) * 2.7
                        }deg, #5b55f6 ${(100 - pendPct) * 2.7}deg, #5b55f6 270deg, transparent 270deg, transparent 360deg)`,
                      }}
                    />
                    <div className="gauge-mask" />
                    <div className="gauge-value">
                      <strong>{brl(aberto).replace("R$", "").trim()}</strong>
                      <span>Total em aberto</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Big chart */}
              <div className="card big-chart-card">
                <div className="big-chart-head">
                  <div className="title-with-icon">
                    <div className="purple-icon" style={{ background: "#eeedff", color: "#5b55f6" }}>◎</div>
                    <h4>Receita x Fiados — últimos 5 meses</h4>
                  </div>
                  <button className="dots">•••</button>
                </div>

                <div className="metrics">
                  <div>
                    <span>Recebido</span>
                    <strong>{brl(totalRecebido)}</strong>
                    <p>
                      ↗ {variation(recCur, recPrev)}{" "}
                      <em>vs mês anterior</em>
                    </p>
                  </div>
                  <div className="metric-divider" />
                  <div>
                    <span>Fiado</span>
                    <strong>{brl(totalAberto)}</strong>
                    <p>
                      ↗ {variation(fiaCur, fiaPrev)} <em>vs mês anterior</em>
                    </p>
                  </div>
                </div>

                <div className="bar-chart">
                  <div className="grid-lines">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 12,
                      bottom: 40,
                      width: 50,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      color: "#aaa",
                      fontSize: 13,
                    }}
                  >
                    <span>{Math.round(chartMax / 1000)}k</span>
                    <span>{Math.round((chartMax * 0.66) / 1000)}k</span>
                    <span>{Math.round((chartMax * 0.33) / 1000)}k</span>
                    <span>0</span>
                  </div>

                  <div className="chart-bars">
                    {chartData.map((item, index) => (
                      <div className="month-group" key={index}>
                        <div className="bars">
                          <span className="chart-bar grey" style={{ height: `${item.grey}%` }} />
                          <span className="chart-bar blue" style={{ height: `${item.blue}%` }} />
                        </div>
                        <span className="month">{item.month}</span>
                        {index === chartData.length - 1 && item.recebido > 0 && (
                          <div className="tooltip">
                            <strong>{brl(item.recebido)}</strong>
                            <span>mês atual</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button className="chart-next">›</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SaleFormDialog open={openSale} onOpenChange={setOpenSale} />
    </div>
  );
}
