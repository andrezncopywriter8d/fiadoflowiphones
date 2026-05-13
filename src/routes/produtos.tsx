import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useDeferredValue, useEffect, useRef, useState } from "react";
import { PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const emptyForm = {
  nome: "",
  categoria: "",
  marca: "",
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
    return "A tabela de produtos ainda não existe no Supabase. Por enquanto, o app salva os produtos neste navegador; para salvar na nuvem, aplique a migration supabase/migrations/20260513000200_add_products_inventory.sql.";
  }
  return message || "Não foi possível carregar os produtos.";
};

function ProductsPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const formRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const { data: products = [], isLoading, isError, error, refetch } = useProducts(deferredSearch);
  const upsert = useUpsertProduct();
  const del = useDeleteProduct();

  useEffect(() => {
    if (!editing) return;
    setForm({
      nome: editing.nome,
      categoria: editing.categoria ?? "",
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
  };

  const startNewProduct = () => {
    reset();
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => nameInputRef.current?.focus(), 280);
    });
  };

  const startEditProduct = (product: Product) => {
    setEditing(product);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => nameInputRef.current?.focus(), 280);
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

        <div ref={formRef} className="scroll-mt-6 rounded-[22px] bg-surface p-4 shadow-soft sm:p-5">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold">
            <PackagePlus className="h-4 w-4 text-primary" />
            {editing ? "Editar produto completo" : "Cadastro completo de produto"}
          </div>

          <div className="grid gap-5">
            <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-muted/50 p-4">
              <h2 className="text-sm font-semibold text-foreground">Dados gerais</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_0.8fr_0.8fr]">
                <Field label="Nome do produto *">
                  <Input
                    ref={nameInputRef}
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Perfume 123, Tela iPhone 11, Camiseta..."
                  />
                </Field>
                <Field label="Categoria">
                  <Input
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Ex: Celular, Peça, Acessório"
                  />
                </Field>
                <Field label="Marca">
                  <Input
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    placeholder="Ex: Apple, Natura"
                  />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="reservado">Reservado</option>
                    <option value="inativo">Inativo</option>
                    <option value="defeituoso">Defeituoso</option>
                  </select>
                </Field>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-muted/50 p-4">
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

            <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-muted/50 p-4">
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

            <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface-muted/50 p-4">
              <h2 className="text-sm font-semibold text-foreground">Observações</h2>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Detalhes do produto, condição, variações, combinado com fornecedor..."
                className="min-h-[96px] rounded-xl bg-background"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {editing && (
                <Button variant="ghost" className="h-11 rounded-xl px-5" onClick={reset}>
                  Cancelar
                </Button>
              )}
              <Button className="h-11 rounded-xl px-5" onClick={submit} disabled={upsert.isPending}>
                {upsert.isPending
                  ? "Salvando..."
                  : editing
                    ? "Atualizar produto"
                    : "Cadastrar produto"}
              </Button>
            </div>
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
                  <th className="w-[34%] py-2 font-medium">Produto</th>
                  <th className="w-[20%] py-2 font-medium">Código</th>
                  <th className="w-[16%] py-2 font-medium text-right">Preço</th>
                  <th className="w-[15%] py-2 font-medium text-right">Estoque</th>
                  <th className="w-[15%] py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-muted-foreground">
                      Carregando...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
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
                    <td colSpan={5} className="py-10 text-center text-muted-foreground">
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
                        {product.sku || "-"}
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
                        {product.sku || "Sem código"}
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
    </AppShell>
  );
}
