import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { painelEntrarPorLink } from "@/lib/painel.functions";

export const Route = createFileRoute("/p/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso restrito | Denuncie.edu" },
      { name: "description", content: "Acesso por link exclusivo ao painel de denúncias do Denuncie.edu." },
      { property: "og:title", content: "Acesso restrito | Denuncie.edu" },
      { property: "og:description", content: "Área restrita da equipe do canal Denuncie.edu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AcessoPorLink,
});

function AcessoPorLink() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [erro, setErro] = useState(false);

  useEffect(() => {
    painelEntrarPorLink({ data: { token } })
      .then((r) => {
        if (r.ok) void navigate({ to: "/painel", replace: true });
        else setErro(true);
      })
      .catch(() => setErro(true));
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      {erro ? (
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto text-destructive" size={28} />
          <h1 className="mt-3 text-2xl font-extrabold text-foreground">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este endereço de acesso não é válido ou foi substituído.
          </p>
          <Link to="/" className="mt-5 inline-block text-sm font-semibold text-accent">
            Voltar ao início
          </Link>
        </div>
      ) : (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Validando acesso...
        </p>
      )}
    </div>
  );
}
