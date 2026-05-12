
-- ===== Profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  loja_nome TEXT,
  pix_chave TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Clients =====
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf TEXT,
  endereco TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'sem_divida',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_user ON public.clients(user_id);

CREATE POLICY "clients_select_own" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_update_own" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_delete_own" ON public.clients FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Sales =====
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_pago NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_restante NUMERIC(12,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sales_user ON public.sales(user_id);
CREATE INDEX idx_sales_client ON public.sales(client_id);

CREATE POLICY "sales_select_own" ON public.sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sales_insert_own" ON public.sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_update_own" ON public.sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sales_delete_own" ON public.sales FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Compute saldo + status automatically
CREATE OR REPLACE FUNCTION public.compute_sale_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.saldo_restante := GREATEST(NEW.valor_total - NEW.valor_pago, 0);
  IF NEW.valor_pago >= NEW.valor_total AND NEW.valor_total > 0 THEN
    NEW.status := 'pago';
  ELSIF NEW.valor_pago > 0 AND NEW.valor_pago < NEW.valor_total THEN
    IF NEW.data_vencimento IS NOT NULL AND NEW.data_vencimento < CURRENT_DATE THEN
      NEW.status := 'vencido';
    ELSE
      NEW.status := 'parcial';
    END IF;
  ELSE
    IF NEW.data_vencimento IS NOT NULL AND NEW.data_vencimento < CURRENT_DATE THEN
      NEW.status := 'vencido';
    ELSE
      NEW.status := 'pendente';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_sales_status BEFORE INSERT OR UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.compute_sale_status();

-- ===== Payments =====
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  valor_pago NUMERIC(12,2) NOT NULL,
  forma_pagamento TEXT,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_sale ON public.payments(sale_id);

CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "payments_update_own" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "payments_delete_own" ON public.payments FOR DELETE USING (auth.uid() = user_id);

-- After payment insert: bump sale.valor_pago
CREATE OR REPLACE FUNCTION public.apply_payment_to_sale()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.sales
  SET valor_pago = valor_pago + NEW.valor_pago
  WHERE id = NEW.sale_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_payment_apply AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.apply_payment_to_sale();

-- ===== Reminders =====
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_lembrete DATE NOT NULL,
  horario_lembrete TIME,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_select_own" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_own" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_own" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete_own" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_reminders_updated BEFORE UPDATE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== Charge logs =====
CREATE TABLE public.charge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  mensagem_usada TEXT,
  data_cobranca TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'enviada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.charge_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charge_logs_select_own" ON public.charge_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "charge_logs_insert_own" ON public.charge_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
