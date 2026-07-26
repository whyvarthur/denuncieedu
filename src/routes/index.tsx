import { createFileRoute } from "@tanstack/react-router";
import {
  MessageSquareWarning,
  HandHelping,
  Building2,
  ShieldCheck,
  Search,
  Phone,
} from "lucide-react";
import heroImg from "@/assets/hero-estudantes.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Denuncie Aqui | Canal de denúncias em escolas e faculdades" },
      {
        name: "description",
        content:
          "Registre denúncias de agressão verbal, física ou má infraestrutura em colégios e faculdades. Anônimo, seguro e com acompanhamento por protocolo.",
      },
      { property: "og:title", content: "Denuncie Aqui | Canal de denúncias escolares" },
      {
        property: "og:description",
        content:
          "Canal anônimo para denunciar agressões e problemas de infraestrutura em instituições de ensino.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const categorias = [
  {
    icon: MessageSquareWarning,
    titulo: "Agressão verbal",
    texto: "Ofensas, humilhações, ameaças e discurso de ódio dentro da instituição.",
  },
  {
    icon: HandHelping,
    titulo: "Agressão física",
    texto: "Empurrões, brigas, violência entre alunos ou por parte de funcionários.",
  },
  {
    icon: Building2,
    titulo: "Má infraestrutura",
    texto: "Salas sem manutenção, banheiros interditados, riscos elétricos e estruturais.",
  },
];

const etapas = [
  { n: "01", t: "Registre", d: "Escolha o tipo, a instituição e descreva o ocorrido. Leva ~3 minutos." },
  { n: "02", t: "Receba o protocolo", d: "Um código é gerado para você acompanhar sem se identificar." },
  { n: "03", t: "Acompanhe", d: "Veja o status: recebida, em análise, encaminhada ou resolvida." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-display text-lg font-extrabold tracking-tight">
            DENUNCIE<span className="text-accent">.</span>EDU
          </span>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="#como-funciona" className="opacity-80 transition hover:opacity-100">
              Como funciona
            </a>
            <a href="#categorias" className="opacity-80 transition hover:opacity-100">
              O que denunciar
            </a>
            <a href="#ajuda" className="opacity-80 transition hover:opacity-100">
              Ajuda
            </a>
          </nav>
          <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground uppercase tracking-wide transition hover:brightness-110">
            Fazer denúncia
          </button>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-primary-deep">
        <img
          src={heroImg}
          alt="Estudantes caminhando pelo corredor de uma instituição de ensino"
          width={1600}
          height={1000}
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 md:py-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
            <ShieldCheck size={14} /> 100% anônimo
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
            Sua denúncia pode mudar a rotina de uma escola inteira.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-primary-foreground/80">
            Um canal independente para relatar agressões e problemas de infraestrutura em colégios e
            faculdades — com protocolo para acompanhar cada caso.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button className="rounded-md bg-accent px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-accent-foreground transition hover:brightness-110">
              Fazer denúncia
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/35 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground transition hover:bg-primary-foreground/10">
              <Search size={16} /> Acompanhar protocolo
            </button>
          </div>
        </div>
      </section>

      <section id="categorias" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-3xl font-bold text-foreground md:text-4xl">O que você pode denunciar</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {categorias.map((c) => (
            <article
              key={c.titulo}
              className="rounded-lg border border-border bg-card p-7 transition hover:border-accent"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-accent-soft text-accent">
                <c.icon size={22} />
              </span>
              <h3 className="mt-5 text-xl font-bold text-card-foreground">{c.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="bg-secondary">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Como funciona</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {etapas.map((e) => (
              <div key={e.n} className="border-t-2 border-accent pt-5">
                <span className="font-display text-3xl font-extrabold text-accent">{e.n}</span>
                <h3 className="mt-2 text-lg font-bold text-foreground">{e.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{e.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ajuda" className="mx-auto max-w-6xl px-5 py-20">
        <div className="rounded-lg bg-primary p-9 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
              Está em perigo agora?
            </h2>
            <p className="mt-2 text-primary-foreground/80">
              Este canal não substitui o atendimento de emergência. Ligue imediatamente.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            {["190 Polícia", "180 Mulher", "100 Direitos Humanos"].map((n) => (
              <span
                key={n}
                className="inline-flex items-center gap-2 rounded-md bg-primary-foreground/10 px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                <Phone size={15} /> {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-5 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Denuncie.edu — canal independente de denúncias escolares.
        </div>
      </footer>
    </div>
  );
}
