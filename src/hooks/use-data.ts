import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { computeStatus } from "@/lib/status";

export type Client = {
  id: string;
  nome: string;
  telefone: string | null;
  cpf: string | null;
  endereco: string | null;
  observacoes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Sale = {
  id: string;
  client_id: string;
  descricao: string;
  valor_total: number;
  valor_pago: number;
  saldo_restante: number;
  forma_pagamento: string | null;
  status: string;
  data_venda: string;
  data_vencimento: string | null;
  parcelas_total: number;
  dia_cobranca: number | null;
  valor_parcela: number | null;
  observacoes: string | null;
  created_at: string;
  client?: Client | null;
  items?: SaleItem[];
};

export type Product = {
  id: string;
  nome: string;
  sku: string | null;
  preco_venda: number;
  quantidade: number;
  estoque_minimo: number;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  created_at: string;
};

export type SaleProductInput = {
  product_id: string;
  product_name: string;
  quantidade: number;
  preco_unitario: number;
};

export type Payment = {
  id: string;
  client_id: string;
  sale_id: string;
  valor_pago: number;
  forma_pagamento: string | null;
  data_pagamento: string;
  observacoes: string | null;
  created_at: string;
  client?: Client | null;
  sale?: Sale | null;
};

export type Reminder = {
  id: string;
  client_id: string | null;
  sale_id: string | null;
  titulo: string;
  descricao: string | null;
  data_lembrete: string;
  horario_lembrete: string | null;
  status: string;
  created_at: string;
  client?: Client | null;
  sale?: Sale | null;
};

export type ChargeNotification = Reminder & {
  client: Client | null;
  sale: Sale | null;
  source?: "reminder" | "sale";
};

export type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  loja_nome: string | null;
  pix_chave: string | null;
};

type RawSale = Omit<Sale, "valor_total" | "valor_pago" | "saldo_restante"> & {
  valor_total: number | string | null;
  valor_pago: number | string | null;
  saldo_restante: number | string | null;
};

type RawPayment = Omit<Payment, "valor_pago"> & {
  valor_pago: number | string | null;
};

type RawProduct = Omit<Product, "preco_venda"> & {
  preco_venda: number | string | null;
};

type RawSaleItem = Omit<SaleItem, "preco_unitario" | "subtotal"> & {
  preco_unitario: number | string | null;
  subtotal: number | string | null;
};

const num = (v: number | string | null | undefined) => Number(v ?? 0);
const brlValue = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const installmentDate = (baseISO: string, day: number, monthOffset: number) => {
  const base = new Date(`${baseISO}T12:00:00`);
  const target = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1, 12);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return isoDate(target);
};

export const buildInstallmentSchedule = ({
  startDate,
  chargeDay,
  count,
}: {
  startDate: string;
  chargeDay: number;
  count: number;
}) => Array.from({ length: count }, (_, index) => installmentDate(startDate, chargeDay, index));

const normalizeProduct = (p: RawProduct): Product => ({
  ...p,
  preco_venda: num(p.preco_venda),
});

const isProductSchemaError = (error: unknown) => {
  const value = error as { code?: string; message?: string } | null;
  const message = value?.message ?? String(error ?? "");
  return (
    value?.code === "PGRST205" ||
    message.includes("public.products") ||
    message.includes("public.sale_items") ||
    message.includes("Could not find the table")
  );
};

const localProductKey = (userId: string) => `fiado:products:${userId}`;

const readLocalProducts = (userId: string, search?: string) => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(localProductKey(userId));
  const products = raw ? (JSON.parse(raw) as RawProduct[]) : [];
  const normalized = products
    .map(normalizeProduct)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const term = search?.trim().toLowerCase();
  if (!term) return normalized;
  return normalized.filter(
    (product) =>
      product.nome.toLowerCase().includes(term) || (product.sku ?? "").toLowerCase().includes(term),
  );
};

const writeLocalProducts = (userId: string, products: Product[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localProductKey(userId), JSON.stringify(products));
};

