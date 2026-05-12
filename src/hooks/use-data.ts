import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  observacoes: string | null;
  created_at: string;
  client?: Client | null;
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
};

export type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  loja_nome: string | null;
  pix_chave: string | null;
};

const num = (v: any) => Number(v ?? 0);

// ============= CLIENTS =============
export function useClients(search?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clients", user?.id, search ?? ""],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (search) q = q.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,cpf.ilike.%${search}%`);
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
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).maybeSingle();
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
        const { error } = await supabase.from("clients").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert({ ...rest, user_id: user.id, nome: rest.nome ?? "" });
        if (error) throw error;
      }
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

// ============= SALES =============
export function useSales(opts: { status?: string; clientId?: string } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sales", user?.id, opts],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("sales")
        .select("*, client:clients(*)")
        .order("created_at", { ascending: false });
      if (opts.status) q = q.eq("status", opts.status);
      if (opts.clientId) q = q.eq("client_id", opts.clientId);
      const { data, error } = await q;
      if (error) throw error;
      return ((data ?? []) as any[]).map((s) => ({
        ...s,
        valor_total: num(s.valor_total),
        valor_pago: num(s.valor_pago),
        saldo_restante: num(s.saldo_restante),
      })) as Sale[];
    },
  });
}

export function useUpsertSale() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: Partial<Sale> & { id?: string }) => {
      if (!user) throw new Error("not authenticated");
      const { id, client, ...rest } = payload as any;
      if (id) {
        const { error } = await supabase.from("sales").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sales").insert({ ...rest, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ============= PAYMENTS =============
export function usePayments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, client:clients(*), sale:sales(*)")
        .order("data_pagamento", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as any[]).map((p) => ({ ...p, valor_pago: num(p.valor_pago) })) as Payment[];
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
      await supabase.from("sales").update({ updated_at: new Date().toISOString() }).eq("id", payload.sale_id);
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .order("data_lembrete", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Reminder[];
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
        const { error } = await supabase
          .from("reminders")
          .insert({ ...rest, user_id: user.id, titulo: rest.titulo ?? "Lembrete", data_lembrete: rest.data_lembrete! });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });
}

// ============= CHARGE LOG =============
export function useLogCharge() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: { client_id: string; sale_id?: string; mensagem_usada: string }) => {
      if (!user) throw new Error("not authenticated");
      const { error } = await supabase.from("charge_logs").insert({ ...payload, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["charge_logs"] }),
  });
}

// ============= PROFILE =============
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
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
      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
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
    queryFn: async () => {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const todayISO = today.toISOString().slice(0, 10);

      const [salesRes, paymentsRes, clientsRes, todayPaymentsRes] = await Promise.all([
        supabase.from("sales").select("*, client:clients(nome,telefone)"),
        supabase.from("payments").select("valor_pago, data_pagamento"),
        supabase.from("clients").select("id"),
        supabase
          .from("payments")
          .select("valor_pago, data_pagamento")
          .eq("data_pagamento", todayISO),
      ]);

      if (salesRes.error) throw salesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      const sales = (salesRes.data ?? []).map((s: any) => ({
        ...s,
        valor_total: num(s.valor_total),
        valor_pago: num(s.valor_pago),
        saldo_restante: num(s.saldo_restante),
        // recompute status client-side to ensure overdue is fresh
        status: computeStatus(num(s.valor_total), num(s.valor_pago), s.data_vencimento),
      })) as Sale[];

      const payments = (paymentsRes.data ?? []).map((p: any) => ({ ...p, valor_pago: num(p.valor_pago) }));

      const monthSales = sales.filter((s) => s.data_venda >= monthStart);
      const monthPayments = payments.filter((p) => p.data_pagamento >= monthStart);

      const totalVendido = monthSales.reduce((a, s) => a + s.valor_total, 0);
      const totalRecebido = monthPayments.reduce((a, p) => a + p.valor_pago, 0);
      const totalAberto = sales.reduce((a, s) => a + s.saldo_restante, 0);
      const totalVencido = sales
        .filter((s) => s.status === "vencido")
        .reduce((a, s) => a + s.saldo_restante, 0);
      const recebidoHoje = (todayPaymentsRes.data ?? []).reduce(
        (a: number, p: any) => a + num(p.valor_pago),
        0
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
          nome: (s as any).client?.nome ?? "—",
          telefone: (s as any).client?.telefone ?? null,
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
        .filter((s) => s.status !== "pago" && s.status !== "cancelado" && s.data_vencimento === todayISO)
        .slice(0, 6);

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
          cobrancasHoje: todayCharges.length,
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
