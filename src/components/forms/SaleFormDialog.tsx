import { useEffect, useState } from "react";
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
  useClients,
  useProducts,
  useSaleItems,
  useUpsertProduct,
  useUpsertClient,
  useUpsertSale,
  buildInstallmentSchedule,
  type Client,
  type Product,
  type Sale,
  type SaleProductInput,
} from "@/hooks/use-data";
import { brl, todayISO } from "@/lib/format";
import { toast } from "sonner";
import { notifyNewSale } from "@/lib/dopamine-toast";
import {
  CalendarDays,
  CreditCard,
  FileText,
  LoaderCircle,
  Mic,
  PackagePlus,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";

const fieldClass =
  "h-11 min-w-0 rounded-xl border-border/80 bg-white px-3 text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0";

const textAreaClass =
  "min-h-[84px] rounded-xl border-border/80 bg-white px-3 py-2 text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0";

const labelClass = "text-[12px] font-semibold text-foreground";

const parseCurrency = (value: string) => Number(value.replace(",", ".") || 0);
const clampNumber = (value: string, min: number, max: number) =>
  Math.min(max, Math.max(min, Number(value) || min));

type QuickSaleDraft = {
  clientName?: string;
  phone?: string;
  productName?: string;
  quantity: number;
  total?: number;
  entry?: number;
  payment?: string;
  months?: number;
  chargeDay?: number;
};

type SpeechRecognitionResultLike = {
  readonly length: number;
  [index: number]: { transcript: string };
};

type SpeechRecognitionEventLike = {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const numberWords: Record<string, number> = {
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
};

const readNumber = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeText(value);
  return Number(normalized) || numberWords[normalized];
};

const readMoney = (value: string | undefined) => {
  if (!value) return undefined;
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  const match = cleaned.match(/\d+(?:\.\d{1,2})?/);
  return match ? Number(match[0]) : undefined;
};

const wordsAfter = (text: string, markers: string[], stopWords: string[], maxWords = 5) => {
  const normalized = normalizeText(text);
  for (const marker of markers) {
    const index = normalized.indexOf(marker);
    if (index < 0) continue;
    const tail = normalized
      .slice(index + marker.length)
      .trim()
      .split(" ");
    const words: string[] = [];
    for (const word of tail) {
      if (stopWords.includes(word)) break;
      words.push(word);
      if (words.length >= maxWords) break;
    }
    const phrase = words.join(" ").trim();
    if (phrase) return phrase;
  }
  return "";
};

const bestNameMatch = <T extends { nome: string }>(items: T[], spoken: string) => {
  const normalizedSpoken = normalizeText(spoken);
  if (!normalizedSpoken) return undefined;
  return items.find((item) => {
    const name = normalizeText(item.nome);
    return (
      name === normalizedSpoken ||
      normalizedSpoken.includes(name) ||
      name.includes(normalizedSpoken)
    );
  });
};

const cleanSpokenProductName = (value: string) =>
  titleCase(
    value
      .replace(/^(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+/, "")
      .replace(/\s+(de|por)\s+\d+(?:[.,]\d{1,2})?.*$/, "")
      .replace(/\s+(reais|real)\b.*$/, "")
      .trim(),
  );

const nextDateForChargeDay = (baseISO: string, day: number) => {
  const base = new Date(`${baseISO}T12:00:00`);
  const target = new Date(base.getFullYear(), base.getMonth(), 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  if (target < base) {
    target.setMonth(target.getMonth() + 1, 1);
    const nextLastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setDate(Math.min(day, nextLastDay));
  }
  return target.toISOString().slice(0, 10);
};

const parseQuickSale = (text: string, clients: Client[], products: Product[]): QuickSaleDraft => {
  const normalized = normalizeText(text);
  const moneyMatches = [...text.matchAll(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)?/gi)]
    .map((match) => readMoney(match[1]))
    .filter((value): value is number => typeof value === "number");
  const entry = readMoney(
    normalized.match(/(?:entrada|sinal|adiantamento)\s+(?:de\s+)?(\d+(?:[.,]\d{1,2})?)/)?.[1],
  );
  const total =
    readMoney(
      normalized.match(
        /(?:valor|total|deu|ficou|por|produto de|venda de)\s+(?:r\s*)?(\d+(?:[.,]\d{1,2})?)/,
      )?.[1],
    ) ?? moneyMatches.find((value) => value !== entry);
  const months =
    readNumber(
      normalized.match(
        /(?:por|durante|em)\s+(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+(?:mes|meses|parcelas?)/,
      )?.[1],
    ) ??
    readNumber(
      normalized.match(
        /(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+(?:mes|meses|parcelas?)/,
      )?.[1],
    );
  const chargeDay = readNumber(
    normalized.match(/(?:dia|todo dia|vencimento dia)\s+(\d{1,2})/)?.[1],
  );
  const quantity =
    readNumber(
      normalized.match(
        /(?:quantidade|qtd)\s+(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)/,
      )?.[1],
    ) ??
    readNumber(
      normalized.match(
        /(?:comprou|levou|pegou|vendi)\s+(\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)\s+/,
      )?.[1],
    ) ??
    1;
  const payment = normalized.includes("pix")
    ? "pix"
    : normalized.includes("dinheiro")
      ? "dinheiro"
      : normalized.includes("cartao") || normalized.includes("cartao")
        ? "cartao"
        : normalized.includes("boleto")
          ? "boleto"
          : normalized.includes("fiado") || months || chargeDay
            ? "fiado"
            : undefined;
  const phone = text.match(/(?:telefone|whats|whatsapp|celular)\s+([\d\s()+-]{8,})/i)?.[1]?.trim();

  const matchedClient = clients.find((client) => normalized.includes(normalizeText(client.nome)));
  const matchedProduct = products.find((product) =>
    normalized.includes(normalizeText(product.nome)),
  );
  const clientName =
    matchedClient?.nome ||
    titleCase(
      wordsAfter(
        text,
        ["cliente ", "para ", "pra ", "da cliente ", "do cliente "],
        ["comprou", "levou", "pegou", "produto", "um", "uma", "dois", "duas", "valor", "total"],
        4,
      ),
    ) ||
    titleCase(normalized.match(/^(.+?)\s+(?:comprou|levou|pegou|comprar|deve)\b/)?.[1] ?? "");
  const productCandidate =
    wordsAfter(
      text,
      ["produto ", "comprou ", "levou ", "pegou ", "vendi "],
      ["por", "valor", "total", "entrada", "sinal", "fiado", "dia", "durante", "meses", "cliente"],
      5,
    ) || normalized.match(/(?:comprou|levou|pegou)\s+(.+?)\s+(?:de|por|entrada|fiado|dia)\b/)?.[1];
  const productName =
    matchedProduct?.nome ||
    cleanSpokenProductName(
      productCandidate ??
        wordsAfter(
          text,
          ["produto "],
          ["por", "valor", "total", "entrada", "sinal", "fiado", "dia", "durante", "meses"],
          5,
        ),
    );

  return {
    clientName: clientName || undefined,
    phone,
    productName: productName || undefined,
    quantity: Math.max(1, quantity),
    total,
    entry,
    payment,
    months,
    chargeDay,
  };
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
  const upsertClient = useUpsertClient();
  const upsertProduct = useUpsertProduct();
  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();
  const { data: existingItems = [] } = useSaleItems(sale?.id);

  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [saleItems, setSaleItems] = useState<SaleProductInput[]>([]);
  const [quickText, setQuickText] = useState("");
  const [listening, setListening] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nome: "",
    preco_venda: "",
    quantidade: "",
  });

  const [form, setForm] = useState({
    client_id: "",
    descricao: "",
    valor_total: "",
    valor_pago: "",
    forma_pagamento: "fiado",
    data_venda: todayISO(),
    data_vencimento: "",
    parcelas_total: "1",
    dia_cobranca: "",
    observacoes: "",
  });

  const totalPreview = parseCurrency(form.valor_total);
  const paidPreview = parseCurrency(form.valor_pago);
  const balancePreview = Math.max(totalPreview - paidPreview, 0);
  const installmentCount = clampNumber(form.parcelas_total, 1, 60);
  const chargeDay = form.dia_cobranca ? clampNumber(form.dia_cobranca, 1, 31) : 0;
  const isFiado = form.forma_pagamento === "fiado";
  const hasInstallmentPlan = isFiado && installmentCount > 1 && chargeDay > 0;
  const installmentValue = hasInstallmentPlan ? balancePreview / installmentCount : 0;
  const installmentDates = hasInstallmentPlan
    ? buildInstallmentSchedule({
        startDate: form.data_vencimento || form.data_venda,
        chargeDay,
        count: installmentCount,
      })
    : [];
  const showBalance = totalPreview > 0;
  const itemsTotal = saleItems.reduce(
    (acc, item) => acc + item.preco_unitario * item.quantidade,
    0,
  );

  useEffect(() => {
    if (open) {
      setCreatingClient(false);
      setCreatingProduct(false);
      setNewClientName("");
      setNewClientPhone("");
      setSelectedProductId("");
      setSelectedQuantity("1");
      setQuickText("");
      setListening(false);
      setNewProduct({ nome: "", preco_venda: "", quantidade: "" });
      if (!sale) setSaleItems([]);
      setForm({
        client_id: sale?.client_id ?? defaultClientId ?? "",
        descricao: sale?.descricao ?? "",
        valor_total: sale?.valor_total ? String(sale.valor_total) : "",
        valor_pago: sale?.valor_pago ? String(sale.valor_pago) : "",
        forma_pagamento: sale?.forma_pagamento ?? "fiado",
        data_venda: sale?.data_venda ?? todayISO(),
        data_vencimento: sale?.data_vencimento ?? "",
        parcelas_total: String(sale?.parcelas_total ?? 1),
        dia_cobranca: sale?.dia_cobranca ? String(sale.dia_cobranca) : "",
        observacoes: sale?.observacoes ?? "",
      });
    }
  }, [open, sale, defaultClientId]);

  useEffect(() => {
    if (!open || !sale) return;
    setSaleItems(
      existingItems.map((item) => ({
        product_id: item.product_id ?? "",
        product_name: item.product_name,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
      })),
    );
  }, [open, sale, existingItems]);

  useEffect(() => {
    if (!saleItems.length) return;
    const description = saleItems
      .map((item) => `${item.quantidade}x ${item.product_name}`)
      .join(" + ");
    setForm((current) => ({
      ...current,
      descricao: description,
      valor_total: itemsTotal.toFixed(2),
    }));
  }, [itemsTotal, saleItems]);

  const addProductToSale = (product: Product, quantityValue: number) => {
    if (quantityValue <= 0) {
      toast.error("Informe a quantidade");
      return;
    }
    if (product.quantidade < quantityValue) {
      toast.error(`Estoque insuficiente para ${product.nome}`);
      return;
    }
    setSaleItems((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        const nextQty = existing.quantidade + quantityValue;
        if (nextQty > product.quantidade) {
          toast.error(`Estoque insuficiente para ${product.nome}`);
          return current;
        }
        return current.map((item) =>
          item.product_id === product.id ? { ...item, quantidade: nextQty } : item,
        );
      }
      return [
        ...current,
        {
          product_id: product.id,
          product_name: product.nome,
          quantidade: quantityValue,
          preco_unitario: product.preco_venda,
        },
      ];
    });
    setSelectedProductId("");
    setSelectedQuantity("1");
  };

  const listenQuickSale = () => {
    if (typeof window === "undefined") return;
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      toast.error(
        "Seu navegador não liberou ditado por voz. Cole a transcrição do áudio no campo.",
      );
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length - event.resultIndex })
        .map((_, offset) => event.results[event.resultIndex + offset][0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        setQuickText((current) => `${current ? `${current} ` : ""}${transcript}`.trim());
      }
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error("Não consegui captar o áudio. Tente falar mais perto ou cole o texto.");
    };
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  const applyQuickSale = async () => {
    if (!quickText.trim()) {
      toast.error("Fale ou cole o resumo da venda primeiro");
      return;
    }

    try {
      const draft = parseQuickSale(quickText, clients, products);
      let clientId = "";

      if (draft.clientName) {
        const matchedClient = bestNameMatch(clients, draft.clientName);
        if (matchedClient) {
          clientId = matchedClient.id;
        } else {
          const created = await upsertClient.mutateAsync({
            nome: draft.clientName,
            telefone: draft.phone ?? null,
          } satisfies Partial<Client>);
          clientId = created?.id ?? "";
        }
      }

      if (draft.productName) {
        const matchedProduct = bestNameMatch(
          products.filter((product) => product.status !== "inativo"),
          draft.productName,
        );

        if (matchedProduct) {
          addProductToSale(matchedProduct, draft.quantity);
        } else if (draft.total) {
          const unitPrice = draft.total / draft.quantity;
          const created = await upsertProduct.mutateAsync({
            nome: draft.productName,
            preco_venda: Number(unitPrice.toFixed(2)),
            quantidade: draft.quantity,
            estoque_minimo: 0,
            status: "ativo",
          });
          if (created) addProductToSale(created, draft.quantity);
        } else {
          setCreatingProduct(true);
          setNewProduct({
            nome: draft.productName,
            preco_venda: "",
            quantidade: String(draft.quantity),
          });
        }
      }

      setForm((current) => ({
        ...current,
        client_id: clientId || current.client_id,
        descricao: draft.productName
          ? `${draft.quantity}x ${draft.productName}`
          : current.descricao || quickText.trim(),
        valor_total: draft.total ? String(draft.total.toFixed(2)) : current.valor_total,
        valor_pago: draft.entry !== undefined ? String(draft.entry.toFixed(2)) : current.valor_pago,
        forma_pagamento: draft.payment ?? current.forma_pagamento,
        parcelas_total: draft.months ? String(draft.months) : current.parcelas_total,
        dia_cobranca: draft.chargeDay ? String(draft.chargeDay) : current.dia_cobranca,
        data_vencimento:
          draft.chargeDay && (draft.payment === "fiado" || draft.months)
            ? nextDateForChargeDay(current.data_venda, draft.chargeDay)
            : current.data_vencimento,
        observacoes: current.observacoes || `Lançamento rápido: ${quickText.trim()}`,
      }));

      toast.success("Venda preenchida pela IA rápida. Revise e salve.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não consegui preencher a venda");
    }
  };

  const addSelectedProduct = () => {
    const product = products.find((item) => item.id === selectedProductId);
    if (!product) {
      toast.error("Selecione um produto");
      return;
    }
    addProductToSale(product, clampNumber(selectedQuantity, 1, 999));
  };

  const createAndAddProduct = async () => {
    if (!newProduct.nome.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    const created = await upsertProduct.mutateAsync({
      nome: newProduct.nome.trim(),
      preco_venda: parseCurrency(newProduct.preco_venda),
      quantidade: clampNumber(newProduct.quantidade, 0, 999999),
      estoque_minimo: 0,
      status: "ativo",
    });
    if (created) {
      addProductToSale(created, 1);
      setCreatingProduct(false);
      setNewProduct({ nome: "", preco_venda: "", quantidade: "" });
    }
  };

  const submit = async () => {
    let clientId = form.client_id;

    if (creatingClient) {
      if (!newClientName.trim()) {
        toast.error("Informe o nome do novo cliente");
        return;
      }
      try {
        const created = await upsertClient.mutateAsync({
          nome: newClientName.trim(),
          telefone: newClientPhone || null,
        } satisfies Partial<Client>);
        // upsertClient doesn't return id; refetch via clients query is async.
        // Workaround: insert directly via supabase to get id.
        // Simpler: set creatingClient = false but fetch id differently.
        // Quick fallback: do a lookup after invalidation.
        clientId = (created && created.id) || "";
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erro ao criar cliente");
        return;
      }
    }

    if (!clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    if (!form.descricao.trim() && saleItems.length === 0) {
      toast.error("Descreva a venda");
      return;
    }
    const total = saleItems.length ? itemsTotal : parseCurrency(form.valor_total);
    const pago = parseCurrency(form.valor_pago);
    if (!total || total <= 0) {
      toast.error("Informe o valor total");
      return;
    }
    if (hasInstallmentPlan && pago >= total) {
      toast.error("Para parcelar no fiado, a entrada precisa ser menor que o valor total");
      return;
    }

    try {
      await upsert.mutateAsync({
        id: sale?.id,
        client_id: clientId,
        descricao: form.descricao.trim() || saleItems.map((item) => item.product_name).join(" + "),
        valor_total: total,
        valor_pago: pago,
        forma_pagamento: form.forma_pagamento,
        data_venda: form.data_venda,
        data_vencimento: installmentDates[0] ?? (form.data_vencimento || null),
        parcelas_total: hasInstallmentPlan ? installmentCount : 1,
        dia_cobranca: hasInstallmentPlan ? chargeDay : null,
        valor_parcela: hasInstallmentPlan ? Number(installmentValue.toFixed(2)) : null,
        observacoes: form.observacoes || null,
        items: saleItems,
      });
      if (sale) {
        toast.success("Venda atualizada");
      } else {
        const clientName =
          clients.find((client) => client.id === clientId)?.nome || newClientName || "Cliente";
        notifyNewSale({
          clientName,
          amount: total,
          payment: form.forma_pagamento.toUpperCase(),
        });
      }
      onOpenChange(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar venda");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clean-scrollbar max-h-[92vh] w-[calc(100vw-32px)] overflow-y-auto overflow-x-hidden border-white/70 bg-surface p-0 shadow-float sm:max-w-[560px] sm:rounded-2xl">
        <DialogHeader className="border-b border-border/70 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-[19px] leading-tight">
              {sale ? "Editar venda" : "Nova venda fiada"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Registre o cliente, o valor combinado e a entrada recebida.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid gap-4 px-5 py-5 sm:px-6">
          {!sale && (
            <div className="grid gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-primary text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Venda rápida com IA</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Fale ou cole algo como: Quelma comprou 2 perfumes de 100, entrada 20, fiado,
                      dia 20 por 6 meses.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={listening ? "default" : "outline"}
                  size="sm"
                  className="h-9 shrink-0 rounded-xl"
                  onClick={listenQuickSale}
                >
                  <Mic className="h-4 w-4" />
                  {listening ? "Ouvindo" : "Áudio"}
                </Button>
              </div>
              <Textarea
                className="min-h-[74px] rounded-xl border-primary/20 bg-white px-3 py-2 text-sm shadow-none transition focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
                value={quickText}
                onChange={(event) => setQuickText(event.target.value)}
                placeholder="Cole a transcrição do áudio ou dite pelo botão Áudio..."
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Ele cadastra cliente/produto se não encontrar e preenche a venda para revisão.
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl"
                  onClick={applyQuickSale}
                  disabled={upsertClient.isPending || upsertProduct.isPending}
                >
                  <Sparkles className="h-4 w-4" />
                  Preencher venda
                </Button>
              </div>
            </div>
          )}

          {!creatingClient ? (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>Cliente *</Label>
                <button
                  type="button"
                  onClick={() => setCreatingClient(true)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Plus className="h-3.5 w-3.5" /> novo cliente
                </button>
              </div>
              <Select
                value={form.client_id}
                onValueChange={(v) => setForm({ ...form, client_id: v })}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="grid gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between">
                <Label className="inline-flex items-center gap-2 text-[12px] font-semibold">
                  <UserPlus className="h-4 w-4 text-primary" /> Novo cliente
                </Label>
                <button
                  type="button"
                  onClick={() => setCreatingClient(false)}
                  className="min-h-8 rounded-lg px-2 text-xs font-medium text-muted-foreground transition hover:bg-white/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  cancelar
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  className={fieldClass}
                  placeholder="Nome *"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
                <Input
                  className={fieldClass}
                  placeholder="Telefone"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-muted/70 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <PackagePlus className="h-4 w-4 text-primary" />
                Produtos da venda
              </div>
              <button
                type="button"
                onClick={() => setCreatingProduct((value) => !value)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="h-3.5 w-3.5" /> produto
              </button>
            </div>

            {creatingProduct && (
              <div className="grid gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_120px_110px]">
                  <Input
                    className={fieldClass}
                    placeholder="Nome do produto"
                    value={newProduct.nome}
                    onChange={(e) => setNewProduct({ ...newProduct, nome: e.target.value })}
                  />
                  <Input
                    className={fieldClass}
                    inputMode="decimal"
                    placeholder="Preço"
                    value={newProduct.preco_venda}
                    onChange={(e) => setNewProduct({ ...newProduct, preco_venda: e.target.value })}
                  />
                  <Input
                    className={fieldClass}
                    inputMode="numeric"
                    placeholder="Estoque"
                    value={newProduct.quantidade}
                    onChange={(e) => setNewProduct({ ...newProduct, quantidade: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="w-fit rounded-xl"
                  onClick={createAndAddProduct}
                  disabled={upsertProduct.isPending}
                >
                  {upsertProduct.isPending ? "Cadastrando..." : "Cadastrar e adicionar"}
                </Button>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-[1fr_96px_auto]">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Selecione um produto do estoque" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter((product) => product.status !== "inativo")
                    .map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nome} • {brl(product.preco_venda)} • {product.quantidade} un.
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                className={fieldClass}
                min={1}
                type="number"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
                placeholder="Qtd."
              />
              <Button type="button" className="h-11 rounded-xl" onClick={addSelectedProduct}>
                Adicionar
              </Button>
            </div>

            {saleItems.length > 0 && (
              <div className="grid gap-2">
                {saleItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantidade} un. x {brl(item.preco_unitario)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <strong>{brl(item.preco_unitario * item.quantidade)}</strong>
                      <button
                        type="button"
                        className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive transition hover:bg-destructive/20"
                        onClick={() =>
                          setSaleItems((current) =>
                            current.filter(
                              (currentItem) => currentItem.product_id !== item.product_id,
                            ),
                          )
                        }
                        title="Remover produto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-sm">
                  <span className="font-medium text-primary">Total dos produtos</span>
                  <strong className="text-primary">{brl(itemsTotal)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label className={labelClass} htmlFor="descricao">
              Descrição *
            </Label>
            <Input
              className={fieldClass}
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: 2 camisetas + 1 calça"
            />
          </div>

          <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-muted/70 p-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-primary" />
              Valores da venda
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className={labelClass} htmlFor="valor_total">
                  Valor total (R$) *
                </Label>
                <Input
                  className={fieldClass}
                  id="valor_total"
                  inputMode="decimal"
                  value={form.valor_total}
                  onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="grid gap-2">
                <Label className={labelClass} htmlFor="valor_pago">
                  Entrada (R$)
                </Label>
                <Input
                  className={fieldClass}
                  id="valor_pago"
                  inputMode="decimal"
                  value={form.valor_pago}
                  onChange={(e) => setForm({ ...form, valor_pago: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>
            {showBalance && (
              <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                <span className="text-muted-foreground">Saldo a receber</span>
                <strong className="text-foreground">{brl(balancePreview)}</strong>
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-muted/70 p-3.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              Datas e pagamento
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className={labelClass} htmlFor="data_venda">
                  Data da venda
                </Label>
                <Input
                  className={fieldClass}
                  id="data_venda"
                  type="date"
                  value={form.data_venda}
                  onChange={(e) => setForm({ ...form, data_venda: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label className={labelClass} htmlFor="data_vencimento">
                  Vencimento
                </Label>
                <Input
                  className={fieldClass}
                  id="data_vencimento"
                  type="date"
                  value={form.data_vencimento}
                  onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className={labelClass}>Forma de pagamento</Label>
              <Select
                value={form.forma_pagamento}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    forma_pagamento: v,
                    parcelas_total: v === "fiado" ? form.parcelas_total : "1",
                    dia_cobranca: v === "fiado" ? form.dia_cobranca : "",
                  })
                }
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiado">Fiado</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isFiado && (
              <div className="grid gap-3 rounded-xl bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label className={labelClass} htmlFor="parcelas_total">
                      Quantos meses?
                    </Label>
                    <Input
                      className={fieldClass}
                      id="parcelas_total"
                      min={1}
                      max={60}
                      type="number"
                      value={form.parcelas_total}
                      onChange={(e) => setForm({ ...form, parcelas_total: e.target.value })}
                      placeholder="Ex: 6"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className={labelClass} htmlFor="dia_cobranca">
                      Dia da cobrança
                    </Label>
                    <Input
                      className={fieldClass}
                      id="dia_cobranca"
                      min={1}
                      max={31}
                      type="number"
                      value={form.dia_cobranca}
                      onChange={(e) => setForm({ ...form, dia_cobranca: e.target.value })}
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>
                {hasInstallmentPlan && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-foreground">
                    <strong>{installmentCount} cobranças</strong> de{" "}
                    <strong>{brl(installmentValue)}</strong>, todo dia {chargeDay}. Primeira em{" "}
                    <strong>
                      {new Date(`${installmentDates[0]}T12:00:00`).toLocaleDateString("pt-BR")}
                    </strong>
                    .
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label
              className="inline-flex items-center gap-2 text-[12px] font-semibold"
              htmlFor="obs"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Observações
            </Label>
            <Textarea
              className={textAreaClass}
              id="obs"
              rows={3}
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              placeholder="Algum combinado, prazo ou detalhe da venda"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/70 bg-surface-muted/60 px-5 py-4 sm:px-6">
          <Button
            className="h-11 rounded-xl px-5"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="h-11 rounded-xl px-5 shadow-soft"
            onClick={submit}
            disabled={upsert.isPending || upsertClient.isPending}
          >
            {upsert.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar venda"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
