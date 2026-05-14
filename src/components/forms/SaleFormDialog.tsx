import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildInstallmentSchedule,
  useClients,
  useProducts,
  useSaleItems,
  useUpsertSale,
  type Product,
  type Sale,
  type SaleProductInput,
} from "@/hooks/use-data";
import { brl, todayISO } from "@/lib/format";
import { notifyNewSale } from "@/lib/dopamine-toast";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  LoaderCircle,
  PackagePlus,
  ReceiptText,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const fieldClass =
  "h-11 min-w-0 rounded-xl border-border/80 bg-white px-3 text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0";

const textAreaClass =
  "min-h-[84px] rounded-xl border-border/80 bg-white px-3 py-2 text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0";

const labelClass = "text-[12px] font-semibold text-foreground";

const parseCurrency = (value: string) => Number(value.replace(/\./g, "").replace(",", ".") || 0);
const moneyInput = (value: number) => (value > 0 ? value.toFixed(2) : "");
const clampNumber = (value: string, min: number, max: number) =>
  Math.min(max, Math.max(min, Number(value) || min));

type SaleMode = "normal" | "fiado" | "emprestimo";

type SaleDraftItem = {
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  available: number;
  cost: number;
  salePrice: number;
  discount: number;
};

type PaymentDraft = {
  id: string;
  forma: string;
  valor: number;
  parcelas: number;
  observacao: string;
};

type ProductMeta = {
  kind?: "phone" | "part" | "service";
  data?: {
    modelo?: string;
    capacidade?: string;
    imei?: string;
    serial?: string;
    custoCompra?: number;
    custoManutencao?: number;
    custo?: number;
  };
};

const parseProductMeta = (product: Product): ProductMeta | null => {
  if (!product.observacoes) return null;
  try {
    const parsed = JSON.parse(product.observacoes) as ProductMeta;
    return parsed?.data ? parsed : null;
  } catch {
    return null;
  }
};

const productModel = (product: Product) => {
  const data = parseProductMeta(product)?.data;
  if (data?.modelo && data?.capacidade) return `${data.modelo} ${data.capacidade}`;
  if (data?.modelo) return data.modelo;
  return product.categoria || product.marca || "Produto";
};

const productImei = (product: Product) => {
  const data = parseProductMeta(product)?.data;
  return data?.imei || data?.serial || product.sku || "";
};

const productCost = (product: Product) => {
  const data = parseProductMeta(product)?.data;
  return Number(product.custo_unitario || data?.custoCompra || data?.custo || 0);
};

const productOptionLabel = (product: Product) => {
  const imei = productImei(product);
  return `${product.nome} - ${productModel(product)}${imei ? ` - IMEI/SKU: ${imei}` : ""} - Estoque: ${product.quantidade} - ${brl(product.preco_venda)}`;
};

