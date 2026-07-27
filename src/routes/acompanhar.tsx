import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Search = { protocolo?: string };

export const Route = createFileRoute("/acompanhar")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    protocolo: typeof search.protocolo === "string" ? search.protocolo : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acompanhar protocolo | Denuncie.edu" },
      {
        name: "description",
        content: "Consulte o status da sua denúncia escolar informando o código de protocolo recebido.",
      },
      { property: "og:title", content: "Acompanhar protocolo | Denuncie.edu" },
      {
        property: "og:description",
        content: "Veja se sua denúncia foi recebida, está em análise, foi encaminhada ou resolvida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Acompanhar,
});

const statusLabel: Record<string, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  encaminhada: "Encaminhada à instituição",
  resolvida: "Resolvida",
};

const tipoLabel: Record<string, string> = {
  verbal: "Agressão verbal",
  fisica: "Agressão física",
  infraestrutura: "Má infraestrutura",
  outro: "Outro",
};

const etapas = ["recebida", "em_analise", "encaminhada", "resolvida"];

type Denuncia = {
  protocolo: string;
  tipo: string;
  instituicao: string;
  cidade: string | null;
  estado: string | null;
  status: string;
  resposta: string | null;
  created_at: string;
  updated_at: string;
};

function Acompanhar() {
  const { protocolo } = Route.useSearch();
  const navigate = useNavigate();
  const [valor, setValor] = useState(protocolo ?? "");
  const [dados, setDados] = useState<Denuncia | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!protocolo) return;
    setValor(protocolo);
    let ativo = true;
    setCarregando(true);
    setErro(null);
    supabase
      .rpc("consultar_denuncia", { _protocolo: protocolo })
      .then(({ data, error }) => {
        if (!ativo) return;
        setCarregando(false);
        if (error) {
          setErro("Não foi possível consultar agora. Tente novamente.");
          setDados(null);
          return;
        }
        const row = (data as Denuncia[] | null)?.[0] ?? null;
        setDados(row);
        if (!row) setErro("Nenhuma denúncia encontrada com esse protocolo.");
      });
    return () => {
      ativo = false;
    };
  }, [protocolo]);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    const p = valor.trim().toUpperCase();
    if (!p) return;
    navigate({ to: "/acompanhar", search: { protocolo: p } });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight">
            DENUNCIE<span className="text-accent">.</span>EDU
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft size={15} /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">Acompanhar protocolo</h1>
        <p className="mt-3 text-muted-foreground">
          Informe o código recebido ao enviar a denúncia (ex.: DEN-2026-A1B2C3).
        </p>

        <form onSubmit={buscar} className="mt-7 flex flex-col gap-3 sm:flex-row">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="DEN-0000-XXXXXX"
            className="w-full rounded-md border border-border bg-card px-3 py-3 text-sm uppercase tracking-wide text-foreground outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-7 py-3 text-sm font-bold uppercase tracking-wide text-accent-foreground transition hover:brightness-110"
          >
            <Search size={16} /> Consultar
          </button>
        </form>

        {carregando && (
          <p className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Consultando...
          </p>
        )}

        {!carregando && erro && (
          <p className="mt-8 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            {erro}
          </p>
        )}

        {!carregando && dados && (
          <section className="mt-10 rounded-lg border border-border bg-card p-7">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-accent">
              {dados.protocolo}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-card-foreground">{dados.instituicao}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tipoLabel[dados.tipo] ?? dados.tipo}
              {dados.cidade ? ` · ${dados.cidade}` : ""}
              {dados.estado ? `/${dados.estado}` : ""}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Registrada em {new Date(dados.created_at).toLocaleDateString("pt-BR")}
            </p>

            <ol className="mt-7 space-y-4">
              {etapas.map((et) => {
                const atingida = etapas.indexOf(dados.status) >= etapas.indexOf(et);
                return (
                  <li key={et} className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-3 w-3 shrink-0 rounded-full ${atingida ? "bg-accent" : "bg-border"}`}
                    />
                    <span
                      className={`text-sm ${atingida ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                    >
                      {statusLabel[et]}
                    </span>
                  </li>
                );
              })}
            </ol>

            {dados.resposta && (
              <div className="mt-7 border-t border-border pt-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Resposta</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dados.resposta}</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}