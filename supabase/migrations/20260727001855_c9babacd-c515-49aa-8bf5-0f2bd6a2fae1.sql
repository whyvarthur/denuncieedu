DROP POLICY IF EXISTS "Qualquer pessoa pode registrar denuncia" ON public.denuncias;
REVOKE INSERT ON public.denuncias FROM anon, authenticated;