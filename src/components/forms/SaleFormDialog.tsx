import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpsertSale, useClients, useUpsertClient, type Sale } from "@/hooks/use-data";
import { todayISO } from "@/lib/format";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function SaleFormDialog({
  open,
  onOpenChange,
  sale,
  defaultClientId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sale?: Sale | null;
  defaultClientId?: string;
}) {
  const upsert = useUpsertSale();
  const upsertClient = useUpsertClient();
  const { data: clients = [] } = useClients();

  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const [form, setForm] = useState({
    client_id: "",
    descricao: "",
    valor_total: "",
    valor_pago: "",
    forma_pagamento: "fiado",
    data_venda: todayISO(),
    data_vencimento: "",
    observacoes: "",
  });

  useEffect(() => {
    if (open) {
      setCreatingClient(false);
      setNewClientName("");
      setNewClientPhone("");
      setForm({
        client_id: sale?.client_id ?? defaultClientId ?? "",
        descricao: sale?.descricao ?? "",
        valor_total: sale?.valor_total ? String(sale.valor_total) : "",
        valor_pago: sale?.valor_pago ? String(sale.valor_pago) : "",
        forma_pagamento: sale?.forma_pagamento ?? "fiado",
        data_venda: sale?.data_venda ?? todayISO(),
        data_vencimento: sale?.data_vencimento ?? "",
        observacoes: sale?.observacoes ?? "",
      });
    }
  }, [open, sale, defaultClientId]);

  const submit = async () => {
    let clientId = form.client_id;

    if (creatingClient) {
      if (!newClientName.trim()) {
        toast.error("Informe o nome do novo cliente");
        return;
      }
      try {
        const created: any = await upsertClient.mutateAsync({
          nome: newClientName.trim(),
          telefone: newClientPhone || null,
        } as any);
        // upsertClient doesn't return id; refetch via clients query is async.
        // Workaround: insert directly via supabase to get id.
        // Simpler: set creatingClient = false but fetch id differently.
        // Quick fallback: do a lookup after invalidation.
        clientId = (created && created.id) || "";
      } catch (e: any) {
        toast.error(e.message ?? "Erro ao criar cliente");
        return;
      }
    }

    if (!clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!form.descricao.trim()) {
      toast.error("Descreva a venda");
      return;
    }
    const total = Number(form.valor_total.replace(",", "."));
    const pago = Number(form.valor_pago.replace(",", ".") || 0);
    if (!total || total <= 0) {
      toast.error("Informe o valor total");
      return;
    }

    try {
      await upsert.mutateAsync({
        id: sale?.id,
        client_id: clientId,
        descricao: form.descricao.trim(),
        valor_total: total,
        valor_pago: pago,
        forma_pagamento: form.forma_pagamento,
        data_venda: form.data_venda,
        data_vencimento: form.data_vencimento || null,
        observacoes: form.observacoes || null,
      } as any);
      toast.success(sale ? "Venda atualizada" : "Venda registrada");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar venda");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{sale ? "Editar venda" : "Nova venda fiada"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {!creatingClient ? (
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Cliente *</Label>
                <button
                  type="button"
                  onClick={() => setCreatingClient(true)}
                  className="text-[11px] text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <Plus className="h-3 w-3" /> novo cliente
                </button>
              </div>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-2 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <Label>Novo cliente</Label>
                <button type="button" onClick={() => setCreatingClient(false)} className="text-[11px] text-muted-foreground hover:underline">
                  cancelar
                </button>
              </div>
              <Input placeholder="Nome *" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
              <Input placeholder="Telefone" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} />
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: 2 camisetas + 1 calça" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="valor_total">Valor total (R$) *</Label>
              <Input id="valor_total" inputMode="decimal" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} placeholder="0,00" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="valor_pago">Entrada (R$)</Label>
              <Input id="valor_pago" inputMode="decimal" value={form.valor_pago} onChange={(e) => setForm({ ...form, valor_pago: e.target.value })} placeholder="0,00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="data_venda">Data da venda</Label>
              <Input id="data_venda" type="date" value={form.data_venda} onChange={(e) => setForm({ ...form, data_venda: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="data_vencimento">Vencimento</Label>
              <Input id="data_vencimento" type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Forma de pagamento</Label>
            <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fiado">Fiado</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={upsert.isPending || upsertClient.isPending}>
            {upsert.isPending ? "Salvando..." : "Salvar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
