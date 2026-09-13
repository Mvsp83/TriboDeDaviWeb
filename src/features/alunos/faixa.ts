// Sistema de faixas (jiu-jitsu infantil). Cada cor tem 4 graus; o número
// enviado pela API vai de 0 (Branca) a 40 (Preta).

interface FaixaInfo {
  nome: string;
  // Cor base para o "chip" — hex da faixa; o texto se ajusta ao contraste.
  cor: string;
  texto: string;
}

const CORES: { base: number; nome: string; cor: string; texto: string }[] = [
  { base: 0, nome: "Branca", cor: "#f5f5f4", texto: "#1c1917" },
  { base: 5, nome: "Cinza", cor: "#9ca3af", texto: "#111827" },
  { base: 10, nome: "Amarela", cor: "#facc15", texto: "#422006" },
  { base: 15, nome: "Laranja", cor: "#fb923c", texto: "#431407" },
  { base: 20, nome: "Verde", cor: "#22c55e", texto: "#052e16" },
  { base: 25, nome: "Azul", cor: "#3b82f6", texto: "#eff6ff" },
  { base: 30, nome: "Roxa", cor: "#a855f7", texto: "#faf5ff" },
  { base: 35, nome: "Marrom", cor: "#78350f", texto: "#fef3c7" },
  { base: 40, nome: "Preta", cor: "#18181b", texto: "#fafafa" },
];

export function faixaInfo(faixa: number): FaixaInfo {
  // Acha a cor cujo intervalo [base, base+4] contém o valor
  const grupo =
    [...CORES].reverse().find((c) => faixa >= c.base) ?? CORES[0];
  const grau = faixa - grupo.base;
  const nome =
    grau > 0 && grupo.base !== 40 ? `${grupo.nome} ${grau}g` : grupo.nome;
  return { nome, cor: grupo.cor, texto: grupo.texto };
}

export const OPCOES_FAIXA_BASE = CORES.map((c) => ({
  valor: c.base,
  nome: c.nome,
}));

// Base da cor a que a faixa pertence (0=Branca, 5=Cinza, ...). Faixas de mesma
// cor compartilham a base; só muda quando troca a cor.
export function baseDaCor(faixa: number): number {
  const grupo = [...CORES].reverse().find((c) => faixa >= c.base) ?? CORES[0];
  return grupo.base;
}

// Houve troca de COR (não apenas de grau) entre duas faixas. É o critério para
// emitir certificado: grau novo dentro da mesma cor não gera certificado.
export function mudouDeCor(faixaAnterior: number, faixaNova: number): boolean {
  return baseDaCor(faixaAnterior) !== baseDaCor(faixaNova);
}

// Sequência de cores por público (a progressão bifurca depois da Branca):
// - Criança (até 16): Branca → Cinza → Amarela → Laranja → Verde e, ao virar
//   adulto, segue para Azul… (por isso a sequência infantil é a linear completa).
// - Adulto: Branca → Azul → Roxa → Marrom → Preta (pula as cores infantis).
const SEQ_CRIANCA = CORES.map((c) => c.base); // 0,5,10,15,20,25,30,35,40
const SEQ_ADULTO = [0, 25, 30, 35, 40]; // Branca, Azul, Roxa, Marrom, Preta

// Base da PRÓXIMA cor na progressão do aluno (para motivar "rumo à próxima
// faixa"). Null quando já está na Preta (não há próxima). `ehAdulto` escolhe a
// sequência: a Branca é o único ponto em que criança (→Cinza) e adulto (→Azul)
// divergem só pela idade.
export function proximaCorBase(faixa: number, ehAdulto = false): number | null {
  const base = baseDaCor(faixa);
  const seq = ehAdulto ? SEQ_ADULTO : SEQ_CRIANCA;
  const idx = seq.indexOf(base);
  // Base fora da sequência do público (ex.: adulto marcado numa cor infantil,
  // caso raro): cai na progressão linear completa para não travar.
  if (idx === -1) {
    const li = SEQ_CRIANCA.indexOf(base);
    return li >= 0 && li + 1 < SEQ_CRIANCA.length ? SEQ_CRIANCA[li + 1] : null;
  }
  return idx + 1 < seq.length ? seq[idx + 1] : null;
}
