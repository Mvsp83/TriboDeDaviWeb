// Semente inicial da configuração de graduação. As posições vêm do inventário
// técnico usado nas aulas; o programa da faixa Branca vem do rascunho da
// apostila. Tudo é editável no sistema — isto é só o ponto de partida.
import {
  type ConfigGraduacao,
  type Posicao,
  type GolpeRestrito,
} from "./tipos";

// Catálogo semente. ids estáveis (prefixo "p-") para o programa da Branca poder
// referenciá-los sem depender de UUID aleatório.
export const POSICOES_SEED: Posicao[] = [
  { id: "p-baiana", nome: "Baiana", nomeEn: "Double leg", categoria: "queda", tags: "queda, fundamento" },
  { id: "p-sprawl", nome: "Defesa da baiana (sprawl)", nomeEn: "Sprawl", categoria: "defesa-de-queda", tags: "defesa, queda" },
  { id: "p-rolamento", nome: "Rolamento / queda amortecida", nomeEn: "Ukemi", categoria: "fundamento", tags: "fundamento, segurança" },
  { id: "p-base", nome: "Postura de base (em pé e no solo)", categoria: "fundamento", tags: "fundamento, postura" },
  { id: "p-puxada", nome: "Puxada para a guarda", nomeEn: "Guard pull", categoria: "transicao", tags: "guarda" },
  { id: "p-guarda-fechada", nome: "Guarda fechada — controle e postura", nomeEn: "Closed guard", categoria: "guarda", tags: "guarda, controle" },
  { id: "p-fuga-quadril", nome: "Fuga de quadril", nomeEn: "Hip escape", categoria: "fundamento", tags: "fundamento, fuga" },
  { id: "p-reposicao", nome: "Reposição de guarda", nomeEn: "Guard recovery", categoria: "transicao", tags: "guarda" },
  { id: "p-montada", nome: "Montada — controle", nomeEn: "Mount", categoria: "controle", tags: "controle" },
  { id: "p-100kg", nome: "100 kg — controle lateral", nomeEn: "Side control", categoria: "controle", tags: "controle" },
  { id: "p-saida-montada", nome: "Saída da montada", nomeEn: "Mount escape", categoria: "defesa", tags: "fuga, defesa" },
  { id: "p-saida-100kg", nome: "Saída do 100 kg", nomeEn: "Side control escape", categoria: "defesa", tags: "fuga, defesa" },
  { id: "p-cruzado", nome: "Estrangulamento cruzado da guarda fechada", nomeEn: "Cross collar choke", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-americana-100kg", nome: "Americana do 100 kg", nomeEn: "Americana from side control", categoria: "finalizacao", tags: "finalização, controle" },
  { id: "p-tesourinha", nome: "Raspagem tesourinha", nomeEn: "Scissor sweep", categoria: "raspagem", tags: "raspagem, guarda" },
  // Base para as próximas faixas (fora do programa da Branca, já no catálogo).
  { id: "p-osotogari", nome: "Osotogari", categoria: "queda", tags: "queda" },
  { id: "p-armlock-montada", nome: "Armlock da montada", nomeEn: "Armbar from mount", categoria: "finalizacao", tags: "finalização" },
  { id: "p-kimura", nome: "Kimura da guarda", nomeEn: "Kimura", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-hipbump", nome: "Raspagem batida de quadril", nomeEn: "Hip bump sweep", categoria: "raspagem", tags: "raspagem, guarda" },
  { id: "p-costas-100kg", nome: "Pegada de costas partindo do 100 kg", nomeEn: "Back take from side control", categoria: "transicao", tags: "costas" },
  { id: "p-mataleao", nome: "Mata-leão", nomeEn: "Rear naked choke", categoria: "finalizacao", tags: "finalização, costas" },
  { id: "p-kneecut", nome: "Passagem joelho cruzado", nomeEn: "Knee cut pass", categoria: "passagem", tags: "passagem" },
  { id: "p-toreando", nome: "Passagem toreando", nomeEn: "Toreando pass", categoria: "passagem", tags: "passagem" },
  { id: "p-joelho-barriga", nome: "Joelho na barriga", nomeEn: "Knee on belly", categoria: "controle", tags: "controle" },
  { id: "p-triangulo", nome: "Triângulo da guarda fechada", nomeEn: "Triangle", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-aranha", nome: "Guarda aranha", nomeEn: "Spider guard", categoria: "guarda", tags: "guarda" },
  { id: "p-delariva", nome: "Guarda De La Riva", nomeEn: "De La Riva", categoria: "guarda", tags: "guarda" },
  { id: "p-meia-guarda", nome: "Meia guarda tradicional", nomeEn: "Half guard", categoria: "guarda", tags: "guarda" },
];

// Requisito que aponta para uma posição do catálogo (vale para todas as idades).
function req(posicaoId: string, nota?: string) {
  return { id: `r-${posicaoId}`, posicaoId, nota, faixaEtariaId: null };
}

// Critério de exame único (para todas as idades).
function crit(texto: string) {
  return { id: `c-${texto.slice(0, 12).replace(/\W+/g, "-").toLowerCase()}`, texto, faixaEtariaId: null };
}

// Programa semente da faixa Branca (base 0) — espelha o rascunho da apostila.
// As faixas etárias vêm de exemplo (editáveis); o conteúdo semente é universal.
const PROGRAMA_BRANCA = {
  faixaBase: 0,
  tag: "Fundamentos e sobrevivência",
  perfil:
    "O primeiro contato com o tatame. Aprender a cair sem se machucar, entender a base e as posições e — acima de tudo — não entrar em pânico embaixo do adversário. A branca constrói o alicerce de tudo o que vem depois.",
  faixasEtarias: [
    { id: "fe-branca-a", label: "4 a 5 anos", idadeMin: 4, idadeMax: 5 },
    { id: "fe-branca-b", label: "6 a 8 anos", idadeMin: 6, idadeMax: 8 },
  ],
  graus: [
    {
      id: "g-branca-1",
      titulo: "Cair e posicionar",
      requisitos: [req("p-rolamento"), req("p-base"), req("p-baiana"), req("p-sprawl")],
      criterios: [crit("Cai com segurança e mantém a base sob leve pressão.")],
    },
    {
      id: "g-branca-2",
      titulo: "A guarda",
      requisitos: [req("p-puxada"), req("p-guarda-fechada"), req("p-fuga-quadril"), req("p-reposicao")],
      criterios: [crit("Recompõe a guarda quando o parceiro tenta encostar.")],
    },
    {
      id: "g-branca-3",
      titulo: "Controlar e escapar",
      requisitos: [req("p-montada"), req("p-100kg"), req("p-saida-montada"), req("p-saida-100kg")],
      criterios: [crit("Escapa da montada e do 100 kg sem forçar, usando o quadril.")],
    },
    {
      id: "g-branca-4",
      titulo: "Primeiros ataques",
      requisitos: [req("p-cruzado"), req("p-americana-100kg"), req("p-tesourinha")],
      criterios: [
        crit("Demonstra os quatro graus e finaliza um parceiro cooperativo."),
        crit("Exame → Cinza."),
      ],
    },
  ],
};

// Golpes restritos (pág. 1 do PDF de golpes proibidos da IBJJF). As severidades
// por divisão dependem do grid gráfico do PDF; aqui ficam VAZIAS (a revisar) —
// a edição da matriz será feita na tela própria. Guardamos só as descrições.
const DESCRICOES_GOLPES = [
  "Posição de finalização forçando a abertura da virilha",
  "Estrangulamento que force a cervical",
  "Chave de pé reta",
  "Estrangulamento utilizando a manga do kimono (Ezequiel)",
  "Gravata técnica de frente",
  "Omoplata",
  "Triângulo (puxando a cabeça)",
  "Triângulo de mão",
  "Chave que pressione as costelas ou os rins dentro da guarda fechada",
  "Mão de vaca",
  "Single leg com a cabeça para fora",
  "Chave de bíceps",
  "Chave de panturrilha",
  "Leg lock (chave de joelho reta)",
  "Mata-leão no pé",
  "Na chave de pé reta, girar na direção do pé que não está sendo atacado",
  "Chave de calcanhar",
  "Chave que torça o joelho",
  "Cruzada de perna",
  "No mata-leão no pé, aplicar a pressão para o lado externo do pé",
  "Bate estaca",
  "Chave de cervical",
  "Queda-tesoura",
  "Torcer os dedos para trás",
  "Segurar na faixa do adversário e projetá-lo de cabeça ao solo enquanto se defende de um Single Leg com a cabeça para fora",
  "Suplex derrubando o adversário de cabeça ou pescoço ao solo",
];

const GOLPES_SEED: GolpeRestrito[] = DESCRICOES_GOLPES.map((descricao, i) => ({
  id: `golpe-${i + 1}`,
  descricao,
  // Sem severidades ainda: a matriz (26 × 6 divisões) será preenchida na tela
  // de regras (fora desta fatia). Guardamos só as descrições por ora.
  severidadePorDivisao: {},
}));

export const CONFIG_DEFAULT: ConfigGraduacao = {
  versao: 1,
  posicoes: POSICOES_SEED,
  golpesRestritos: GOLPES_SEED,
  programas: [PROGRAMA_BRANCA],
};
