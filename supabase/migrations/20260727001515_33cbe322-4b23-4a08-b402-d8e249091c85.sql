CREATE TYPE public.denuncia_tipo AS ENUM ('verbal', 'fisica', 'infraestrutura', 'outro');
CREATE TYPE public.denuncia_status AS ENUM ('recebida', 'em_analise', 'encaminhada', 'resolvida');

CREATE TABLE public.denuncias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocolo TEXT NOT NULL UNIQUE,
  tipo public.denuncia_tipo NOT NULL,
  instituicao TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  data_ocorrido DATE,
  descricao TEXT NOT NULL,
  contato TEXT,
  status public.denuncia_status NOT NULL DEFAULT 'recebida',
  resposta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.denuncias TO anon, authenticated;
GRANT ALL ON public.denuncias TO service_role;

ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode registrar denuncia"
ON public.denuncias FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER denuncias_updated_at BEFORE UPDATE ON public.denuncias
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.gerar_protocolo()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE novo TEXT; BEGIN
  LOOP
    novo := 'DEN-' || to_char(now(), 'YYYY') || '-' ||
            upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.denuncias WHERE protocolo = novo);
  END LOOP;
  RETURN novo;
END; $$;

CREATE OR REPLACE FUNCTION public.denuncias_set_protocolo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.protocolo := public.gerar_protocolo();
  NEW.status := 'recebida';
  NEW.resposta := NULL;
  RETURN NEW;
END; $$;

CREATE TRIGGER denuncias_protocolo BEFORE INSERT ON public.denuncias
FOR EACH ROW EXECUTE FUNCTION public.denuncias_set_protocolo();

CREATE OR REPLACE FUNCTION public.consultar_denuncia(_protocolo TEXT)
RETURNS TABLE (
  protocolo TEXT,
  tipo public.denuncia_tipo,
  instituicao TEXT,
  cidade TEXT,
  estado TEXT,
  status public.denuncia_status,
  resposta TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.protocolo, d.tipo, d.instituicao, d.cidade, d.estado, d.status,
         d.resposta, d.created_at, d.updated_at
  FROM public.denuncias d
  WHERE d.protocolo = upper(trim(_protocolo))
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.consultar_denuncia(TEXT) TO anon, authenticated;