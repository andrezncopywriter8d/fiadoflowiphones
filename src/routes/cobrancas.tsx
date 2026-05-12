import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BellRing, CalendarClock, CheckCircle2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  useChargeNotifications,
  useLogCharge,
  useMarkReminderNotified,
  type ChargeNotification,
} from "@/hooks/use-data";
import { notifyChargeSent } from "@/lib/dopamine-toast";
import { brl, fmtDate, todayISO } from "@/lib/format";
import { openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/cobrancas")({
  head: () => ({
    meta: [
      { title: "Cobranças - Fiado." },
      { name: "description", content: "Cobranças de hoje, vencidas e próximas." },
    ],
  }),
  component: ChargesPage,
});

type ChargeFilter = "all" | "today";

const chargeAmount = (item: ChargeNotification) =>
  item.sale?.valor_parcela ?? item.sale?.saldo_restante ?? 0;

const buildMessage = (item: ChargeNotification) => {
  const nome = item.client?.nome ?? "cliente";
  const produto = item.sale?.descricao ?? item.descricao ?? "sua compra";
  const valor = brl(chargeAmount(item));
  const template =
    window.localStorage.getItem("fiado:charge-template") ||
    "Olá, {cliente}! Passando para lembrar da cobrança de hoje ({data}) referente a {produto}, no valor de {valor}.";

  return template
    .replaceAll("{cliente}", nome)
    .replaceAll("{produto}", produto)
    .replaceAll("{valor}", valor)
    .replaceAll("{data}", fmtDate(item.data_lembrete));
};

function ChargesPage() {
  const today = todayISO();
  const [filter, setFilter] = useState<ChargeFilter>("all");
  const { data: allCharges = [], isLoading } = useChargeNotifications(today, "all");
  const logCharge = useLogCharge();
  const markNotified = useMarkReminderNotified();

  const visibleCharges = useMemo(
    () =>
      filter === "today" ? allCharges.filter((item) => item.data_lembrete === today) : allCharges,
    [allCharges, filter, today],
  );

  const sendCharge = async (item: ChargeNotification) => {
    if (!item.client?.telefone) {
      toast.error("Cliente sem telefone cadastrado");
      return;
    }

    const message = buildMessage(item);
    openWhatsApp(item.client.telefone, message);
    await logCharge.mutateAsync({
      client_id: item.client.id,
      sale_id: item.sale_id ?? undefined,
      mensagem_usada: message,
    });
    if (item.source !== "sale") {
      await markNotified.mutateAsync(item.id);
    }
    notifyChargeSent({
      clientName: item.client.nome,
      amount: chargeAmount(item),
      product: item.sale?.descricao ?? item.descricao ?? "compra",
    });
  };

  const todayCount = allCharges.filter((item) => item.data_lembrete === today).length;
  const overdueCount = allCharges.filter((item) => item.data_lembrete < today).length;
  const totalDue = visibleCharges.reduce((acc, item) => acc + chargeAmount(item), 0);

  return (
    <AppShell>
      <div className="motion-list flex min-w-0 flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Cobranças</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Vendas em aberto e notificações prontas para enviar.
            </p>
          </div>
          <div className="inline-flex w-full rounded-full bg-surface p-1 shadow-soft sm:w-auto">
            {[
              { value: "all" as const, label: "Todas" },
              { value: "today" as const, label: "Hoje" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`h-9 flex-1 rounded-full px-4 text-xs font-semibold transition sm:flex-none ${
                  filter === item.value
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] bg-surface p-5 shadow-soft">
            <BellRing className="h-5 w-5 text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">Para hoje</p>
            <strong className="mt-1 block text-2xl">{todayCount}</strong>
          </div>
          <div className="rounded-[22px] bg-surface p-5 shadow-soft">
            <CalendarClock className="h-5 w-5 text-warning" />
            <p className="mt-3 text-xs text-muted-foreground">Vencidas</p>
            <strong className="mt-1 block text-2xl">{overdueCount}</strong>
          </div>
          <div className="rounded-[22px] bg-surface p-5 shadow-soft">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="mt-3 text-xs text-muted-foreground">Valor no filtro</p>
            <strong className="mt-1 block text-2xl">{brl(totalDue)}</strong>
          </div>
        </div>

        <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
          <div className="hidden md:block">
            <table className="w-full table-fixed text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                  <th className="w-[14%] py-2 font-medium">Data</th>
                  <th className="w-[22%] py-2 font-medium">Cliente</th>
                  <th className="w-[34%] py-2 font-medium">Produto</th>
                  <th className="w-[14%] py-2 font-medium text-right">Valor</th>
                  <th className="w-[16%] py-2 font-medium text-right">Notificar</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Carregando cobranças...
                    </td>
                  </tr>
                )}
                {!isLoading && visibleCharges.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      Nenhuma cobrança encontrada neste filtro.
                    </td>
                  </tr>
                )}
                {visibleCharges.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="py-3 text-muted-foreground">{fmtDate(item.data_lembrete)}</td>
                    <td className="truncate py-3 pr-3 font-medium">{item.client?.nome ?? "-"}</td>
                    <td className="truncate py-3 pr-3 text-muted-foreground">
                      {item.sale?.descricao ?? item.descricao ?? "-"}
                    </td>
                    <td className="py-3 text-right font-medium">{brl(chargeAmount(item))}</td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        className="motion-pop rounded-full"
                        disabled={
                          !item.client?.telefone || logCharge.isPending || markNotified.isPending
                        }
                        onClick={() => sendCharge(item)}
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {isLoading && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Carregando cobranças...
              </p>
            )}
            {!isLoading && visibleCharges.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma cobrança encontrada neste filtro.
              </p>
            )}
            {visibleCharges.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.client?.nome ?? "-"}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.sale?.descricao ?? item.descricao ?? "-"}
                    </p>
                  </div>
                  <strong className="shrink-0 text-sm text-foreground">
                    {brl(chargeAmount(item))}
                  </strong>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {fmtDate(item.data_lembrete)}
                  </span>
                  <Button
                    size="sm"
                    className="motion-pop rounded-full"
                    disabled={
                      !item.client?.telefone || logCharge.isPending || markNotified.isPending
                    }
                    onClick={() => sendCharge(item)}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
