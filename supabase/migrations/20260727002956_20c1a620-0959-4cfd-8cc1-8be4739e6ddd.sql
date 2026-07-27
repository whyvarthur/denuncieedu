-- Remove direct API execution of SECURITY DEFINER (and helper) functions from anon/authenticated.
-- The app now calls these through trusted server functions using the service role.

REVOKE ALL ON FUNCTION public.registrar_denuncia(public.denuncia_tipo, text, text, text, text, date, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_denuncia(public.denuncia_tipo, text, text, text, text, date, text) TO service_role;

REVOKE ALL ON FUNCTION public.consultar_denuncia(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consultar_denuncia(text) TO service_role;

REVOKE ALL ON FUNCTION public.gerar_protocolo() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.gerar_protocolo() TO service_role;

REVOKE ALL ON FUNCTION public.denuncias_set_protocolo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;