const saveLocalProduct = (
  userId: string,
  payload: Partial<Product> & { id?: string; nome: string },
) => {
  const now = new Date().toISOString();
  const products = readLocalProducts(userId);
  const existing = payload.id ? products.find((product) => product.id === payload.id) : null;
  const saved: Product = {
    id: payload.id ?? crypto.randomUUID(),
    nome: payload.nome,
    sku: payload.sku ?? null,
    preco_venda: num(payload.preco_venda),
    quantidade: Number(payload.quantidade ?? 0),
    estoque_minimo: Number(payload.estoque_minimo ?? 0),
    status: payload.status ?? "ativo",
    observacoes: payload.observacoes ?? null,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  writeLocalProducts(
    userId,
    existing
      ? products.map((product) => (product.id === saved.id ? saved : product))
      : [saved, ...products],
  );
  return saved;
};

const normalizeSaleItem = (item: RawSaleItem): SaleItem => ({
  ...item,
  preco_unitario: num(item.preco_unitario),
  subtotal: num(item.subtotal),
});

const restoreSaleItemsToStock = async (saleId: string) => {
  const { data, error } = await supabase.from("sale_items").select("*").eq("sale_id", saleId);
  if (error) throw error;

  const items = ((data ?? []) as RawSaleItem[]).map(normalizeSaleItem);
  for (const item of items) {
    if (!item.product_id) continue;
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("quantidade")
      .eq("id", item.product_id)
      .maybeSingle();
    if (productError) throw productError;
    const { error: updateError } = await supabase
      .from("products")
      .update({ quantidade: (product?.quantidade ?? 0) + item.quantidade })
      .eq("id", item.product_id);
    if (updateError) throw updateError;
  }
};

// ============= CLIENTS =============
export function useClients(search?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clients", user?.id, search ?? ""],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (search)
        q = q.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,cpf.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Client[];
    },
  });
}

export function useClient(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["client", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Client | null;
    },
  });
}

