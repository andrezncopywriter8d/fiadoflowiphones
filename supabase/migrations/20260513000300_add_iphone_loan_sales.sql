-- Backend para vendas por emprestimo/crediario da rota /lojadeiphone.
-- Mantem os contratos separados da base geral para a V2 evoluir sem quebrar o CRM atual.

CREATE TABLE IF NOT EXISTS public.iphone_loan_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('Celular', 'Peca', 'Servico', 'Combo')),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  principal_amount NUMERIC(12,2) NOT NULL CHECK (principal_amount >= 0),
  entry_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (entry_amount >= 0),
  financed_amount NUMERIC(12,2) NOT NULL CHECK (financed_amount >= 0),
  monthly_interest_rate NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (monthly_interest_rate >= 0),
  installments_count INTEGER NOT NULL CHECK (installments_count > 0),
  charge_day INTEGER NOT NULL CHECK (charge_day BETWEEN 1 AND 31),
  first_due_date DATE NOT NULL,
  programmed_total NUMERIC(12,2) NOT NULL CHECK (programmed_total >= 0),
  status TEXT NOT NULL DEFAULT 'em_aberto' CHECK (status IN ('em_aberto', 'parcial', 'quitado', 'atrasado', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.iphone_loan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_sale_id UUID NOT NULL REFERENCES public.iphone_loan_sales(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL CHECK (installment_number > 0),
  due_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'renegociado', 'cancelado')),
  whatsapp_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loan_sale_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_iphone_loan_sales_user_status
  ON public.iphone_loan_sales(user_id, status, first_due_date);

CREATE INDEX IF NOT EXISTS idx_iphone_loan_installments_due
  ON public.iphone_loan_installments(user_id, status, due_date);

ALTER TABLE public.iphone_loan_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iphone_loan_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iphone_loan_sales_select_own"
  ON public.iphone_loan_sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "iphone_loan_sales_insert_own"
  ON public.iphone_loan_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "iphone_loan_sales_update_own"
  ON public.iphone_loan_sales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "iphone_loan_sales_delete_own"
  ON public.iphone_loan_sales FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "iphone_loan_installments_select_own"
  ON public.iphone_loan_installments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "iphone_loan_installments_insert_own"
  ON public.iphone_loan_installments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "iphone_loan_installments_update_own"
  ON public.iphone_loan_installments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "iphone_loan_installments_delete_own"
  ON public.iphone_loan_installments FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.generate_iphone_loan_installments()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  i INTEGER;
  base_due DATE;
  due_month DATE;
  last_day INTEGER;
  installment_amount NUMERIC(12,2);
  corrected_amount NUMERIC(12,2);
BEGIN
  DELETE FROM public.iphone_loan_installments WHERE loan_sale_id = NEW.id;

  installment_amount := ROUND(NEW.programmed_total / NEW.installments_count, 2);

  FOR i IN 1..NEW.installments_count LOOP
    due_month := (date_trunc('month', NEW.first_due_date)::DATE + ((i - 1) || ' month')::INTERVAL)::DATE;
    last_day := EXTRACT(DAY FROM (date_trunc('month', due_month)::DATE + INTERVAL '1 month - 1 day'))::INTEGER;
    base_due := due_month + (LEAST(NEW.charge_day, last_day) - 1);
    corrected_amount := installment_amount;

    IF i = NEW.installments_count THEN
      corrected_amount := NEW.programmed_total - (installment_amount * (NEW.installments_count - 1));
    END IF;

    INSERT INTO public.iphone_loan_installments (
      user_id,
      loan_sale_id,
      installment_number,
      due_date,
      amount,
      status
    )
    VALUES (
      NEW.user_id,
      NEW.id,
      i,
      base_due,
      corrected_amount,
      CASE WHEN base_due < CURRENT_DATE THEN 'vencido' ELSE 'pendente' END
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_iphone_loan_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_loan_id UUID;
  open_count INTEGER;
  overdue_count INTEGER;
  paid_count INTEGER;
BEGIN
  target_loan_id := COALESCE(NEW.loan_sale_id, OLD.loan_sale_id);

  SELECT
    COUNT(*) FILTER (WHERE status <> 'pago'),
    COUNT(*) FILTER (WHERE status <> 'pago' AND due_date < CURRENT_DATE),
    COUNT(*) FILTER (WHERE status = 'pago')
  INTO open_count, overdue_count, paid_count
  FROM public.iphone_loan_installments
  WHERE loan_sale_id = target_loan_id;

  UPDATE public.iphone_loan_sales
  SET
    status = CASE
      WHEN open_count = 0 THEN 'quitado'
      WHEN overdue_count > 0 THEN 'atrasado'
      WHEN paid_count > 0 THEN 'parcial'
      ELSE 'em_aberto'
    END,
    updated_at = now()
  WHERE id = target_loan_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_iphone_loan_sales_generate_installments_insert ON public.iphone_loan_sales;
CREATE TRIGGER trg_iphone_loan_sales_generate_installments_insert
AFTER INSERT
ON public.iphone_loan_sales
FOR EACH ROW EXECUTE FUNCTION public.generate_iphone_loan_installments();

DROP TRIGGER IF EXISTS trg_iphone_loan_sales_generate_installments_update ON public.iphone_loan_sales;
CREATE TRIGGER trg_iphone_loan_sales_generate_installments_update
AFTER UPDATE OF programmed_total, installments_count, charge_day, first_due_date
ON public.iphone_loan_sales
FOR EACH ROW EXECUTE FUNCTION public.generate_iphone_loan_installments();

DROP TRIGGER IF EXISTS trg_iphone_loan_installments_recompute_sale_insert ON public.iphone_loan_installments;
CREATE TRIGGER trg_iphone_loan_installments_recompute_sale_insert
AFTER INSERT
ON public.iphone_loan_installments
FOR EACH ROW EXECUTE FUNCTION public.recompute_iphone_loan_status();

DROP TRIGGER IF EXISTS trg_iphone_loan_installments_recompute_sale_update ON public.iphone_loan_installments;
CREATE TRIGGER trg_iphone_loan_installments_recompute_sale_update
AFTER UPDATE OF status, paid_amount, paid_at, due_date
ON public.iphone_loan_installments
FOR EACH ROW EXECUTE FUNCTION public.recompute_iphone_loan_status();

DROP TRIGGER IF EXISTS trg_iphone_loan_installments_recompute_sale_delete ON public.iphone_loan_installments;
CREATE TRIGGER trg_iphone_loan_installments_recompute_sale_delete
AFTER DELETE
ON public.iphone_loan_installments
FOR EACH ROW EXECUTE FUNCTION public.recompute_iphone_loan_status();

DROP TRIGGER IF EXISTS trg_iphone_loan_sales_updated ON public.iphone_loan_sales;
CREATE TRIGGER trg_iphone_loan_sales_updated
BEFORE UPDATE ON public.iphone_loan_sales
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_iphone_loan_installments_updated ON public.iphone_loan_installments;
CREATE TRIGGER trg_iphone_loan_installments_updated
BEFORE UPDATE ON public.iphone_loan_installments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
