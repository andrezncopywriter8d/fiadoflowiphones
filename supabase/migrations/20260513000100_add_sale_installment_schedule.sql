ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS parcelas_total INTEGER NOT NULL DEFAULT 1 CHECK (parcelas_total >= 1 AND parcelas_total <= 60),
  ADD COLUMN IF NOT EXISTS dia_cobranca INTEGER CHECK (dia_cobranca >= 1 AND dia_cobranca <= 31),
  ADD COLUMN IF NOT EXISTS valor_parcela NUMERIC(12,2);

CREATE INDEX IF NOT EXISTS idx_reminders_due_status
  ON public.reminders(user_id, data_lembrete, status);

CREATE INDEX IF NOT EXISTS idx_sales_installment_schedule
  ON public.sales(user_id, dia_cobranca, parcelas_total);
