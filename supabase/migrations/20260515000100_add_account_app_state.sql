CREATE TABLE IF NOT EXISTS public.app_state (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, scope)
);

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_app_state_scope
  ON public.app_state(scope);

DROP POLICY IF EXISTS "app_state_select_own" ON public.app_state;
CREATE POLICY "app_state_select_own" ON public.app_state
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "app_state_insert_own" ON public.app_state;
CREATE POLICY "app_state_insert_own" ON public.app_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "app_state_update_own" ON public.app_state;
CREATE POLICY "app_state_update_own" ON public.app_state
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "app_state_delete_own" ON public.app_state;
CREATE POLICY "app_state_delete_own" ON public.app_state
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_app_state_updated ON public.app_state;
CREATE TRIGGER trg_app_state_updated
BEFORE UPDATE ON public.app_state
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
