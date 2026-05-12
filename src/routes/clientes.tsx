import { createFileRoute } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useClients, useDeleteClient, type Client } from "@/hooks/use-data";
import { ClientFormDialog } from "@/components/forms/ClientFormDialog";
import { Plus, Search, Pencil, Trash2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fmtPhone, onlyDigits } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Fiado." }] }),
  component: Page,
});

function Page() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const { data: clients = [], isLoading } = useClients(deferredSearch);
  const del = useDeleteClient();

  const askDelete = async (c: Client) => {
    if (!confirm(`Excluir cliente ${c.nome}? Vendas vinculadas serão removidas.`)) return;
    try {
      await del.mutateAsync(c.id);
      toast.success("Cliente excluído");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir cliente");
    }
  };

  return (
    <AppShell>
      <div className="motion-list flex flex-col gap-6">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Clientes</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Cadastre e gerencie todos os seus clientes.
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="motion-pop inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-[12px] font-medium hover:opacity-95 shadow-soft"
          >
            <Plus className="h-3.5 w-3.5" /> Novo cliente
          </button>
        </div>

        <div className="rounded-[22px] bg-surface p-5 shadow-soft">
          <div className="relative max-w-sm mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone ou CPF"
              className="pl-9"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase text-muted-foreground border-b border-border">
                  <th className="py-2 font-medium">Nome</th>
                  <th className="py-2 font-medium">Telefone</th>
                  <th className="py-2 font-medium">CPF</th>
                  <th className="py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Carregando…
                    </td>
                  </tr>
                )}
                {!isLoading && clients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted-foreground">
                      Nenhum cliente cadastrado.
                    </td>
                  </tr>
                )}
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="py-3 font-medium">{c.nome}</td>
                    <td className="py-3 text-muted-foreground">{fmtPhone(c.telefone)}</td>
                    <td className="py-3 text-muted-foreground">{c.cpf || "—"}</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        {c.telefone && (
                          <a
                            href={`https://wa.me/55${onlyDigits(c.telefone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="motion-pop h-8 w-8 rounded-full bg-success/10 text-success grid place-items-center hover:bg-success/20"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setEditing(c);
                            setOpen(true);
                          }}
                          className="motion-pop h-8 w-8 rounded-full bg-muted grid place-items-center hover:bg-muted/70"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => askDelete(c)}
                          className="motion-pop h-8 w-8 rounded-full bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive/20"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClientFormDialog open={open} onOpenChange={setOpen} client={editing} />
    </AppShell>
  );
}