export function useUpsertClient() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Client> & { id?: string }) => {
      if (!user) throw new Error("not authenticated");
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase
          .from("clients")
          .update(rest)
          .eq("id", id)
          .select()
          .maybeSingle();
        if (error) throw error;
        return data as Client | null;
      }
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...rest, user_id: user.id, nome: rest.nome ?? "" })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data as Client | null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============= PRODUCTS =============
export function useProducts(search?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["products", user?.id, search ?? ""],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (search) q = q.or(`nome.ilike.%${search}%,sku.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) {
        if (isProductSchemaError(error)) return readLocalProducts(user.id, search);
        throw error;
      }
      return ((data ?? []) as RawProduct[]).map(normalizeProduct);
    },
  });
}

export function useUpsertProduct() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Product> & { id?: string; nome: string }) => {
      if (!user) throw new Error("not authenticated");
      const { id, ...rest } = payload;
      if (id) {
        const { data, error } = await supabase
          .from("products")
          .update(rest)
          .eq("id", id)
          .select()
          .maybeSingle();
        if (error) {
          if (isProductSchemaError(error)) return saveLocalProduct(user.id, payload);
          throw error;
        }
        return data ? normalizeProduct(data as RawProduct) : null;
      }
      const { data, error } = await supabase
        .from("products")
        .insert({ ...rest, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) {
        if (isProductSchemaError(error)) return saveLocalProduct(user.id, payload);
        throw error;
      }
      return data ? normalizeProduct(data as RawProduct) : null;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        if (user && isProductSchemaError(error)) {
          writeLocalProducts(
            user.id,
            readLocalProducts(user.id).filter((product) => product.id !== id),
          );
          return;
        }
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

// ============= SALES =============
export function useSales(opts: { status?: string; clientId?: string } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sales", user?.id, opts],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let q = supabase
        .from("sales")
        .select("*, client:clients(*)")
        .order("created_at", { ascending: false });
      if (opts.status) q = q.eq("status", opts.status);
      if (opts.clientId) q = q.eq("client_id", opts.clientId);
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as RawSale[]).map((s) => ({
        ...s,
        valor_total: num(s.valor_total),
        valor_pago: num(s.valor_pago),
        saldo_restante: num(s.saldo_restante),
      })) as Sale[];
    },
  });
}

export function useSaleItems(saleId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sale-items", saleId],
    enabled: !!user && !!saleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", saleId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as RawSaleItem[]).map(normalizeSaleItem);
    },
  });
}

export function useUpsertSale() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (
      payload: Partial<Omit<Sale, "client" | "items">> & {
        id?: string;
        items?: SaleProductInput[];
      },
    ) => {
      if (!user) throw new Error("not authenticated");
      const { id, items = [], ...rest } = payload;
      const shouldSchedule =
        rest.forma_pagamento === "fiado" &&
        Number(rest.parcelas_total ?? 1) > 1 &&
        Number(rest.dia_cobranca ?? 0) > 0;

      const valorParcela =
        shouldSchedule && rest.valor_total
          ? Number(
              ((rest.valor_total - (rest.valor_pago ?? 0)) / Number(rest.parcelas_total)).toFixed(
                2,
              ),
            )
          : null;

      const salePayload = {
        ...rest,
        parcelas_total: shouldSchedule ? Number(rest.parcelas_total) : 1,
        dia_cobranca: shouldSchedule ? Number(rest.dia_cobranca) : null,
        valor_parcela: valorParcela,
      };

      let saved: Sale | null = null;
      if (id) {
        await restoreSaleItemsToStock(id);
      }
      if (id) {
        const { data, error } = await supabase
          .from("sales")
          .update(salePayload)
          .eq("id", id)
          .select("*, client:clients(*)")
          .maybeSingle();
        if (error) throw error;
        saved = data as Sale | null;
      } else {
        const { data, error } = await supabase
          .from("sales")
          .insert({ ...salePayload, user_id: user.id })
          .select("*, client:clients(*)")
          .maybeSingle();
        if (error) throw error;
        saved = data as Sale | null;
      }

      if (!saved) return null;

      await supabase.from("sale_items").delete().eq("sale_id", saved.id);

      if (items.length > 0) {
        for (const item of items) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("quantidade")
            .eq("id", item.product_id)
            .maybeSingle();
          if (productError) throw productError;
          if (!product) throw new Error(`Produto "${item.product_name}" não encontrado`);
          if (product.quantidade < item.quantidade) {
            throw new Error(`Estoque insuficiente para ${item.product_name}`);
          }
        }

        const saleItems = items.map((item) => ({
          user_id: user.id,
          sale_id: saved!.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: Number((item.preco_unitario * item.quantidade).toFixed(2)),
        }));
        const { error } = await supabase.from("sale_items").insert(saleItems);
        if (error) throw error;

        for (const item of items) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("quantidade")
            .eq("id", item.product_id)
            .maybeSingle();
          if (productError) throw productError;
          const { error: updateError } = await supabase
            .from("products")
            .update({ quantidade: Math.max((product?.quantidade ?? 0) - item.quantidade, 0) })
            .eq("id", item.product_id);
          if (updateError) throw updateError;
        }
      }

      await supabase.from("reminders").delete().eq("sale_id", saved.id);

      if (shouldSchedule && saved.dia_cobranca && saved.parcelas_total > 1) {
        const startDate = saved.data_vencimento ?? saved.data_venda;
        const dates = buildInstallmentSchedule({
          startDate,
          chargeDay: saved.dia_cobranca,
          count: saved.parcelas_total,
        });
        const reminders = dates.map((date, index) => ({
          user_id: user.id,
          client_id: saved.client_id,
          sale_id: saved.id,
          data_lembrete: date,
          horario_lembrete: "09:00",
          titulo: `Cobrança ${index + 1}/${saved.parcelas_total}`,
          descricao: `${saved.descricao} • ${valorParcela ? `Parcela ${brlValue(valorParcela)}` : "Parcela"}`,
          status: "pendente",
        }));
        const { error } = await supabase.from("reminders").insert(reminders);
        if (error) throw error;
      }

      return saved;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["sale-items"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["charge-notifications"] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await restoreSaleItemsToStock(id);
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ============= PAYMENTS =============
export function usePayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["payments", user?.id],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, client:clients(*), sale:sales(*)")
        .order("data_pagamento", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as RawPayment[]).map((p) => ({
        ...p,
        valor_pago: num(p.valor_pago),
      })) as Payment[];
    },
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      sale_id: string;
      client_id: string;
      valor_pago: number;
      forma_pagamento: string;
      data_pagamento: string;
      observacoes?: string;
    }) => {
      if (!user) throw new Error("not authenticated");
      const { error } = await supabase.from("payments").insert({ ...payload, user_id: user.id });
      if (error) throw error;
      // After insert trigger updates sale.valor_pago. Force recompute by touching sale.
      await supabase
        .from("sales")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", payload.sale_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============= REMINDERS =============
export function useReminders() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reminders", user?.id],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, client:clients(*), sale:sales(*)")
        .order("data_lembrete", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Reminder[];
    },
  });
}

export function useChargeNotifications(date = isoDate(new Date())) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["charge-notifications", user?.id, date],
    enabled: !!user,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const [remindersRes, salesRes] = await Promise.all([
        supabase
          .from("reminders")
          .select("*, client:clients(*), sale:sales(*)")
          .lte("data_lembrete", date)
          .eq("status", "pendente")
          .order("data_lembrete", { ascending: true }),
        supabase
          .from("sales")
          .select("*, client:clients(*)")
          .gt("saldo_restante", 0)
          .or(`data_vencimento.is.null,data_vencimento.lte.${date}`)
          .order("data_vencimento", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: true }),
      ]);

      if (remindersRes.error) throw remindersRes.error;
      if (salesRes.error) throw salesRes.error;

      const reminders = ((remindersRes.data ?? []) as ChargeNotification[]).map((item) => ({
        ...item,
        source: "reminder" as const,
      }));
      const reminderSaleIds = new Set(reminders.map((item) => item.sale_id).filter(Boolean));
      const sales = ((salesRes.data ?? []) as RawSale[])
        .filter((sale) => !reminderSaleIds.has(sale.id))
        .map((sale) => {
          const normalizedSale = {
            ...sale,
            valor_total: num(sale.valor_total),
            valor_pago: num(sale.valor_pago),
            saldo_restante: num(sale.saldo_restante),
          } as Sale;

          return {
            id: `sale-${normalizedSale.id}`,
            client_id: normalizedSale.client_id,
            sale_id: normalizedSale.id,
            titulo: "Cobrança da venda",
            descricao: normalizedSale.descricao,
            data_lembrete: normalizedSale.data_vencimento ?? normalizedSale.data_venda,
            horario_lembrete: null,
            status: "pendente",
            created_at: normalizedSale.created_at,
            client: normalizedSale.client ?? null,
            sale: normalizedSale,
            source: "sale" as const,
          } satisfies ChargeNotification;
        });

      return [...reminders, ...sales].sort((a, b) =>
        a.data_lembrete.localeCompare(b.data_lembrete),
      );
    },
  });
}

export function useUpsertReminder() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Reminder> & { id?: string }) => {
      if (!user) throw new Error("not authenticated");
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await supabase.from("reminders").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reminders").insert({
          ...rest,
          user_id: user.id,
          titulo: rest.titulo ?? "Lembrete",
          data_lembrete: rest.data_lembrete!,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["charge-notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["charge-notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============= CHARGE LOG =============
export function useLogCharge() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      client_id: string;
      sale_id?: string;
      mensagem_usada: string;
    }) => {
      if (!user) throw new Error("not authenticated");
      const { error } = await supabase.from("charge_logs").insert({ ...payload, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["charge_logs"] }),
  });
}

export function useMarkReminderNotified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reminders")
        .update({ status: "notificado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["charge-notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============= PROFILE =============
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Profile>) => {
      if (!user) throw new Error("not authenticated");
      const { error } = await supabase.from("profiles").upsert({
        ...payload,
        id: user.id,
        email: payload.email ?? user.email ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

// ============= DASHBOARD AGGREGATES =============
export function useDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const todayISO = today.toISOString().slice(0, 10);

      const [salesRes, paymentsRes, clientsRes, todayPaymentsRes, dueRemindersRes] =
        await Promise.all([
          supabase.from("sales").select("*, client:clients(nome,telefone)"),
          supabase.from("payments").select("valor_pago, data_pagamento"),
          supabase.from("clients").select("id"),
          supabase
            .from("payments")
            .select("valor_pago, data_pagamento")
            .eq("data_pagamento", todayISO),
          supabase
            .from("reminders")
            .select("id")
            .lte("data_lembrete", todayISO)
            .eq("status", "pendente"),
        ]);

      if (salesRes.error) throw salesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (dueRemindersRes.error) throw dueRemindersRes.error;

      const sales = ((salesRes.data ?? []) as RawSale[]).map((s) => ({
        ...s,
        valor_total: num(s.valor_total),
        valor_pago: num(s.valor_pago),
        saldo_restante: num(s.saldo_restante),
        // recompute status client-side to ensure overdue is fresh
        status: computeStatus(num(s.valor_total), num(s.valor_pago), s.data_vencimento),
      })) as Sale[];

      const payments = ((paymentsRes.data ?? []) as RawPayment[]).map((p) => ({
        ...p,
        valor_pago: num(p.valor_pago),
      }));

      const monthSales = sales.filter((s) => s.data_venda >= monthStart);
      const monthPayments = payments.filter((p) => p.data_pagamento >= monthStart);

      const totalVendido = monthSales.reduce((a, s) => a + s.valor_total, 0);
      const totalRecebido = monthPayments.reduce((a, p) => a + p.valor_pago, 0);
      const totalAberto = sales.reduce((a, s) => a + s.saldo_restante, 0);
      const totalVencido = sales
        .filter((s) => s.status === "vencido")
        .reduce((a, s) => a + s.saldo_restante, 0);
      const recebidoHoje = ((todayPaymentsRes.data ?? []) as RawPayment[]).reduce(
        (a, p) => a + num(p.valor_pago),
        0,
      );

      // monthly bars (last 5 months)
      const months: { mes: string; recebido: number; fiado: number; key: string }[] = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
        const start = d.toISOString().slice(0, 10);
        const recebido = payments
          .filter((p) => p.data_pagamento >= start && p.data_pagamento < next)
          .reduce((a, p) => a + p.valor_pago, 0);
        const fiado = sales
          .filter((s) => s.data_venda >= start && s.data_venda < next)
          .reduce((a, s) => a + (s.valor_total - s.valor_pago), 0);
        months.push({
          mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
          recebido,
          fiado,
          key,
        });
      }

      // top 5 devedores
      const byClient = new Map<string, { nome: string; telefone: string | null; saldo: number }>();
      for (const s of sales) {
        if (s.saldo_restante <= 0) continue;
        const k = s.client_id;
        const cur = byClient.get(k) ?? {
          nome: s.client?.nome ?? "—",
          telefone: s.client?.telefone ?? null,
          saldo: 0,
        };
        cur.saldo += s.saldo_restante;
        byClient.set(k, cur);
      }
      const topDebtors = Array.from(byClient.entries())
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.saldo - a.saldo)
        .slice(0, 5);

      const overdueSales = sales
        .filter((s) => s.status === "vencido")
        .sort((a, b) => (a.data_vencimento ?? "").localeCompare(b.data_vencimento ?? ""))
        .slice(0, 6);

      const todayCharges = sales
        .filter(
          (s) => s.status !== "pago" && s.status !== "cancelado" && s.data_vencimento === todayISO,
        )
        .slice(0, 6);
      const dueReminderCount = dueRemindersRes.data?.length ?? 0;

      const recentSales = [...sales]
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
        .slice(0, 6);

      return {
        totals: {
          totalVendido,
          totalRecebido,
          totalAberto,
          totalVencido,
          recebidoHoje,
          totalClientes: clientsRes.data?.length ?? 0,
          cobrancasHoje: dueReminderCount || todayCharges.length,
        },
        months,
        topDebtors,
        overdueSales,
        todayCharges,
        recentSales,
      };
    },
  });
}
