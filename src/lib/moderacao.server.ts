const TERMOS_SUSPEITOS = [
  "teste", "testando", "asdf", "qwerty", "lorem ipsum", "brincadeira",
  "compre agora", "clique aqui", "http://", "https://", "www.", "promo",
  "ganhe dinheiro", "whatsapp grupo", "aaaa",
];

export type Avaliacao = { score: number; motivos: string[] };

/** Heurística simples anti-denúncia falsa: quanto maior o score, mais suspeita. */
export function avaliarDenuncia(input: { descricao: string; instituicao: string }): Avaliacao {
  const texto = input.descricao.toLowerCase();
  const motivos: string[] = [];
  let score = 0;

  if (input.descricao.trim().length < 60) {
    score += 25;
    motivos.push("Relato muito curto");
  }
  const palavras = texto.split(/\s+/).filter(Boolean);
  if (palavras.length < 12) {
    score += 20;
    motivos.push("Poucas palavras no relato");
  }
  const unicas = new Set(palavras);
  if (palavras.length > 8 && unicas.size / palavras.length < 0.45) {
    score += 20;
    motivos.push("Texto repetitivo");
  }
  if (/(.)\1{4,}/.test(texto)) {
    score += 20;
    motivos.push("Caracteres repetidos em sequência");
  }
  const encontrados = TERMOS_SUSPEITOS.filter((t) => texto.includes(t));
  if (encontrados.length) {
    score += 15 * encontrados.length;
    motivos.push(`Termos suspeitos: ${encontrados.join(", ")}`);
  }
  if (input.instituicao.trim().length < 5) {
    score += 15;
    motivos.push("Nome da instituição pouco específico");
  }
  const letras = input.descricao.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  const maiusculas = letras.replace(/[^A-ZÀ-Þ]/g, "");
  if (letras.length > 30 && maiusculas.length / letras.length > 0.7) {
    score += 10;
    motivos.push("Texto quase todo em caixa alta");
  }

  return { score: Math.min(score, 100), motivos };
}
