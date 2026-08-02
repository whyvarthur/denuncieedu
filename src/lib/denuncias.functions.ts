import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const registrarSchema = z.object({
  tipo: z.enum(["verbal", "fisica", "infraestrutura", "outro"]),
  instituicao: z.string().trim().min(3).max(150),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().max(2).optional(),
  data_ocorrido: z.string().trim().max(10).optional(),
  descricao: z.string().trim().min(20).max(4000),
  contato: z.string().trim().min(5).max(150),
});

export const registrarDenuncia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrarSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { encryptText } = await import("./crypto.server");
    const { avaliarDenuncia } = await import("./moderacao.server");

    const avaliacao = avaliarDenuncia({ descricao: data.descricao, instituicao: data.instituicao });

    const { data: protocolo, error } = await supabaseAdmin.rpc("registrar_denuncia", {
      _tipo: data.tipo,
      _instituicao: data.instituicao,
      _descricao: encryptText(data.descricao),
      _cidade: data.cidade || undefined,
      _estado: data.estado || undefined,
      _data_ocorrido: data.data_ocorrido || undefined,
      _contato: encryptText(data.contato),
    });
    if (error || !protocolo) {
      console.error("[registrarDenuncia]", error);
      throw new Error("Não foi possível registrar a denúncia.");
    }

    await supabaseAdmin
      .from("denuncias")
      .update({
        criptografado: true,
        score_risco: avaliacao.score,
        moderacao: "pendente",
        motivo_rejeicao: avaliacao.motivos.length ? avaliacao.motivos.join(" · ") : null,
      })
      .eq("protocolo", protocolo as string);

    return { protocolo: protocolo as string };
  });

const provaSchema = z.object({
  protocolo: z.string().trim().min(4).max(40),
  arquivos: z
    .array(
      z.object({
        nome: z.string().trim().min(1).max(200),
        tipo: z.string().trim().max(120).optional(),
        base64: z.string().min(1),
      }),
    )
    .min(1)
    .max(5),
});

const LIMITE_BYTES = 12 * 1024 * 1024;

export const enviarProvas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => provaSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { encryptBuffer } = await import("./crypto.server");

    const { data: alvo } = await supabaseAdmin
      .from("denuncias")
      .select("protocolo")
      .eq("protocolo", data.protocolo)
      .maybeSingle();
    if (!alvo) throw new Error("Protocolo inválido.");

    let enviados = 0;
    for (const arquivo of data.arquivos) {
      const bytes = Buffer.from(arquivo.base64, "base64");
      if (!bytes.length || bytes.length > LIMITE_BYTES) continue;
      const caminho = `${data.protocolo}/${crypto.randomUUID()}.enc`;
      const { error } = await supabaseAdmin.storage
        .from("provas-denuncias")
        .upload(caminho, encryptBuffer(bytes), { contentType: "application/octet-stream" });
      if (error) {
        console.error("[enviarProvas]", error);
        continue;
      }
      await supabaseAdmin.from("denuncia_anexos").insert({
        protocolo: data.protocolo,
        caminho,
        nome: arquivo.nome.slice(0, 200),
        tipo: arquivo.tipo ?? null,
        tamanho: bytes.length,
      });
      enviados += 1;
    }
    return { enviados };
  });

const consultarSchema = z.object({
  protocolo: z.string().trim().min(4).max(40),
});

export const consultarDenuncia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => consultarSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("consultar_denuncia", {
      _protocolo: data.protocolo,
    });
    if (error) {
      console.error("[consultarDenuncia]", error);
      throw new Error("Não foi possível consultar o protocolo.");
    }
    const denuncia = (rows as Record<string, unknown>[] | null)?.[0] ?? null;
    if (!denuncia) return { denuncia: null };

    const { data: extra } = await supabaseAdmin
      .from("denuncias")
      .select("moderacao, motivo_rejeicao")
      .eq("protocolo", denuncia["protocolo"] as string)
      .maybeSingle();

    const { count } = await supabaseAdmin
      .from("denuncia_anexos")
      .select("id", { count: "exact", head: true })
      .eq("protocolo", denuncia["protocolo"] as string);

    return {
      denuncia: {
        ...denuncia,
        moderacao: extra?.moderacao ?? "pendente",
        motivo_rejeicao: extra?.moderacao === "rejeitada" ? extra?.motivo_rejeicao ?? null : null,
        anexos: count ?? 0,
      },
    };
  });
