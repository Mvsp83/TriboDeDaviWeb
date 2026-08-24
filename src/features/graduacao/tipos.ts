// Modelo do domínio de Graduação — tudo parametrizável e editável no sistema.
// Espelha o sistema de faixas de `@/features/alunos/faixa.ts` (base 0..40) e
// serve de fonte para gerar a apostila (manual) do instituto.

// Categoria de jiu-jitsu de uma posição/técnica. const object (não enum) por
// causa do erasableSyntaxOnly do tsconfig — mesmo padrão de TipoBloco em types.
export const CategoriaPosicao = {
  Fundamento: "fundamento",
  Queda: "queda",
  DefesaDeQueda: "defesa-de-queda",
  Passagem: "passagem",
  Raspagem: "raspagem",
  Guarda: "guarda",
  Controle: "controle",
  Finalizacao: "finalizacao",
  Defesa: "defesa",
  Transicao: "transicao",
} as const;

export type CategoriaPosicao =
  (typeof CategoriaPosicao)[keyof typeof CategoriaPosicao];

export const CATEGORIA_LABEL: Record<string, string> = {
  fundamento: "Fundamento",
  queda: "Queda",
  "defesa-de-queda": "Defesa de queda",
  passagem: "Passagem",
  raspagem: "Raspagem",
  guarda: "Guarda",
  controle: "Controle",
  finalizacao: "Finalização",
  defesa: "Defesa",
  transicao: "Transição",
};

export const CATEGORIAS: { valor: string; label: string }[] = Object.entries(
  CATEGORIA_LABEL,
).map(([valor, label]) => ({ valor, label }));

// Uma posição/técnica do catálogo. Reaproveita o padrão de vídeo+transcrição
// do plano de aula (YouTube), mas com taxonomia própria de jiu-jitsu.
export interface Posicao {
  id: string;
  nome: string; // português
  nomeEn?: string; // ex.: "Double leg"
  categoria: string;
  descricao?: string;
  videoUrl?: string; // link do YouTube
  transcricao?: string; // legenda traduzida trazida do vídeo (cache)
  tags?: string; // separadas por vírgula
  // Vínculo opcional com uma restrição de golpe por idade/faixa (IBJJF).
  golpeRestritoId?: string | null;
}

// Severidade de uma restrição, seguindo o manual de golpes proibidos da IBJJF.
export const Severidade = {
  Normal: "normal",
  Grave: "grave",
  Gravissima: "gravissima",
} as const;

export type Severidade = (typeof Severidade)[keyof typeof Severidade];

export const SEVERIDADE_LABEL: Record<string, string> = {
  normal: "Permitido",
  grave: "Falta grave",
  gravissima: "Falta gravíssima",
};

// As 6 divisões de idade/faixa da matriz de golpes restritos (pág. 1 do PDF),
// na mesma ordem das colunas da tabela oficial (esquerda → direita).
export interface Divisao {
  id: string;
  label: string;
  curto: string; // rótulo compacto para o cabeçalho da matriz
}

export const DIVISOES: Divisao[] = [
  { id: "d1", curto: "4–12", label: "4 a 12 anos" },
  { id: "d2", curto: "13–15", label: "13 a 15 anos" },
  { id: "d3", curto: "16–17 / branca", label: "16 e 17 anos (todas as faixas) e faixa branca (Adulto a Master 7)" },
  { id: "d4", curto: "azul / roxa", label: "Adulto a Master 7 (azul e roxa)" },
  { id: "d5", curto: "marrom-preta · gi", label: "Adulto a Master 7 (marrom e preta), com kimono (exceto sem kimono)" },
  { id: "d6", curto: "marrom-preta · no-gi", label: "Adultos (marrom e preta), sem kimono" },
];

// Uma técnica proibida/restrita e sua severidade em cada divisão.
export interface GolpeRestrito {
  id: string;
  descricao: string;
  // divisaoId -> severidade. Ausente = "normal" (permitido).
  severidadePorDivisao: Record<string, string>;
  // Imagem ilustrativa opcional (URL); a matriz oficial fica em /golpes.
  imagem?: string | null;
}

// Uma faixa etária dentro de uma cor de faixa (ex.: Branca "4 a 5 anos").
// Editável por cor: o instituto pode separar o conteúdo da mesma faixa por
// idade. idadeMin/idadeMax são opcionais (só rótulo já basta).
export interface FaixaEtaria {
  id: string;
  label: string; // ex.: "4 a 5 anos"
  idadeMin?: number;
  idadeMax?: number;
}

// Um requisito dentro de um grau: aponta para uma posição do catálogo OU é um
// texto livre (para requisitos que não são uma técnica, ex.: conduta).
// faixaEtariaId vazio/null = vale para todas as idades da cor.
export interface Requisito {
  id: string;
  posicaoId?: string | null;
  texto?: string; // usado quando não há posicaoId
  nota?: string; // observação opcional
  faixaEtariaId?: string | null;
}

// Um critério de exame do grau. Vários por grau; cada um pode valer para todas
// as idades (faixaEtariaId vazio) ou para uma faixa etária específica.
export interface Criterio {
  id: string;
  texto: string;
  faixaEtariaId?: string | null;
}

// Um grau dentro de uma faixa (normalmente 4 por cor, mas editável).
export interface Grau {
  id: string;
  titulo: string;
  requisitos: Requisito[];
  criterios: Criterio[];
}

// O programa de uma faixa (cor). faixaBase espelha a base de faixa.ts
// (0=Branca, 5=Cinza, ... 40=Preta).
export interface ProgramaFaixa {
  faixaBase: number;
  perfil?: string; // parágrafo de abertura da faixa
  tag?: string; // rótulo curto (ex.: "Fundamentos e sobrevivência")
  faixasEtarias: FaixaEtaria[];
  graus: Grau[];
}

// Toda a configuração de graduação — uma unidade persistida (localStorage hoje,
// futura /api/ConfiguracaoGraduacao).
export interface ConfigGraduacao {
  versao: number;
  posicoes: Posicao[];
  golpesRestritos: GolpeRestrito[];
  programas: ProgramaFaixa[];
}

// Gera um id novo. crypto.randomUUID existe em todos os navegadores-alvo.
export function novoId(): string {
  return crypto.randomUUID();
}
