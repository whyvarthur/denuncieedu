import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";
import { createHash, timingSafeEqual } from "node:crypto";

type PainelSession = { admin?: boolean };

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
    const usuario = process.env["PAINEL_USUARIO"];
    const senha = process.env["PAINEL_SENHA"];
    if (!usuario || !senha) throw new Error("Painel não configurado.");
    if (!matches(data.usuario, usuario) || !matches(data.senha, senha)) {
      return { ok: false as const };
    }
    const session = await useSession<PainelSession>(sessionConfig());
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const painelLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<PainelSession>(sessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const painelSessao = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<PainelSession>(sessionConfig());
  return { autenticado: Boolean(session.data.admin) };
});

export const painelListar = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("denuncias")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[painelListar]", error);
    throw new Error("Não foi possível carregar as denúncias.");
  }
  return { denuncias: data ?? [] };
});

const atualizarSchema = z.object({
  protocolo: z.string().trim().min(4).max(40),
  status: z.enum(["recebida", "em_analise", "encaminhada", "resolvida"]),
  resposta: z.string().trim().max(4000).optional(),
});

export const painelAtualizar = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => atualizarSchema.parse(input))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("denuncias")
      .update({ status: data.status, resposta: data.resposta || null })
      .eq("protocolo", data.protocolo);
    if (error) {
      console.error("[painelAtualizar]", error);
      throw new Error("Não foi possível salvar a atualização.");
    }
    return { ok: true as const };
  });