import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { brl } from "@/lib/format";
import { useDeleteProduct, useProducts, useUpsertProduct, type Product } from "@/hooks/use-data";

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos - Fiado." }] }),
  component: ProductsPage,
});

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Label className="grid gap-1.5 text-xs font-semibold text-foreground/80">
      {label}
      {children}
    </Label>
  );
}

const productCategories = ["Celular", "Peça", "Acessório", "Produto geral"];
const brandOptions = ["Apple", "Samsung", "Motorola", "Xiaomi", "Natura", "Avon", "Genérico"];
const iPhoneModels = [
  "iPhone 17e",
  "iPhone 17 Pro Max",
  "iPhone 17 Pro",
  "iPhone 17",
  "iPhone Air",
  "iPhone 16e",
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16 Plus",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15 Plus",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14 Plus",
  "iPhone 14",
  "iPhone SE 3ª geração",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13",
  "iPhone 13 mini",
  "iPhone 12 Pro Max",
  "iPhone 12 Pro",
  "iPhone 12",
  "iPhone 12 mini",
  "iPhone SE 2ª geração",
  "iPhone 11 Pro Max",
  "iPhone 11 Pro",
  "iPhone 11",
  "iPhone XS Max",
  "iPhone XS",
  "iPhone XR",
  "iPhone X",
  "iPhone 8 Plus",
  "iPhone 8",
  "iPhone 7 Plus",
  "iPhone 7",
];
const pieceTypes = [
  "Bateria",
  "Tela frontal",
  "Display OLED",
  "Display LCD/Incell",
  "Touch",
  "Vidro frontal",
  "Tampa traseira",
  "Vidro traseiro",
  "Carcaça",
  "Lente da câmera traseira",
  "Câmera traseira",
  "Câmera frontal",
  "Flex do Face ID",
  "Flex de carga",
  "Dock de carga",
  "Microfone",
  "Alto-falante auricular",
  "Alto-falante viva-voz",
  "Taptic Engine",
  "Bandeja SIM",
  "Botão home",
  "Placa lógica",
  "Adesivo de vedação da tela",
  "Película",
  "Capinha",
  "Cabo",
  "Carregador",
];
const accessoryModels = ["Cabo Lightning", "Cabo USB-C", "Carregador 20W", "Capinha", "Película"];

const emptyForm = {
  nome: "",
  categoria: "Produto geral",
  marca: "",
  modelo: "",
  tipoPeca: "",
  sku: "",
  codigo_barras: "",
  fornecedor: "",
  custo_unitario: "",
  preco_venda: "",
  quantidade: "",
  estoque_minimo: "0",
  localizacao: "",
  garantia_dias: "",
  status: "ativo",
  observacoes: "",
};

const parseNumber = (value: string) => Number(value.replace(",", ".") || 0);
const parseInteger = (value: string) => Math.max(0, Math.floor(parseNumber(value)));
const softFieldClass =
  "h-10 rounded-xl border-border/80 bg-surface shadow-sm shadow-foreground/5 focus:ring-2 focus:ring-primary/15";
const softSectionClass =
  "grid gap-3 rounded-2xl border border-border/70 bg-surface p-4 shadow-sm shadow-foreground/5";
const marginPercent = (costValue: string, saleValue: string) => {
  const cost = parseNumber(costValue);
  const sale = parseNumber(saleValue);
  if (sale <= 0) return 0;
  return (Math.max(sale - cost, 0) / sale) * 100;
};

const productErrorMessage = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error ?? "");
  if (
    (typeof error === "object" && error && "code" in error && error.code === "PGRST205") ||
    message.includes("Could not find the table") ||
    message.includes("public.products") ||
    message.includes("products")
  ) {
    return "A tabela de produtos ainda não existe no Supabase. Por enquanto, o app salva os produtos neste navegador; para salvar na nuvem, aplique as migrations de produtos.";
  }
  return message || "Não foi possível carregar os produtos.";
};

function ProductsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const { data: products = [], isLoading, isError, error, refetch } = useProducts(deferredSearch);
  const upsert = useUpsertProduct();
  const del = useDeleteProduct();

  const stats = useMemo(() => {
    const totalValue = products.reduce((acc, item) => acc + item.preco_venda * item.quantidade, 0);
    const lowStock = products.filter((item) => item.quantidade <= item.estoque_minimo).length;
    const active = products.filter((item) => item.status !== "inativo").length;
    return { totalValue, lowStock, active };
  }, [products]);

  useEffect(() => {
    if (!editing) return;
    setForm({
      ...emptyForm,
      nome: editing.nome,
      categoria: editing.categoria ?? "Produto geral",
      marca: editing.marca ?? "",
      sku: editing.sku ?? "",
      codigo_barras: editing.codigo_barras ?? "",
      fornecedor: editing.fornecedor ?? "",
      custo_unitario: editing.custo_unitario ? String(editing.custo_unitario) : "",
      preco_venda: String(editing.preco_venda),
      quantidade: String(editing.quantidade),
      estoque_minimo: String(editing.estoque_minimo),
      localizacao: editing.localizacao ?? "",
      garantia_dias: editing.garantia_dias ? String(editing.garantia_dias) : "",
      status: editing.status ?? "ativo",
      observacoes: editing.observacoes ?? "",
    });
  }, [editing]);

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(false);
  };

  const startNewProduct = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpenForm(true);
    window.setTimeout(() => nameInputRef.current?.focus(), 180);
  };

  const startEditProduct = (product: Product) => {
    setEditing(product);
    setOpenForm(true);
    window.setTimeout(() => nameInputRef.current?.focus(), 180);
  };

  const updateCategory = (categoria: string) => {
    const marca =
      categoria === "Celular" || categoria === "Peça" || categoria === "Acessório"
        ? "Apple"
        : form.marca;
    setForm({
      ...form,
      categoria,
      marca,
      modelo: "",
      tipoPeca: "",
      estoque_minimo: categoria === "Celular" ? "0" : form.estoque_minimo || "1",
      garantia_dias:
        categoria === "Celular" ? "90" : categoria === "Peça" ? "30" : form.garantia_dias,
    });
  };

  const updatePreset = (patch: Partial<typeof emptyForm>) => {
    const next = { ...form, ...patch };
    const generatedName =
      next.categoria === "Peça" && next.tipoPeca && next.modelo
        ? `${next.tipoPeca} ${next.modelo}`
        : (next.categoria === "Celular" || next.categoria === "Acessório") && next.modelo
          ? next.modelo
          : next.nome;
    setForm({
      ...next,
      nome: generatedName,
      sku: generatedName
        ? generatedName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .toUpperCase()
        : next.sku,
    });
  };

  const submit = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    if (parseNumber(form.preco_venda) < 0) {
      toast.error("Informe um preço válido");
      return;
    }
    if (parseNumber(form.custo_unitario) < 0) {
      toast.error("Informe um custo válido");
      return;
    }
    if (parseNumber(form.quantidade) < 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }

    try {
      await upsert.mutateAsync({
        id: editing?.id,
        nome: form.nome.trim(),
        categoria: form.categoria.trim() || null,
        marca: form.marca.trim() || null,
        sku: form.sku.trim() || null,
        codigo_barras: form.codigo_barras.trim() || null,
        fornecedor: form.fornecedor.trim() || null,
        custo_unitario: parseNumber(form.custo_unitario),
        preco_venda: parseNumber(form.preco_venda),
        quantidade: parseInteger(form.quantidade),
        estoque_minimo: parseInteger(form.estoque_minimo),
        localizacao: form.localizacao.trim() || null,
        garantia_dias: parseInteger(form.garantia_dias),
        observacoes: form.observacoes.trim() || null,
        status: form.status,
      });
      toast.success(editing ? "Produto atualizado" : "Produto cadastrado");
      reset();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar produto");
    }
  };

  const askDelete = async (product: Product) => {
    if (!confirm(`Excluir produto "${product.nome}"?`)) return;
    try {
      await del.mutateAsync(product.id);
      toast.success("Produto excluído");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir produto");
    }
  };

  return (
    <AppShell>
      <div className="motion-list flex min-w-0 flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground">Produtos</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Cadastre seu estoque e baixe automaticamente quando fizer uma venda.
            </p>
          </div>
          <Button className="motion-pop w-full rounded-full sm:w-auto" onClick={startNewProduct}>
            <Plus className="h-3.5 w-3.5" /> Novo produto
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[22px] bg-surface p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">Produtos ativos</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{stats.active}</p>
          </div>
          <div className="rounded-[22px] bg-surface p-5 shadow-soft">
            <p className="text-xs text-muted-foreground">Valor em estoque</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{brl(stats.totalValue)}</p>
          </div>
          <div className="rounded-[22px] bg-[#062b35] p-5 text-white shadow-soft">
            <p className="text-xs text-white/70">Estoque baixo</p>
            <p className="mt-2 text-2xl font-semibold">{stats.lowStock}</p>
          </div>
        </div>

        <div className="rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
          <div className="relative mb-4 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou código"
              className="pl-9"
            />
          </div>

          <div className="hidden md:block">
            <table className="w-full table-fixed text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase text-muted-foreground">
                  <th className="w-[30%] py-2 font-medium">Produto</th>
                  <th className="w-[14%] py-2 font-medium">Categoria</th>
                  <th className="w-[18%] py-2 font-medium">Código</th>
                  <th className="w-[14%] py-2 font-medium text-right">Preço</th>
                  <th className="w-[12%] py-2 font-medium text-right">Estoque</th>
                  <th className="w-[12%] py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      Carregando...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-4 text-warning">
                        <strong>Cadastro de produtos ainda não está conectado ao banco.</strong>
                        <p className="text-sm leading-relaxed text-foreground">
                          {productErrorMessage(error)}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl bg-white"
                          onClick={() => refetch()}
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      Nenhum produto cadastrado.
                    </td>
                  </tr>
                )}
                {products.map((product) => {
                  const lowStock = product.quantidade <= product.estoque_minimo;
                  return (
                    <tr key={product.id} className="border-b border-border/60 hover:bg-muted/30">
                      <td className="truncate py-3 pr-3 font-medium">{product.nome}</td>
                      <td className="truncate py-3 pr-3 text-muted-foreground">
                        {product.categoria || "-"}
                      </td>
                      <td className="truncate py-3 pr-3 text-muted-foreground">
                        {product.sku || product.codigo_barras || "-"}
                      </td>
                      <td className="py-3 text-right">{brl(product.preco_venda)}</td>
                      <td className="py-3 text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            lowStock
                              ? "bg-destructive/10 text-destructive"
                              : "bg-success/10 text-success"
                          }`}
                        >
                          {product.quantidade} un.
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => startEditProduct(product)}
                            className="motion-pop grid h-8 w-8 place-items-center rounded-full bg-muted hover:bg-muted/70"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => askDelete(product)}
                            className="motion-pop grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {isLoading && (
              <div className="rounded-2xl border border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            )}
            {isError && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-4 text-center text-warning">
                <strong>Cadastro de produtos ainda não está conectado ao banco.</strong>
                <p className="text-sm leading-relaxed text-foreground">
                  {productErrorMessage(error)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl bg-white"
                  onClick={() => refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {!isLoading && !isError && products.length === 0 && (
              <div className="rounded-2xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhum produto cadastrado.
              </div>
            )}
            {products.map((product) => {
              const lowStock = product.quantidade <= product.estoque_minimo;
              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-border bg-surface px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {product.nome}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {product.categoria || "Sem categoria"} • {product.sku || "Sem código"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        lowStock
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {product.quantidade} un.
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-foreground">
                      {brl(product.preco_venda)}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => startEditProduct(product)}
                        className="motion-pop grid h-9 w-9 place-items-center rounded-full bg-muted hover:bg-muted/70"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => askDelete(product)}
                        className="motion-pop grid h-9 w-9 place-items-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Dialog open={openForm} onOpenChange={(open) => (open ? setOpenForm(true) : reset())}>
        <DialogContent className="clean-scrollbar max-h-[92vh] w-[calc(100vw-32px)] overflow-y-auto overflow-x-hidden border-white/70 bg-surface p-0 shadow-float sm:max-w-[760px] sm:rounded-2xl">
          <DialogHeader className="border-b border-border/70 px-5 pb-4 pt-5 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <PackagePlus className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-[19px] leading-tight">
              {editing ? "Editar produto completo" : "Cadastrar produto completo"}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Selecione categoria, marca e modelo para o Fiado preencher o produto mais rápido.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 px-5 py-5 sm:px-6">
            <div className={softSectionClass}>
              <h2 className="text-sm font-semibold text-foreground">Dados gerais</h2>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Categoria *">
                  <Select value={form.categoria} onValueChange={updateCategory}>
                    <SelectTrigger className={softFieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Marca">
                  <Select
                    value={form.marca || undefined}
                    onValueChange={(marca) => setForm({ ...form, marca })}
                  >
                    <SelectTrigger className={softFieldClass}>
                      <SelectValue placeholder="Selecionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandOptions.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {form.categoria === "Peça" && (
                  <Field label="Tipo de peça">
                    <Select
                      value={form.tipoPeca || undefined}
                      onValueChange={(tipoPeca) => updatePreset({ tipoPeca })}
                    >
                      <SelectTrigger className={softFieldClass}>
                        <SelectValue placeholder="Selecionar peça" />
                      </SelectTrigger>
                      <SelectContent>
                        {pieceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>

              {(form.categoria === "Celular" || form.categoria === "Peça") &&
                form.marca === "Apple" && (
                  <Field
                    label={form.categoria === "Peça" ? "Modelo compatível" : "Modelo do iPhone"}
                  >
                    <Select
                      value={form.modelo || undefined}
                      onValueChange={(modelo) => updatePreset({ modelo })}
                    >
                      <SelectTrigger className={softFieldClass}>
                        <SelectValue placeholder="Selecionar modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {iPhoneModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

              {form.categoria === "Acessório" && (
                <Field label="Preset de acessório">
                  <Select
                    value={form.modelo || undefined}
                    onValueChange={(modelo) => updatePreset({ modelo })}
                  >
                    <SelectTrigger className={softFieldClass}>
                      <SelectValue placeholder="Selecionar acessório" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessoryModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nome do produto *">
                  <Input
                    ref={nameInputRef}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Bateria iPhone 11"
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={form.status}
                    onValueChange={(status) => setForm({ ...form, status })}
                  >
                    <SelectTrigger className={softFieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="defeituoso">Defeituoso</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Código/SKU">
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="Código interno"
                  />
                </Field>
                <Field label="Código de barras">
                  <Input
                    value={form.codigo_barras}
                    onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
                    placeholder="EAN, UPC ou código manual"
                  />
                </Field>
              </div>
            </div>

            <div className={softSectionClass}>
              <h2 className="text-sm font-semibold text-foreground">Preço e margem</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Custo unitário (R$)">
                  <Input
                    value={form.custo_unitario}
                    onChange={(e) => setForm({ ...form, custo_unitario: e.target.value })}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </Field>
                <Field label="Preço de venda (R$) *">
                  <Input
                    value={form.preco_venda}
                    onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </Field>
                <Field label="Lucro previsto">
                  <Input
                    value={brl(
                      Math.max(parseNumber(form.preco_venda) - parseNumber(form.custo_unitario), 0),
                    )}
                    readOnly
                  />
                </Field>
                <Field label="Margem">
                  <Input
                    value={`${marginPercent(form.custo_unitario, form.preco_venda).toFixed(1)}%`}
                    readOnly
                  />
                </Field>
              </div>
            </div>

            <div className={softSectionClass}>
              <h2 className="text-sm font-semibold text-foreground">Estoque e fornecedor</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Quantidade em estoque">
                  <Input
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                    inputMode="numeric"
                    placeholder="0"
                  />
                </Field>
                <Field label="Estoque mínimo">
                  <Input
                    value={form.estoque_minimo}
                    onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                    inputMode="numeric"
                    placeholder="0"
                  />
                </Field>
                <Field label="Localização">
                  <Input
                    value={form.localizacao}
                    onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                    placeholder="Gaveta, caixa, prateleira"
                  />
                </Field>
                <Field label="Garantia em dias">
                  <Input
                    value={form.garantia_dias}
                    onChange={(e) => setForm({ ...form, garantia_dias: e.target.value })}
                    inputMode="numeric"
                    placeholder="0"
                  />
                </Field>
              </div>
              <Field label="Fornecedor">
                <Input
                  value={form.fornecedor}
                  onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
                  placeholder="Nome do fornecedor"
                />
              </Field>
            </div>

            <div className={softSectionClass}>
              <h2 className="text-sm font-semibold text-foreground">Observações</h2>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Detalhes do produto, condição, variações, combinado com fornecedor..."
                className="min-h-[96px] rounded-xl bg-surface"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border/70 bg-surface px-5 py-4 sm:px-6">
            <Button variant="ghost" className="h-11 rounded-xl px-5" onClick={reset}>
              Cancelar
            </Button>
            <Button className="h-11 rounded-xl px-5" onClick={submit} disabled={upsert.isPending}>
              {upsert.isPending
                ? "Salvando..."
                : editing
                  ? "Atualizar produto"
                  : "Cadastrar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
