import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, MessageSquareText, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile } from "@/hooks/use-data";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações - Fiado." }] }),
  component: SettingsPage,
});

const defaultTemplate =
  "Olá, {cliente}! Passando para lembrar da cobrança de {produto}, no valor de {valor}. Posso te mandar a chave Pix?";

function SettingsPage() {
  const qc = useQueryClient();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    loja_nome: "",
    pix_chave: "",
  });
  const [template, setTemplate] = useState(defaultTemplate);

  useEffect(() => {
    setForm({
      nome: profile?.nome ?? "",
      email: profile?.email ?? "",
      telefone: profile?.telefone ?? "",
      loja_nome: profile?.loja_nome ?? "",
      pix_chave: profile?.pix_chave ?? "",
    });
  }, [profile]);

  useEffect(() => {
    const saved = window.localStorage.getItem("fiado:charge-template");
    if (saved) setTemplate(saved);
  }, []);

  const saveProfile = async () => {
    await updateProfile.mutateAsync({
      nome: form.nome.trim() || null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      loja_nome: form.loja_nome.trim() || null,
      pix_chave: form.pix_chave.trim() || null,
    });
    toast.success("Configurações salvas");
  };

  const saveTemplate = () => {
    window.localStorage.setItem("fiado:charge-template", template);
    toast.success("Modelo de cobrança salvo neste navegador");
  };

  const refreshData = async () => {
    await qc.invalidateQueries();
    toast.success("Dados atualizados");
  };

  return (
    <AppShell>
      <div className="motion-list flex min-w-0 flex-col gap-4 sm:gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            Configurações
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Ajuste dados da loja, Pix e mensagens usadas nas cobranças.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              Dados da loja
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Seu nome">
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </Field>
              <Field label="E-mail">
                <Input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Telefone">
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                />
              </Field>
              <Field label="Nome da loja">
                <Input
                  value={form.loja_nome}
                  onChange={(e) => setForm({ ...form, loja_nome: e.target.value })}
                />
              </Field>
              <Field label="Chave Pix">
                <Input
                  value={form.pix_chave}
                  onChange={(e) => setForm({ ...form, pix_chave: e.target.value })}
                />
              </Field>
            </div>
            <Button
              className="mt-5 h-10 rounded-xl"
              onClick={saveProfile}
              disabled={updateProfile.isPending}
            >
              <Save className="h-3.5 w-3.5" /> Salvar configurações
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageSquareText className="h-4 w-4 text-primary" />
                Modelo de cobrança
              </div>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="min-h-[150px] resize-none"
              />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Use as variáveis {"{cliente}"}, {"{produto}"} e {"{valor}"} para montar mensagens
                rápidas.
              </p>
              <Button className="mt-4 h-10 rounded-xl" onClick={saveTemplate}>
                <Save className="h-3.5 w-3.5" /> Salvar modelo
              </Button>
            </div>

            <div className="rounded-[22px] bg-ink p-4 text-ink-foreground shadow-soft sm:p-5">
              <p className="text-sm font-semibold">Sincronização</p>
              <p className="mt-2 text-xs leading-relaxed text-white/65">
                Recarregue clientes, vendas, produtos, cobranças e relatórios sem precisar atualizar
                a página.
              </p>
              <Button
                className="mt-4 h-10 rounded-xl bg-white text-ink hover:bg-white/90"
                onClick={refreshData}
              >
                <RefreshCcw className="h-3.5 w-3.5" /> Atualizar dados
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