const nextDateForChargeDay = (baseISO: string, day: number) => {
  const base = new Date(`${baseISO}T12:00:00`);
  const target = new Date(base.getFullYear(), base.getMonth(), day, 12);
  if (target <= base) target.setMonth(target.getMonth() + 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
};

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
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();
  const { data: existingItems = [] } = useSaleItems(sale?.id);

  const availableProducts = useMemo(
    () => products.filter((product) => product.status !== "inativo" && product.quantidade > 0),
    [products],
  );

  const [mode, setMode] = useState<SaleMode>("fiado");
  const [clientId, setClientId] = useState("");
  const [seller, setSeller] = useState("Andre");
  const [saleDate, setSaleDate] = useState(todayISO());
  const [deliveryType, setDeliveryType] = useState("Retirada");
  const [dueDate, setDueDate] = useState("");
  const [chargeDay, setChargeDay] = useState("20");
  const [installments, setInstallments] = useState("1");
  const [notes, setNotes] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [selectedDiscount, setSelectedDiscount] = useState("");
  const [items, setItems] = useState<SaleDraftItem[]>([]);

  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [paymentValue, setPaymentValue] = useState("");
  const [paymentInstallments, setPaymentInstallments] = useState("1");
  const [paymentNote, setPaymentNote] = useState("");
  const [payments, setPayments] = useState<PaymentDraft[]>([]);

  useEffect(() => {
    if (!open) return;

    setMode(
      sale?.forma_pagamento === "emprestimo"
        ? "emprestimo"
        : sale?.forma_pagamento === "fiado"
          ? "fiado"
          : "normal",
    );
    setClientId(sale?.client_id ?? defaultClientId ?? "");
    setSeller("Andre");
    setSaleDate(sale?.data_venda ?? todayISO());
    setDeliveryType("Retirada");
    setDueDate(sale?.data_vencimento ?? "");
    setChargeDay(sale?.dia_cobranca ? String(sale.dia_cobranca) : "20");
    setInstallments(String(sale?.parcelas_total ?? 1));
    setNotes(sale?.observacoes ?? "");
    setSelectedProductId("");
    setSelectedQuantity("1");
    setSelectedDiscount("");
    setPaymentMethod(
      sale?.forma_pagamento && sale.forma_pagamento !== "fiado" ? sale.forma_pagamento : "Pix",
    );
    setPaymentValue(sale?.valor_pago ? moneyInput(sale.valor_pago) : "");
    setPaymentInstallments("1");
    setPaymentNote("");
    setPayments(
      sale?.valor_pago
        ? [
            {
              id: crypto.randomUUID(),
              forma: sale.forma_pagamento || "Pix",
              valor: sale.valor_pago,
              parcelas: 1,
              observacao: "Pagamento registrado na venda",
            },
          ]
        : [],
    );
    if (!sale) setItems([]);
  }, [open, sale, defaultClientId]);

  useEffect(() => {
    if (!open || !sale) return;
    setItems(
      existingItems.map((item) => {
        const product = products.find((candidate) => candidate.id === item.product_id);
        return {
          product_id: item.product_id ?? "",
          product_name: item.product_name,
          sku: product?.sku ?? null,
          quantity: item.quantidade,
          available: product ? product.quantidade + item.quantidade : item.quantidade,
          cost: product ? productCost(product) : 0,
          salePrice: item.preco_unitario,
          discount: 0,
        };
      }),
    );
  }, [open, sale, existingItems, products]);

  const totals = useMemo(() => {
    const gross = items.reduce((acc, item) => acc + item.salePrice * item.quantity, 0);
    const discount = items.reduce((acc, item) => acc + item.discount * item.quantity, 0);
    const net = Math.max(gross - discount, 0);
    const paid = payments
      .filter((payment) => payment.forma !== "Fiado")
      .reduce((acc, payment) => acc + payment.valor, 0);
    const cost = items.reduce((acc, item) => acc + item.cost * item.quantity, 0);
    const pending = Math.max(net - paid, 0);
    return {
      gross,
      discount,
      net,
      paid,
      pending,
      profit: Math.max(net - cost, 0),
      status: mode === "emprestimo" ? "Emprestado" : pending <= 0 && net > 0 ? "Pago" : "Em aberto",
    };
  }, [items, payments, mode]);

  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const selectedCost = selectedProduct ? productCost(selectedProduct) : 0;
  const selectedProfit = selectedProduct
    ? Math.max(selectedProduct.preco_venda - selectedCost - parseCurrency(selectedDiscount), 0)
    : 0;
  const shouldSchedule = mode === "fiado" && totals.pending > 0;
  const installmentCount = clampNumber(installments, 1, 60);
  const chargeDayNumber = clampNumber(chargeDay, 1, 31);
  const firstDueDate = dueDate || nextDateForChargeDay(saleDate, chargeDayNumber);
  const installmentDates = shouldSchedule
    ? buildInstallmentSchedule({
        startDate: firstDueDate,
        chargeDay: chargeDayNumber,
        count: installmentCount,
      })
    : [];

  const addSelectedProduct = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto do estoque");
      return;
    }
    const quantity = clampNumber(selectedQuantity, 1, 9999);
    const discount = Math.max(0, parseCurrency(selectedDiscount));
    const existing = items.find((item) => item.product_id === selectedProduct.id);
    const alreadyAdded = existing?.quantity ?? 0;

    if (selectedProduct.quantidade <= 0) {
      toast.error("Produto sem estoque disponivel");
      return;
    }
    if (alreadyAdded + quantity > selectedProduct.quantidade) {
      toast.error(`Estoque insuficiente. Disponivel: ${selectedProduct.quantidade}`);
      return;
    }
    if (discount > selectedProduct.preco_venda) {
      toast.error("Desconto maior que o valor de venda");
      return;
    }

    setItems((current) => {
      if (existing) {
        return current.map((item) =>
          item.product_id === selectedProduct.id
            ? { ...item, quantity: item.quantity + quantity, discount }
            : item,
        );
      }
      return [
        ...current,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.nome,
          sku: selectedProduct.sku,
          quantity,
          available: selectedProduct.quantidade,
          cost: selectedCost,
          salePrice: selectedProduct.preco_venda,
          discount,
        },
      ];
    });
    setSelectedProductId("");
    setSelectedQuantity("1");
    setSelectedDiscount("");
  };

  const addPayment = () => {
    const value = parseCurrency(paymentValue);
    if (!paymentMethod) {
      toast.error("Selecione a forma de pagamento");
      return;
    }
    if (value <= 0) {
      toast.error("Informe o valor do pagamento");
      return;
    }
    if (paymentMethod !== "Fiado" && value > totals.pending + 0.01) {
      toast.error("Pagamento maior que o saldo pendente");
      return;
    }
    setPayments((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        forma: paymentMethod,
        valor: value,
        parcelas: clampNumber(paymentInstallments, 1, 60),
        observacao: paymentNote.trim(),
      },
    ]);
    setPaymentValue("");
    setPaymentInstallments("1");
    setPaymentNote("");
  };

  const submit = async () => {
    if ((mode === "fiado" || mode === "emprestimo") && !clientId) {
      toast.error("Selecione um cliente para fiado ou emprestimo");
      return;
    }
    if (!clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!items.length) {
      toast.error("Adicione pelo menos 1 produto do estoque");
      return;
    }
    for (const item of items) {
      if (item.quantity <= 0) {
        toast.error(`Quantidade invalida para ${item.product_name}`);
        return;
      }
      if (item.quantity > item.available) {
        toast.error(`Quantidade maior que o estoque de ${item.product_name}`);
        return;
      }
    }
    if (mode !== "emprestimo" && payments.length === 0) {
      toast.error("Adicione pelo menos um pagamento ou entrada");
      return;
    }
    if (mode === "normal" && totals.pending > 0) {
      toast.error("Venda normal precisa ficar quitada. Use Fiado se houver saldo pendente.");
      return;
    }
    if (mode === "fiado" && totals.pending <= 0) {
      toast.error("Para fiado, deixe algum valor pendente");
      return;
    }

    const description = items.map((item) => `${item.quantity}x ${item.product_name}`).join(" + ");
    const paymentSummary = payments
      .map(
        (payment) =>
          `${payment.forma}: ${brl(payment.valor)}${payment.parcelas > 1 ? ` em ${payment.parcelas}x` : ""}`,
      )
      .join(" | ");
    const observacoes = [
      `Modelo: ${mode === "normal" ? "Venda normal" : mode === "fiado" ? "Fiado" : "Empréstimo"}`,
      `Vendedor: ${seller}`,
      `Entrega: ${deliveryType}`,
      paymentSummary ? `Pagamentos: ${paymentSummary}` : "",
      `Lucro previsto: ${brl(totals.profit)}`,
      notes.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const saleItems: SaleProductInput[] = items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantidade: item.quantity,
      preco_unitario: Math.max(item.salePrice - item.discount, 0),
    }));

    try {
      await upsert.mutateAsync({
        id: sale?.id,
        client_id: clientId,
        descricao: description,
        valor_total: totals.net,
        valor_pago: mode === "emprestimo" ? 0 : totals.paid,
        forma_pagamento:
          mode === "emprestimo"
            ? "emprestimo"
            : mode === "fiado"
              ? "fiado"
              : paymentSummary || "pago",
        data_venda: saleDate,
        data_vencimento: shouldSchedule ? installmentDates[0] : dueDate || null,
        parcelas_total: shouldSchedule ? installmentCount : 1,
        dia_cobranca: shouldSchedule ? chargeDayNumber : null,
        valor_parcela: shouldSchedule
          ? Number((totals.pending / installmentCount).toFixed(2))
          : null,
        observacoes,
        items: saleItems,
      });

      if (sale) {
        toast.success("Venda atualizada e estoque ajustado");
      } else {
        const clientName = clients.find((client) => client.id === clientId)?.nome || "Cliente";
        notifyNewSale({
          clientName,
          amount: totals.net,
          payment: mode === "emprestimo" ? "EMPRÉSTIMO" : mode === "fiado" ? "FIADO" : "PAGO",
        });
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao finalizar venda");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clean-scrollbar max-h-[92vh] w-[calc(100vw-28px)] overflow-y-auto overflow-x-hidden border-white/70 bg-surface p-0 shadow-float sm:max-w-[1180px] sm:rounded-[28px]">
        <DialogHeader className="border-b border-border/70 px-5 pb-4 pt-5 sm:px-7">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[22px] leading-tight">
                {sale ? "Editar venda" : "Nova venda"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed">
                Escolha cliente, produtos do estoque, pagamentos e finalize com baixa automática.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-5 px-5 py-5 sm:px-7">
          <section className="rounded-[24px] border border-border/70 bg-surface-muted/55 p-4">
            <SectionTitle icon={UserRound} title="Dados da venda" />
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Modelo de venda">
                <Select value={mode} onValueChange={(value) => setMode(value as SaleMode)}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Venda normal</SelectItem>
                    <SelectItem value="fiado">Fiado</SelectItem>
                    <SelectItem value="emprestimo">Empréstimo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cliente">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nome} {client.telefone ? `- ${client.telefone}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Vendedor">
                <Select value={seller} onValueChange={setSeller}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Andre">Andre</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Data da venda">
                <Input
                  className={fieldClass}
                  type="date"
                  value={saleDate}
                  onChange={(event) => setSaleDate(event.target.value)}
                />
              </Field>
              <Field label="Tipo de entrega">
                <Select value={deliveryType} onValueChange={setDeliveryType}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retirada">Retirada</SelectItem>
                    <SelectItem value="Entrega">Entrega</SelectItem>
                    <SelectItem value="A combinar">A combinar</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <section className="rounded-[24px] border border-border/70 bg-surface-muted/55 p-4">
            <SectionTitle icon={PackagePlus} title="Itens da venda" />
            <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_110px_130px_170px]">
              <Field label="Produto do estoque">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue placeholder="Buscar produto disponível" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {productOptionLabel(product)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Qtd.">
                <Input
                  className={fieldClass}
                  type="number"
                  min={1}
                  value={selectedQuantity}
                  onChange={(event) => setSelectedQuantity(event.target.value)}
                />
              </Field>
              <Field label="Desconto un.">
                <Input
                  className={fieldClass}
                  inputMode="decimal"
                  value={selectedDiscount}
                  onChange={(event) => setSelectedDiscount(event.target.value)}
                  placeholder="0,00"
                />
              </Field>
              <div className="flex items-end">
                <Button
                  className="h-11 w-full rounded-xl"
                  type="button"
                  onClick={addSelectedProduct}
                >
                  + Adicionar produto
                </Button>
              </div>
            </div>

            {selectedProduct && (
              <div className="mt-3 grid gap-2 rounded-2xl bg-white px-4 py-3 text-xs text-muted-foreground md:grid-cols-4">
                <span>
                  Custo: <strong className="text-foreground">{brl(selectedCost)}</strong>
                </span>
                <span>
                  Venda:{" "}
                  <strong className="text-foreground">{brl(selectedProduct.preco_venda)}</strong>
                </span>
                <span>
                  Estoque: <strong className="text-foreground">{selectedProduct.quantidade}</strong>
                </span>
                <span>
                  Lucro previsto: <strong className="text-foreground">{brl(selectedProfit)}</strong>
                </span>
              </div>
            )}

            <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Produto</th>
                    <th className="px-4 py-3 font-semibold">Qtd.</th>
                    <th className="px-4 py-3 font-semibold text-right">Custo</th>
                    <th className="px-4 py-3 font-semibold text-right">Venda</th>
                    <th className="px-4 py-3 font-semibold text-right">Desconto</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum produto adicionado.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.product_id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sku || "Sem SKU"} - estoque disponível {item.available}
                        </p>
                      </td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{brl(item.cost)}</td>
                      <td className="px-4 py-3 text-right">{brl(item.salePrice)}</td>
                      <td className="px-4 py-3 text-right">{brl(item.discount)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {brl(Math.max(item.salePrice - item.discount, 0) * item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setItems((current) =>
                              current.filter(
                                (currentItem) => currentItem.product_id !== item.product_id,
                              ),
                            )
                          }
                          className="inline-grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                          title="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-[24px] border border-border/70 bg-surface-muted/55 p-4">
            <SectionTitle icon={CreditCard} title="Dados do pagamento" />
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_110px_1fr_auto]">
              <Field label="Forma">
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de crédito">Cartão de crédito</SelectItem>
                    <SelectItem value="Cartão de débito">Cartão de débito</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Fiado">Fiado</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Valor">
                <Input
                  className={fieldClass}
                  inputMode="decimal"
                  value={paymentValue}
                  onChange={(event) => setPaymentValue(event.target.value)}
                  placeholder="0,00"
                />
              </Field>
              <Field label="Parcelas">
                <Input
                  className={fieldClass}
                  type="number"
                  min={1}
                  value={paymentInstallments}
                  onChange={(event) => setPaymentInstallments(event.target.value)}
                />
              </Field>
              <Field label="Detalhes">
                <Input
                  className={fieldClass}
                  value={paymentNote}
                  onChange={(event) => setPaymentNote(event.target.value)}
                  placeholder="Comprovante, bandeira, combinado..."
                />
              </Field>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={addPayment}
                >
                  + Adicionar
                </Button>
              </div>
            </div>

            {payments.length > 0 && (
              <div className="mt-4 grid gap-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm"
                  >
                    <span>
                      <strong>{payment.forma}</strong> - {brl(payment.valor)}
                      {payment.parcelas > 1 ? ` em ${payment.parcelas}x` : ""}
                      {payment.observacao ? ` - ${payment.observacao}` : ""}
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-destructive"
                      onClick={() =>
                        setPayments((current) => current.filter((item) => item.id !== payment.id))
                      }
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            {shouldSchedule && (
              <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-[160px_160px_1fr]">
                <Field label="Parcelas fiado">
                  <Input
                    className={fieldClass}
                    type="number"
                    min={1}
                    value={installments}
                    onChange={(event) => setInstallments(event.target.value)}
                  />
                </Field>
                <Field label="Dia cobrança">
                  <Input
                    className={fieldClass}
                    type="number"
                    min={1}
                    max={31}
                    value={chargeDay}
                    onChange={(event) => setChargeDay(event.target.value)}
                  />
                </Field>
                <Field label="Primeiro vencimento">
                  <Input
                    className={fieldClass}
                    type="date"
                    value={firstDueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                  />
                </Field>
                <p className="text-xs text-muted-foreground md:col-span-3">
                  Cobranças: {installmentCount}x de {brl(totals.pending / installmentCount)} a
                  partir de {firstDueDate}.
                </p>
              </div>
            )}
          </section>

          <section className="grid gap-4 rounded-[24px] border border-border/70 bg-white p-4 xl:grid-cols-[1fr_360px]">
            <div>
              <SectionTitle icon={FileText} title="Finalizar venda" />
              <Textarea
                className={`${textAreaClass} mt-4`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observações, combinado com cliente ou detalhes internos"
              />
            </div>
            <div className="rounded-[22px] bg-surface-muted p-4">
              <div className="grid gap-2 text-sm">
                <SummaryRow label="Total bruto" value={brl(totals.gross)} />
                <SummaryRow label="Desconto total" value={brl(totals.discount)} />
                <SummaryRow label="Total líquido" value={brl(totals.net)} strong />
                <SummaryRow label="Valor pago" value={brl(totals.paid)} />
                <SummaryRow label="Valor pendente" value={brl(totals.pending)} />
                <SummaryRow label="Lucro previsto" value={brl(totals.profit)} />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {totals.status}
                </span>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 border-t border-border/70 bg-surface-muted/60 px-5 py-4 sm:px-7">
          <Button
            variant="ghost"
            className="h-11 rounded-xl px-5"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="h-11 rounded-xl px-5 shadow-soft"
            onClick={submit}
            disabled={upsert.isPending}
          >
            {upsert.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Finalizando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Finalizar venda
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className={labelClass}>{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      {title}
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={strong ? "text-base font-bold text-foreground" : "font-semibold text-foreground"}
      >
        {value}
      </span>
    </div>
  );
}
