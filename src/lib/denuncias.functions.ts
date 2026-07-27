import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const registrarSchema = z.object({
  tipo: z.enum(["verbal", "fisica", "infraestrutura", "outro"]),
  instituicao: z.string().trim().min(3).max(150),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().max(2).optional(),
  data_ocorrido: z.string().trim().max(10).optional(),
  descricao: z.string().trim().min(20).max(4000),
  contato: z.string().trim().max(150).optional(),
});

export const registrarDenuncia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registrarSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: protocolo, error } = await supabaseAdmin.rpc("registrar_denuncia", {
      _tipo: data.tipo,
      _instituicao: data.instituicao,
      _descricao: data.descricao,
      _cidade: data.cidade || undefined,
      _estado: data.estado || undefined,
      _data_ocorrido: data.data_ocorrido || undefined,
      _contato: data.contato || undefined,
    });
    if (error || !protocolo) {
      console.error("[registrarDenuncia]", error);
      throw new Error("Não foi possível registrar a denúncia.");
    }
    return { protocolo: protocolo as string };
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
    return { denuncia: (rows as unknown[] | null)?.[0] ?? null };
  });
