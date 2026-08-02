import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Loader2, LogOut, RefreshCw, Paperclip, ShieldAlert } from "lucide-react";
import {
  painelAbrirAnexo,
  painelAtualizar,
  painelListar,
  painelLogin,
  painelLogout,
  painelSessao,
} from "@/lib/painel.functions";

export const Route = createFileRoute("/painel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel administrativo | Denuncie.edu" },
      {
        name: "description",
        content: "Área restrita para gestão das denúncias recebidas no canal Denuncie.edu.",
      },
      { property: "og:title", content: "Painel administrativo | Denuncie.edu" },
      {
        property: "og:description",
        content: "Acesso restrito à equipe responsável pelo canal de denúncias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Painel,
});

type Denuncia = {
  protocolo: string;
  tipo: string;
  instituicao: string;
  cidade: string | null;
  estado: string | null;
  data_ocorrido: string | null;
  descricao: string;
  contato: string | null;
  status: string;
  resposta: string | null;
  created_at: string;
  moderacao: string;
  motivo_rejeicao: string | null;
  score_risco: number;
  anexos: { id: string; nome: string; tipo: string | null; tamanho: number | null }[];
};

const statusOpcoes = [
  { v: "recebida", l: "Recebida" },
  { v: "em_analise", l: "Em análise" },
  { v: "encaminhada", l: "Encaminhada" },
  { v: "resolvida", l: "Resolvida" },
];

const moderacaoOpcoes = [
  { v: "pendente", l: "Pendente de moderação" },
  { v: "aprovada", l: "Aprovada" },
  { v: "rejeitada", l: "Rejeitada (falsa/inválida)" },
];

const tipoLabel: Record<string, string> = {
  verbal: "Agressão verbal",
  fisica: "Agressão física",
  infraestrutura: "Má infraestrutura",
  outro: "Outro",
};

const inputCls =
  "w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent";

