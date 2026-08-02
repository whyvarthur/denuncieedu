import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";

type PainelSession = { admin?: boolean; usuario?: string };

function sessionConfig() {
  return {
    password: process.env["PAINEL_SESSION_SECRET"]!,
    name: "painel-denuncie",
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

function contas(): { usuario: string; senha: string }[] {
  return [
    { usuario: process.env["PAINEL_USUARIO"], senha: process.env["PAINEL_SENHA"] },
    { usuario: process.env["PAINEL_USUARIO_2"], senha: process.env["PAINEL_SENHA_2"] },
  ].filter((c): c is { usuario: string; senha: string } => Boolean(c.usuario && c.senha));
}

async function requireAdmin() {
  const session = await useSession<PainelSession>(sessionConfig());
  if (!session.data.admin) throw new Error("NAO_AUTORIZADO");
  return session;
}

const loginSchema = z.object({
  usuario: z.string().trim().min(1).max(100),
  senha: z.string().min(1).max(200),
});

export const painelLogin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => loginSchema.parse(input))
  .handler(async ({ data }) => {
    const lista = contas();
    if (!lista.length) throw new Error("Painel não configurado.");
    const conta = lista.find((c) => matches(data.usuario, c.usuario) && matches(data.senha, c.senha));
    if (!conta) return { ok: false as const };
    const session = await useSession<PainelSession>(sessionConfig());
    await session.update({ admin: true, usuario: conta.usuario });
    return { ok: true as const };
  });

export const painelLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<PainelSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const painelSessao = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<PainelSession>(sessionConfig());
  return { autenticado: Boolean(session.data.admin), usuario: session.data.usuario ?? null };
});

export const painelListar = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { decryptText } = await import("./crypto.server");
  const { data, error } = await supabaseAdmin
    .from("denuncias")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[painelListar]", error);
    throw new Error("Não foi possível carregar as denúncias.");
  }
  const rows = data ?? [];
  const { data: anexos } = await supabaseAdmin
    .from("denuncia_anexos")
    .select("id, protocolo, nome, tipo, tamanho")
    .in("protocolo", rows.map((r) => r.protocolo));

  return {
    denuncias: rows.map((d) => ({
      ...d,
      descricao: decryptText(d.descricao),
      contato: d.contato ? decryptText(d.contato) : null,
      anexos: (anexos ?? []).filter((a) => a.protocolo === d.protocolo),
    })),
  };
});

const atualizarSchema = z.object({
  protocolo: z.string().trim().min(4).max(40),
  status: z.enum(["recebida", "em_analise", "encaminhada", "resolvida"]),
  moderacao: z.enum(["pendente", "aprovada", "rejeitada"]),
  resposta: z.string().trim().max(4000).optional(),
  motivo_rejeicao: z.string().trim().max(500).optional(),
});

export const painelAtualizar = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => atualizarSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("denuncias")
      .update({
        status: data.status,
        moderacao: data.moderacao,
        resposta: data.resposta || null,
        motivo_rejeicao: data.moderacao === "rejeitada" ? data.motivo_rejeicao || null : null,
      })
      .eq("protocolo", data.protocolo);
    if (error) {
      console.error("[painelAtualizar]", error);
      throw new Error("Não foi possível salvar a atualização.");
    }
    return { ok: true as const };
  });

const anexoSchema = z.object({ id: z.string().uuid() });

export const painelAbrirAnexo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => anexoSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { decryptBuffer } = await import("./crypto.server");
    const { data: anexo } = await supabaseAdmin
      .from("denuncia_anexos")
      .select("caminho, nome, tipo")
      .eq("id", data.id)
      .maybeSingle();
    if (!anexo) throw new Error("Anexo não encontrado.");
    const { data: blob, error } = await supabaseAdmin.storage
      .from("provas-denuncias")
      .download(anexo.caminho);
    if (error || !blob) {
      console.error("[painelAbrirAnexo]", error);
      throw new Error("Não foi possível abrir o anexo.");
    }
    const bytes = Buffer.from(await blob.arrayBuffer());
    return {
      nome: anexo.nome,
      tipo: anexo.tipo ?? "application/octet-stream",
      base64: decryptBuffer(bytes).toString("base64"),
    };
  });
