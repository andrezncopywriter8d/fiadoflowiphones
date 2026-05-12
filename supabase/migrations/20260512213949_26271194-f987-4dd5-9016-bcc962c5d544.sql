
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.compute_sale_status() SET search_path = public;
ALTER FUNCTION public.apply_payment_to_sale() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_sale_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_payment_to_sale() FROM PUBLIC, anon, authenticated;
