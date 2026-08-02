import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Loader2, ArrowLeft, Paperclip, Lock } from "lucide-react";
import { z } from "zod";
import { enviarProvas, registrarDenuncia } from "@/lib/denuncias.functions";

export const Route = createFileRoute("/denunciar")({
  head: () => ({
    meta: [
      { title: "Fazer denúncia | Denuncie.edu" },
      {
        name: "description",
        content:
          "Registre de forma anônima uma denúncia de agressão verbal, física ou má infraestrutura em escolas e faculdades.",
      },
      { property: "og:title", content: "Fazer denúncia | Denuncie.edu" },
      {
        property: "og:description",
        content: "Formulário anônimo de denúncia escolar com geração de protocolo de acompanhamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Denunciar,
});

const tipos = [
  { v: "verbal", l: "Agressão verbal" },
  { v: "fisica", l: "Agressão física" },
  { v: "infraestrutura", l: "Má infraestrutura" },
  { v: "outro", l: "Outro" },
] as const;

const schema = z.object({
  tipo: z.enum(["verbal", "fisica", "infraestrutura", "outro"]),
  instituicao: z.string().trim().min(3, "Informe o nome da instituição").max(150),
  cidade: z.string().trim().max(100).optional().or(z.literal("")),
  estado: z.string().trim().max(2).optional().or(z.literal("")),
  data_ocorrido: z.string().optional().or(z.literal("")),
  descricao: z.string().trim().min(20, "Descreva o ocorrido com pelo menos 20 caracteres").max(4000),
  contato: z.string().trim().min(5, "Informe um contato para retorno").max(150),
});

const inputCls =
  "w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent";

function Denunciar() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);

  function onArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const lista = Array.from(e.target.files ?? []).slice(0, 5);
    const grande = lista.find((f) => f.size > 12 * 1024 * 1024);
    if (grande) {
      setErro(`O arquivo "${grande.name}" passa de 12 MB.`);
      setArquivos([]);
      e.target.value = "";
      return;
    }
    setErro(null);
    setArquivos(lista);
  }

  async function paraBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    let binario = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 8192) {
      binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    return btoa(binario);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      setErro(parsed.error.issues[0].message);
      return;
    }
    const v = parsed.data;
    setEnviando(true);
    try {
      const { protocolo } = await registrarDenuncia({
        data: {
          tipo: v.tipo,
          instituicao: v.instituicao,
          descricao: v.descricao,
          cidade: v.cidade || undefined,
          estado: v.estado || undefined,
          data_ocorrido: v.data_ocorrido || undefined,
          contato: v.contato,
        },
      });
      if (arquivos.length) {
        try {
          const payload = await Promise.all(
            arquivos.map(async (f) => ({
              nome: f.name,
              tipo: f.type || undefined,
              base64: await paraBase64(f),
            })),
          );
          await enviarProvas({ data: { protocolo, arquivos: payload } });
        } catch {
          // a denúncia já foi registrada; anexos podem ser reenviados depois
        }
      }
      navigate({ to: "/acompanhar", search: { protocolo } });
    } catch {
      setErro("Não foi possível enviar sua denúncia. Tente novamente em instantes.");
    } finally {
      setEnviando(false);
    }
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
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <ShieldCheck size={14} /> Anônimo por padrão
        </p>
        <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">Fazer denúncia</h1>
        <p className="mt-3 text-muted-foreground">
          Não pedimos seu nome. Ao final você recebe um código de protocolo para acompanhar o caso.
        </p>
        <div className="mt-6 rounded-md border border-border bg-secondary p-5 text-sm leading-relaxed text-muted-foreground">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">
            Proteção dos seus dados (LGPD)
          </h2>
          <p>
            Os dados informados são tratados conforme a{" "}
            <strong className="text-foreground">
              Lei Geral de Proteção de Dados Pessoais (LGPD) — Lei nº 13.709/2018
            </strong>
            . Eles são usados exclusivamente para analisar e encaminhar a denúncia, com acesso
            restrito à equipe responsável, e não são vendidos nem compartilhados com terceiros sem
            base legal. Você pode solicitar a confirmação, a correção ou a exclusão dos seus dados a
            qualquer momento, informando o número do protocolo.
          </p>
          <p className="mt-3 inline-flex items-start gap-2 text-foreground">
            <Lock size={14} className="mt-0.5 shrink-0 text-accent" />
            <span>
              O relato, o contato e os arquivos enviados são <strong>criptografados</strong>{" "}
              (AES-256-GCM) antes de serem armazenados. Toda denúncia passa por{" "}
              <strong>moderação</strong> antes de ser encaminhada, para evitar denúncias falsas.
            </span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-9 space-y-6">
          <div>
            <span className="mb-2 block text-sm font-semibold text-foreground">Tipo de ocorrência</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {tipos.map((t, i) => (
                <label
                  key={t.v}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-card-foreground transition hover:border-accent has-[:checked]:border-accent"
                >
                  <input type="radio" name="tipo" value={t.v} defaultChecked={i === 0} className="accent-[var(--accent)]" />
                  {t.l}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="instituicao" className="mb-2 block text-sm font-semibold text-foreground">
              Instituição de ensino
            </label>
            <input id="instituicao" name="instituicao" required maxLength={150} className={inputCls} placeholder="Ex.: Colégio Estadual Santos Dumont" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="cidade" className="mb-2 block text-sm font-semibold text-foreground">Cidade</label>
              <input id="cidade" name="cidade" maxLength={100} className={inputCls} />
            </div>
            <div>
              <label htmlFor="estado" className="mb-2 block text-sm font-semibold text-foreground">UF</label>
              <input id="estado" name="estado" maxLength={2} className={inputCls} placeholder="SP" />
            </div>
          </div>

          <div>
            <label htmlFor="data_ocorrido" className="mb-2 block text-sm font-semibold text-foreground">Data do ocorrido</label>
            <input id="data_ocorrido" name="data_ocorrido" type="date" className={inputCls} />
          </div>

          <div>
            <label htmlFor="descricao" className="mb-2 block text-sm font-semibold text-foreground">O que aconteceu?</label>
            <textarea id="descricao" name="descricao" required rows={7} maxLength={4000} className={inputCls} placeholder="Descreva o ocorrido: quando, onde e quem estava envolvido. Evite dados que possam te identificar, se preferir." />
          </div>

          <div>
            <label htmlFor="provas" className="mb-2 block text-sm font-semibold text-foreground">
              Provas (fotos, vídeos ou documentos)
            </label>
            <input
              id="provas"
              name="provas"
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,.doc,.docx"
              onChange={onArquivos}
              className={inputCls}
            />
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Paperclip size={12} /> Até 5 arquivos, 12 MB cada. Enviados criptografados e visíveis
              apenas para a equipe responsável.
            </p>
            {arquivos.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {arquivos.map((f) => (
                  <li key={f.name}>• {f.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="contato" className="mb-2 block text-sm font-semibold text-foreground">
              Contato para retorno
            </label>
            <input id="contato" name="contato" required maxLength={150} className={inputCls} placeholder="E-mail ou telefone" />
          </div>

          {erro && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-accent-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {enviando && <Loader2 size={16} className="animate-spin" />}
            {enviando ? "Enviando..." : "Enviar denúncia"}
          </button>
        </form>
      </main>
    </div>
  );
}