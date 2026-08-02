CREATE TYPE public.moderacao_status AS ENUM ('pendente', 'aprovada', 'rejeitada');

ALTER TABLE public.denuncias
  ADD COLUMN IF NOT EXISTS moderacao public.moderacao_status NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS motivo_rejeicao text,
  ADD COLUMN IF NOT EXISTS criptografado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS score_risco integer NOT NULL DEFAULT 0;

CREATE TABLE public.denuncia_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo text NOT NULL,
  caminho text NOT NULL,
  nome text NOT NULL,
  tipo text,
  tamanho bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_denuncia_anexos_protocolo ON public.denuncia_anexos(protocolo);

GRANT ALL ON public.denuncia_anexos TO service_role;

ALTER TABLE public.denuncia_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sem acesso direto aos anexos" ON public.denuncia_anexos FOR SELECT USING (false);