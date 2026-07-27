CREATE OR REPLACE FUNCTION public.registrar_denuncia(
  _tipo public.denuncia_tipo,
  _instituicao TEXT,
  _descricao TEXT,
  _cidade TEXT DEFAULT NULL,
  _estado TEXT DEFAULT NULL,
  _data_ocorrido DATE DEFAULT NULL,
  _contato TEXT DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE novo TEXT;
BEGIN
  IF length(btrim(_instituicao)) < 3 THEN
    RAISE EXCEPTION 'instituicao invalida';
  END IF;
  IF length(btrim(_descricao)) < 20 THEN
    RAISE EXCEPTION 'descricao muito curta';
  END IF;

  INSERT INTO public.denuncias (protocolo, tipo, instituicao, cidade, estado, data_ocorrido, descricao, contato)
  VALUES ('', _tipo, left(btrim(_instituicao), 150), left(btrim(_cidade), 100),
          upper(left(btrim(_estado), 2)), _data_ocorrido, left(btrim(_descricao), 4000),
          left(btrim(_contato), 150))
  RETURNING protocolo INTO novo;

  RETURN novo;
END; $$;

GRANT EXECUTE ON FUNCTION public.registrar_denuncia(public.denuncia_tipo, TEXT, TEXT, TEXT, TEXT, DATE, TEXT) TO anon, authenticated;