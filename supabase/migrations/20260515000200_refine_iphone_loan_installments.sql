-- Refina emprestimos da V2: separa divida total, valor programado e valor pago.

ALTER TABLE public.iphone_loan_sales
  ADD COLUMN IF NOT EXISTS valor_total_emprestimo NUMERIC(12,2);

UPDATE public.iphone_loan_sales
SET valor_total_emprestimo = COALESCE(valor_total_emprestimo, programmed_total, financed_amount, 0)
WHERE valor_total_emprestimo IS NULL;

ALTER TABLE public.iphone_loan_sales
  ALTER COLUMN valor_total_emprestimo SET DEFAULT 0,
  ALTER COLUMN valor_total_emprestimo SET NOT NULL;

ALTER TABLE public.iphone_loan_installments
  ADD COLUMN IF NOT EXISTS valor_programado NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(12,2);

UPDATE public.iphone_loan_installments
SET
  valor_programado = COALESCE(valor_programado, amount, 0),
  valor_pago = COALESCE(valor_pago, paid_amount, CASE WHEN status = 'pago' THEN amount ELSE 0 END, 0);

ALTER TABLE public.iphone_loan_installments
  ALTER COLUMN valor_programado SET DEFAULT 0,
  ALTER COLUMN valor_programado SET NOT NULL,
  ALTER COLUMN valor_pago SET DEFAULT 0,
  ALTER COLUMN valor_pago SET NOT NULL;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'iphone_loan_installments'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.iphone_loan_installments DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

UPDATE public.iphone_loan_installments
SET status = CASE
  WHEN valor_pago >= valor_programado AND valor_programado > 0 THEN 'pago'
  WHEN valor_pago > 0 AND valor_pago < valor_programado THEN 'parcial'
  WHEN valor_pago = 0 AND due_date < CURRENT_DATE THEN 'atrasado'
  ELSE 'em_aberto'
END;

ALTER TABLE public.iphone_loan_installments
  ADD CONSTRAINT iphone_loan_installments_status_check
  CHECK (status IN ('em_aberto', 'pago', 'parcial', 'atrasado', 'renegociado', 'cancelado'));