function Painel() {
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [lista, setLista] = useState<Denuncia[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    painelSessao()
      .then((r) => setAutenticado(r.autenticado))
      .catch(() => setAutenticado(false));
  }, []);

  useEffect(() => {
    if (autenticado) void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autenticado]);

  async function carregar() {
    setCarregando(true);
    try {
      const r = await painelListar();
      setLista(r.denuncias as unknown as Denuncia[]);
    } catch {
      setErro("Não foi possível carregar as denúncias.");
    } finally {
      setCarregando(false);
    }
  }

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const fd = new FormData(e.currentTarget);
    setEntrando(true);
    try {
      const r = await painelLogin({
        data: {
          usuario: String(fd.get("usuario") ?? ""),
          senha: String(fd.get("senha") ?? ""),
        },
      });
      if (r.ok) setAutenticado(true);
      else setErro("Usuário ou senha incorretos.");
    } catch {
      setErro("Não foi possível entrar agora. Tente novamente.");
    } finally {
      setEntrando(false);
    }
  }

  async function sair() {
    await painelLogout().catch(() => null);
    setLista([]);
    setAutenticado(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight">
            DENUNCIE<span className="text-accent">.</span>EDU
          </Link>
          {autenticado ? (
            <button
              onClick={sair}
              className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100"
            >
              <LogOut size={15} /> Sair
            </button>
          ) : (
            <Link to="/" className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
              <ArrowLeft size={15} /> Voltar
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12">
        {autenticado === null && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Carregando...
          </p>
        )}

        {autenticado === false && (
          <div className="mx-auto max-w-sm">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Lock size={13} /> Área restrita
            </p>
            <h1 className="text-3xl font-extrabold text-foreground">Painel de denúncias</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Acesso exclusivo do responsável pelo canal.
            </p>
            <form onSubmit={onLogin} className="mt-7 space-y-4">
              <div>
                <label htmlFor="usuario" className="mb-2 block text-sm font-semibold text-foreground">
                  Usuário
                </label>
                <input id="usuario" name="usuario" autoComplete="username" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="senha" className="mb-2 block text-sm font-semibold text-foreground">
                  Senha
                </label>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={inputCls}
                />
              </div>
              {erro && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {erro}
                </p>
              )}
              <button
                type="submit"
                disabled={entrando}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
              >
                {entrando && <Loader2 size={16} className="animate-spin" />}
                {entrando ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>
        )}

        {autenticado === true && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold text-foreground">Denúncias recebidas</h1>
                <p className="mt-1 text-sm text-muted-foreground">{lista.length} registro(s)</p>
              </div>
              <button
                onClick={carregar}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-accent hover:text-foreground"
              >
                <RefreshCw size={15} className={carregando ? "animate-spin" : ""} /> Atualizar
              </button>
            </div>

            {erro && (
              <p className="mt-6 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {erro}
              </p>
            )}

            <div className="mt-8 space-y-5">
              {!carregando && lista.length === 0 && (
                <p className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  Nenhuma denúncia registrada até o momento.
                </p>
              )}
              {lista.map((d) => (
                <Card key={d.protocolo} d={d} onSalvo={carregar} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

async function abrirAnexo(id: string) {
  try {
    const a = await painelAbrirAnexo({ data: { id } });
    const bin = atob(a.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([bytes], { type: a.tipo }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    alert("Não foi possível abrir o anexo.");
  }
}

function Card({ d, onSalvo }: { d: Denuncia; onSalvo: () => void }) {
  const [status, setStatus] = useState(d.status);
  const [moderacao, setModeracao] = useState(d.moderacao ?? "pendente");
  const [motivo, setMotivo] = useState(d.motivo_rejeicao ?? "");
  const [resposta, setResposta] = useState(d.resposta ?? "");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      await painelAtualizar({
        data: {
          protocolo: d.protocolo,
          status: status as "recebida" | "em_analise" | "encaminhada" | "resolvida",
          moderacao: moderacao as "pendente" | "aprovada" | "rejeitada",
          motivo_rejeicao: motivo.trim() || undefined,
          resposta: resposta.trim() || undefined,
        },
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
      onSalvo();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <article className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-display text-sm font-bold uppercase tracking-widest text-accent">
          {d.protocolo}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(d.created_at).toLocaleString("pt-BR")}
        </span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          {moderacaoOpcoes.find((m) => m.v === (d.moderacao ?? "pendente"))?.l}
        </span>
        {d.score_risco >= 40 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
            <ShieldAlert size={12} /> Risco de denúncia falsa: {d.score_risco}%
          </span>
        )}
      </div>
      <h2 className="mt-2 text-xl font-bold text-card-foreground">{d.instituicao}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {tipoLabel[d.tipo] ?? d.tipo}
        {d.cidade ? ` · ${d.cidade}` : ""}
        {d.estado ? `/${d.estado}` : ""}
        {d.data_ocorrido ? ` · ocorrido em ${new Date(d.data_ocorrido).toLocaleDateString("pt-BR")}` : ""}
      </p>
      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">{d.descricao}</p>
      {d.contato && (
        <p className="mt-3 text-sm text-muted-foreground">
          Contato informado: <span className="font-semibold text-foreground">{d.contato}</span>
        </p>
      )}

      {d.anexos?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {d.anexos.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => abrirAnexo(a.id)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-accent hover:text-foreground"
            >
              <Paperclip size={12} /> {a.nome}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-[200px_1fr]">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Moderação
          </label>
          <select value={moderacao} onChange={(e) => setModeracao(e.target.value)} className={inputCls}>
            {moderacaoOpcoes.map((m) => (
              <option key={m.v} value={m.v}>
                {m.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Motivo / observações da moderação
          </label>
          <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} className={inputCls} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputCls}
          >
            {statusOpcoes.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resposta ao denunciante
          </label>
          <textarea
            rows={3}
            maxLength={4000}
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
      >
        {salvando && <Loader2 size={15} className="animate-spin" />}
        {salvo ? "Salvo" : "Salvar"}
      </button>
    </article>
  );
}