import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { BellRing, CalendarCheck, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useClients, useDeleteReminder, useReminders, useUpsertReminder } from "@/hooks/use-data";
import { fmtDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/lembretes")({
  head: () => ({ meta: [{ title: "Lembretes - Fiado." }] }),
  component: RemindersPage,
});

const emptyForm = {
  titulo: "",
  client_id: "",
  data_lembrete: todayISO(),
  horario_lembrete: "09:00",
  descricao: "",
};

function RemindersPage() {
  const [form, setForm] = useState(emptyForm);
  const { data: clients = [] } = useClients();
  const { data: reminders = [], isLoading } = useReminders();
  const upsert = useUpsertReminder();
  const del = useDeleteReminder();

  const pending = reminders.filter((item) => item.status === "pendente");
  const dueToday = pending.filter((item) => item.data_lembrete <= todayISO());
  const next = useMemo(
    () => [...pending].sort((a, b) => a.data_lembrete.localeCompare(b.data_lembrete)).slice(0, 6),
    [pending],
  );

  const submit = async () => {
    if (!form.titulo.trim()) {
      toast.error("Informe o título do lembrete");
      return;
    }
    if (!form.data_lembrete) {
      toast.error("Informe a data do lembrete");
      return;
    }

    await upsert.mutateAsync({
      titulo: form.titulo.trim(),
      client_id: form.client_id || null,
      data_lembrete: form.data_lembrete,
      horario_lembrete: form.horario_lembrete || null,
      descricao: form.descricao.trim() || null,
      status: "pendente",
    });
    toast.success("Lembrete criado");
    setForm(emptyForm);
  };

  const finish = async (id: string) => {
    await upsert.mutateAsync({ id, status: "concluido" });
    toast.success("Lembrete concluído");
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este lembrete?")) return;
    await del.mutateAsync(id);
    toast.success("Lembrete excluído");
  };

  return (
    <AppShell>
      <div className="motion-list flex min-w-0 flex-col gap-4 sm:gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Lembretes</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Crie alertas rápidos para cobranças, entregas e retornos de clientes.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<BellRing className="h-5 w-5 text-primary" />}
            label="Pendentes"
            value={pending.length}
          />
          <SummaryCard
            icon={<CalendarCheck className="h-5 w-5 text-warning" />}
            label="Para hoje"
            value={dueToday.length}
          />
          <SummaryCard
            icon={<CheckCircle2 className="h-5 w-5 text-success" />}
            label="Concluídos"
            value={reminders.length - pending.length}
          />
        </div>

        <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_150px_120px_auto]">
            <Input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título do lembrete"
            />
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="h-10 rounded-xl border border-input bg-surface px-3 text-[13px] outline-none focus:border-primary"
            >
              <option value="">Sem cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nome}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={form.data_lembrete}
              onChange={(e) => setForm({ ...form, data_lembrete: e.target.value })}
            />
            <Input
              type="time"
              value={form.horario_lembrete}
              onChange={(e) => setForm({ ...form, horario_lembrete: e.target.value })}
            />
            <Button className="h-10 rounded-xl" onClick={submit} disabled={upsert.isPending}>
              Criar
            </Button>
          </div>
          <Textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Observação, produto ou contexto do lembrete"
            className="mt-3 min-h-[86px] resize-none"
          />
        </div>

        <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Próximos lembretes</h2>
          <div className="mt-4 grid gap-3">
            {isLoading && (
              <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
            )}
            {!isLoading && next.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum lembrete pendente.
              </p>
            )}
            {next.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{item.titulo}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fmtDate(item.data_lembrete)}
                    {item.horario_lembrete ? ` às ${item.horario_lembrete.slice(0, 5)}` : ""}{" "}
                    {item.client?.nome ? `- ${item.client.nome}` : ""}
                  </p>
                  {item.descricao && (
                    <p className="mt-2 text-xs text-muted-foreground">{item.descricao}</p>
                  )}
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button
                    size="sm"
                    className="flex-1 rounded-full sm:flex-none"
                    onClick={() => finish(item.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full text-destructive"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-[22px] bg-surface p-5 shadow-soft">
      {icon}
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <strong className="mt-1 block text-2xl text-foreground">{value}</strong>
    </div>
  );
}
