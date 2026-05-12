import { createFileRoute } from "@tanstack/react-router";
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
import { brl, fmtDate, todayISO } from "@/lib/format";
import { openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/cobrancas")({
  head: () => ({
    meta: [
      { title: "Cobranças — Fiado." },
      { name: "description", content: "Cobranças de hoje, vencidas e próximas." },
    ],
  }),
  component: ChargesPage,
});

const chargeAmount = (item: ChargeNotification) =>
  item.sale?.valor_parcela ?? item.sale?.saldo_restante ?? 0;

const buildMessage = (item: ChargeNotification) => {
  const nome = item.client?.nome ?? "cliente";
  const produto = item.sale?.descricao ?? item.descricao ?? "sua compra";
  const valor = brl(chargeAmount(item));
  return `Olá, ${nome}! Passando para lembrar da cobrança de hoje (${fmtDate(
    item.data_lembrete,
  )}) referente a ${produto}, no valor de ${valor}.`;
};

function ChargesPage() {
  const { data: charges = [], isLoading } = useChargeNotifications(todayISO());
  const logCharge = useLogCharge();
  const markNotified = useMarkReminderNotified();

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
    await markNotified.mutateAsync(item.id);
    toast.success("Mensagem de cobrança aberta no WhatsApp");
  };

  const todayCount = charges.filter((item) => item.data_lembrete === todayISO()).length;
  const overdueCount = charges.length - todayCount;
  const totalDue = charges.reduce((acc, item) => acc + chargeAmount(item), 0);

  return (
    <AppShell>
      <div className="motion-list flex flex-col gap-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Cobranças</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Notificações do dia com cliente, valor e produto prontos para enviar.
            </p>
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
            <p className="mt-3 text-xs text-muted-foreground">Valor a cobrar</p>
            <strong className="mt-1 block text-2xl">{brl(totalDue)}</strong>
          </div>
        </div>

        <div className="rounded-[22px] bg-surface p-5 shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Cliente</th>
                  <th className="py-2 font-medium">Produto</th>
                  <th className="py-2 font-medium text-right">Valor</th>
                  <th className="py-2 font-medium text-right">Notificar</th>
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
                {!isLoading && charges.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
                      Nenhuma cobrança pendente para hoje.
                    </td>
                  </tr>
                )}
                {charges.map((item) => (
                  <tr key={item.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="py-3 text-muted-foreground">{fmtDate(item.data_lembrete)}</td>
                    <td className="py-3 font-medium">{item.client?.nome ?? "—"}</td>
                    <td className="py-3 text-muted-foreground max-w-[300px] truncate">
                      {item.sale?.descricao ?? item.descricao ?? "—"}
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
        </div>
      </div>
    </AppShell>
  );
}
