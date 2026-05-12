import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreatePayment, type Sale } from "@/hooks/use-data";
import { brl, todayISO } from "@/lib/format";
import { toast } from "sonner";

export function PaymentDialog({
  open,
  onOpenChange,
  sale,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sale: Sale | null;
}) {
  const create = useCreatePayment();
  const [form, setForm] = useState({
    valor_pago: "",
    forma_pagamento: "pix",
    data_pagamento: todayISO(),
    observacoes: "",
  });

  useEffect(() => {
    if (open && sale) {
      setForm({
        valor_pago: sale.saldo_restante ? String(sale.saldo_restante.toFixed(2)) : "",
        forma_pagamento: "pix",
        data_pagamento: todayISO(),
        observacoes: "",
      });
    }
  }, [open, sale]);

  if (!sale) return null;

  const submit = async () => {
    const valor = Number(form.valor_pago.replace(",", "."));
    if (!valor || valor <= 0) {
      toast.error("Informe o valor recebido");
      return;
    }
    try {
      await create.mutateAsync({
        sale_id: sale.id,
        client_id: sale.client_id,
        valor_pago: valor,
        forma_pagamento: form.forma_pagamento,
        data_pagamento: form.data_pagamento,
        observacoes: form.observacoes || undefined,
      });
      toast.success("Pagamento registrado");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar pagamento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="rounded-lg bg-muted/50 p-3 text-[12px]">
            <p className="text-muted-foreground">{sale.descricao}</p>
            <p className="mt-1">
              Saldo restante: <strong>{brl(sale.saldo_restante)}</strong>
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="valor">Valor recebido (R$) *</Label>
            <Input id="valor" inputMode="decimal" value={form.valor_pago} onChange={(e) => setForm({ ...form, valor_pago: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Forma</Label>
              <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="data">Data</Label>
              <Input id="data" type="date" value={form.data_pagamento} onChange={(e) => setForm({ ...form, data_pagamento: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Observações</Label>
            <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
