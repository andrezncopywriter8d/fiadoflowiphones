ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS categoria TEXT,
  ADD COLUMN IF NOT EXISTS marca TEXT,
  ADD COLUMN IF NOT EXISTS codigo_barras TEXT,
  ADD COLUMN IF NOT EXISTS fornecedor TEXT,
  ADD COLUMN IF NOT EXISTS custo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS localizacao TEXT,
  ADD COLUMN IF NOT EXISTS garantia_dias INTEGER NOT NULL DEFAULT 0 CHECK (garantia_dias >= 0);

CREATE INDEX IF NOT EXISTS idx_products_sku_barcode
  ON public.products(user_id, sku, codigo_barras);

