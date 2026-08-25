// Semente inicial da configuração de graduação. As posições vêm do inventário
// técnico usado nas aulas; os programas de cada faixa vêm do rascunho da
// apostila. Tudo é editável no sistema — isto é só o ponto de partida.
import {
  type ConfigGraduacao,
  type Posicao,
  type GolpeRestrito,
} from "./tipos";

// Catálogo semente. ids estáveis (prefixo "p-") para os programas poderem
// referenciá-los sem depender de UUID aleatório.
export const POSICOES_SEED: Posicao[] = [
  // Fundamentos e controles
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
  { id: "p-joelho-barriga", nome: "Joelho na barriga", nomeEn: "Knee on belly", categoria: "controle", tags: "controle" },
  { id: "p-norte-sul", nome: "Norte-sul — controle", nomeEn: "North-south", categoria: "controle", tags: "controle" },
  { id: "p-saida-montada", nome: "Saída da montada", nomeEn: "Mount escape", categoria: "defesa", tags: "fuga, defesa" },
  { id: "p-saida-100kg", nome: "Saída do 100 kg", nomeEn: "Side control escape", categoria: "defesa", tags: "fuga, defesa" },
  { id: "p-defesa-costas", nome: "Defesa da pegada de costas", nomeEn: "Back escape", categoria: "defesa", tags: "fuga, defesa, costas" },

  // Quedas
  { id: "p-osotogari", nome: "Osotogari", categoria: "queda", tags: "queda" },
  { id: "p-ippon-seoi", nome: "Ippon Seoi Nage", categoria: "queda", tags: "queda" },
  { id: "p-harai-goshi", nome: "Harai Goshi", categoria: "queda", tags: "queda" },
  { id: "p-uchi-mata", nome: "Uchi Mata", categoria: "queda", tags: "queda" },
  { id: "p-kouchi-gari", nome: "Kouchi Gari", categoria: "queda", tags: "queda" },
  { id: "p-koshi-guruma", nome: "Koshi Guruma", categoria: "queda", tags: "queda" },
  { id: "p-tai-otoshi", nome: "Tai Otoshi", categoria: "queda", tags: "queda" },
  { id: "p-ude-gaeshi", nome: "Ude Gaeshi", categoria: "queda", tags: "queda" },
  { id: "p-single-leg", nome: "Single leg", categoria: "queda", tags: "queda" },
  { id: "p-catada-pe", nome: "Catada de pé", nomeEn: "Ankle pick", categoria: "queda", tags: "queda" },
  { id: "p-puxada-dupla", nome: "Puxada dupla", nomeEn: "Double pull", categoria: "transicao", tags: "guarda" },

  // Passagens
  { id: "p-kneecut", nome: "Passagem joelho cruzado", nomeEn: "Knee cut pass", categoria: "passagem", tags: "passagem" },
  { id: "p-toreando", nome: "Passagem toreando", nomeEn: "Toreando pass", categoria: "passagem", tags: "passagem" },
  { id: "p-leg-drag", nome: "Passagem leg drag", nomeEn: "Leg drag pass", categoria: "passagem", tags: "passagem" },
  { id: "p-double-under", nome: "Passagem double under", nomeEn: "Double under pass", categoria: "passagem", tags: "passagem" },
  { id: "p-long-step", nome: "Passagem long step", nomeEn: "Long step pass", categoria: "passagem", tags: "passagem" },
  { id: "p-estrelinha", nome: "Passagem estrelinha", nomeEn: "Cartwheel pass", categoria: "passagem", tags: "passagem" },

  // Raspagens
  { id: "p-tesourinha", nome: "Raspagem tesourinha", nomeEn: "Scissor sweep", categoria: "raspagem", tags: "raspagem, guarda" },
  { id: "p-hipbump", nome: "Raspagem batida de quadril", nomeEn: "Hip bump sweep", categoria: "raspagem", tags: "raspagem, guarda" },
  { id: "p-double-ankle", nome: "Raspagem dominando os dois pés", nomeEn: "Double ankle sweep", categoria: "raspagem", tags: "raspagem" },

  // Guardas
  { id: "p-aranha", nome: "Guarda aranha", nomeEn: "Spider guard", categoria: "guarda", tags: "guarda" },
  { id: "p-delariva", nome: "Guarda De La Riva", nomeEn: "De La Riva", categoria: "guarda", tags: "guarda" },
  { id: "p-delariva-invertida", nome: "De La Riva invertida", nomeEn: "Inverted De La Riva", categoria: "guarda", tags: "guarda" },
  { id: "p-delariva-profunda", nome: "De La Riva profunda", nomeEn: "Deep De La Riva", categoria: "guarda", tags: "guarda" },
  { id: "p-laco", nome: "Guarda laço", nomeEn: "Lasso guard", categoria: "guarda", tags: "guarda" },
  { id: "p-one-leg", nome: "Guarda one-leg", nomeEn: "One-leg guard", categoria: "guarda", tags: "guarda" },
  { id: "p-guarda-x", nome: "Guarda X", nomeEn: "X-guard", categoria: "guarda", tags: "guarda" },
  { id: "p-5050", nome: "Guarda 50/50", nomeEn: "50-50 guard", categoria: "guarda", tags: "guarda" },
  { id: "p-borboleta", nome: "Guarda borboleta", nomeEn: "Butterfly guard", categoria: "guarda", tags: "guarda" },
  { id: "p-escudo", nome: "Guarda escudo", nomeEn: "Shield guard", categoria: "guarda", tags: "guarda" },
  { id: "p-guarda-sentada", nome: "Guarda sentada", nomeEn: "Seated guard", categoria: "guarda", tags: "guarda" },
  { id: "p-meia-guarda", nome: "Meia guarda tradicional", nomeEn: "Half guard", categoria: "guarda", tags: "guarda" },
  { id: "p-meia-invertida", nome: "Meia guarda invertida", nomeEn: "Inverted half guard", categoria: "guarda", tags: "guarda" },
  { id: "p-meia-profunda", nome: "Meia guarda profunda", nomeEn: "Deep half guard", categoria: "guarda", tags: "guarda" },

  // Transições
  { id: "p-costas-100kg", nome: "Pegada de costas partindo do 100 kg", nomeEn: "Back take from side control", categoria: "transicao", tags: "costas" },
  { id: "p-costas-turtle", nome: "Pegada de costas do quatro apoios", nomeEn: "Back take from turtle", categoria: "transicao", tags: "costas" },
  { id: "p-berimbolo", nome: "Berimbolo", categoria: "transicao", tags: "costas, guarda" },

  // Finalizações
  { id: "p-cruzado", nome: "Estrangulamento cruzado da guarda fechada", nomeEn: "Cross collar choke", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-armlock-guarda", nome: "Armlock da guarda fechada", nomeEn: "Armbar from closed guard", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-armlock-montada", nome: "Armlock da montada", nomeEn: "Armbar from mount", categoria: "finalizacao", tags: "finalização" },
  { id: "p-americana-100kg", nome: "Americana do 100 kg", nomeEn: "Americana from side control", categoria: "finalizacao", tags: "finalização, controle" },
  { id: "p-kimura", nome: "Kimura da guarda", nomeEn: "Kimura", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-triangulo", nome: "Triângulo da guarda fechada", nomeEn: "Triangle", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-omoplata", nome: "Omoplata", categoria: "finalizacao", tags: "finalização, guarda" },
  { id: "p-mataleao", nome: "Mata-leão", nomeEn: "Rear naked choke", categoria: "finalizacao", tags: "finalização, costas" },
  { id: "p-arco-flecha", nome: "Estrangulamento de arco e flecha", nomeEn: "Bow and arrow choke", categoria: "finalizacao", tags: "finalização, costas" },
  { id: "p-chave-reta-ns", nome: "Chave reta do norte-sul", nomeEn: "Straight armlock from north-south", categoria: "finalizacao", tags: "finalização" },
  { id: "p-kimura-ns", nome: "Kimura do norte-sul", nomeEn: "Kimura from north-south", categoria: "finalizacao", tags: "finalização" },
  { id: "p-armlock-voador", nome: "Armlock voador", nomeEn: "Flying armbar", categoria: "finalizacao", tags: "finalização, aéreo" },
  { id: "p-triangulo-voador", nome: "Triângulo voador", nomeEn: "Flying triangle", categoria: "finalizacao", tags: "finalização, aéreo" },
  { id: "p-botinha", nome: "Botinha (chave de pé reta)", nomeEn: "Straight foot lock", categoria: "finalizacao", tags: "finalização, perna" },
];

// Requisito que aponta para uma posição do catálogo (vale para todas as idades).
function req(posicaoId: string, nota?: string) {
  return { id: `r-${posicaoId}`, posicaoId, nota, faixaEtariaId: null };
}
// Requisito de texto livre (conduta, revisão etc.).
function reqTexto(texto: string) {
  return {
    id: `rt-${texto.slice(0, 14).replace(/\W+/g, "-").toLowerCase()}`,
    posicaoId: null,
    texto,
    faixaEtariaId: null,
  };
}
// Critério de exame (para todas as idades).
function crit(texto: string) {
  return {
    id: `c-${texto.slice(0, 14).replace(/\W+/g, "-").toLowerCase()}`,
    texto,
    faixaEtariaId: null,
  };
}

// ---- Programas por faixa (rascunho da apostila; tudo editável no sistema) ----

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

const PROGRAMA_CINZA = {
  faixaBase: 5,
  tag: "Consolidação dos fundamentos",
  perfil:
    "Os fundamentos viram reflexo. O aluno já sobrevive; agora encadeia queda, controle e a primeira finalização completa. Começa a entender que jiu-jitsu é posição antes de submissão.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-cinza-1",
      titulo: "Queda e montada",
      requisitos: [req("p-osotogari"), req("p-armlock-montada"), req("p-saida-montada")],
      criterios: [crit("Derruba com osotogari e ataca da montada mantendo o controle.")],
    },
    {
      id: "g-cinza-2",
      titulo: "Ataques da guarda",
      requisitos: [req("p-cruzado"), req("p-armlock-guarda"), req("p-kimura"), req("p-hipbump")],
      criterios: [crit("Ameaça dois ataques diferentes a partir da guarda fechada.")],
    },
    {
      id: "g-cinza-3",
      titulo: "As costas",
      requisitos: [req("p-costas-100kg"), req("p-mataleao"), req("p-defesa-costas")],
      criterios: [crit("Toma as costas, encaixa os ganchos e ameaça o mata-leão.")],
    },
    {
      id: "g-cinza-4",
      titulo: "Passar a guarda",
      requisitos: [req("p-kneecut"), req("p-toreando"), req("p-joelho-barriga")],
      criterios: [crit("Passa a guarda e estabiliza no joelho na barriga ou 100 kg."), crit("Exame → Amarela.")],
    },
  ],
};

const PROGRAMA_AMARELA = {
  faixaBase: 10,
  tag: "Ampliando o jogo",
  perfil:
    "Mais posições, mais respostas. O repertório cresce: novas quedas, novos controles e a introdução das guardas abertas. O aluno começa a ter opções em vez de uma única resposta para cada situação.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-amarela-1",
      titulo: "Norte-sul",
      requisitos: [req("p-ippon-seoi"), req("p-norte-sul"), req("p-chave-reta-ns"), req("p-kimura-ns")],
      criterios: [crit("Transita para o norte-sul e ameaça a chave reta.")],
    },
    {
      id: "g-amarela-2",
      titulo: "Triângulo",
      requisitos: [req("p-triangulo"), req("p-armlock-guarda"), req("p-omoplata")],
      criterios: [crit("Fecha o triângulo e ajusta o ângulo para finalizar.")],
    },
    {
      id: "g-amarela-3",
      titulo: "Guarda aranha",
      requisitos: [req("p-aranha"), req("p-double-ankle"), req("p-triangulo")],
      criterios: [crit("Mantém a aranha ativa e conclui uma raspagem.")],
    },
    {
      id: "g-amarela-4",
      titulo: "Meia guarda",
      requisitos: [req("p-meia-guarda"), req("p-catada-pe")],
      criterios: [crit("Joga a meia guarda dos dois lados: raspa e passa."), crit("Exame → Laranja.")],
    },
  ],
};

const PROGRAMA_LARANJA = {
  faixaBase: 15,
  tag: "Guardas e transições",
  perfil:
    "O jogo fica dinâmico. Entram as guardas modernas e o encadeamento entre elas. O aluno para de segurar uma posição e passa a transitar entre guardas, raspagens e as costas.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-laranja-1",
      titulo: "De La Riva",
      requisitos: [req("p-harai-goshi"), req("p-delariva")],
      criterios: [crit("Instala a De La Riva e ameaça raspagem ou costas.")],
    },
    {
      id: "g-laranja-2",
      titulo: "Berimbolo e quatro apoios",
      requisitos: [req("p-berimbolo"), req("p-costas-turtle"), req("p-arco-flecha")],
      criterios: [crit("Sai do quatro apoios para as costas e finaliza de arco e flecha.")],
    },
    {
      id: "g-laranja-3",
      titulo: "Laço e one-leg",
      requisitos: [req("p-laco"), req("p-one-leg")],
      criterios: [crit("Transita entre duas guardas abertas sem perder o controle.")],
    },
    {
      id: "g-laranja-4",
      titulo: "X e 50/50",
      requisitos: [req("p-guarda-x"), req("p-5050"), req("p-leg-drag"), req("p-puxada-dupla")],
      criterios: [crit("Raspa da guarda X ou 50/50 e conclui a passagem do parceiro."), crit("Exame → Verde.")],
    },
  ],
};

const PROGRAMA_VERDE = {
  faixaBase: 20,
  tag: "Topo do infantil · jogo completo",
  perfil:
    "A faixa mais alta do infantojuvenil. O aluno domina o jogo por completo — em pé e no solo, ataque e defesa — e já demonstra liderança na turma. É a ponte para a azul, quando fizer 16 anos.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-verde-1",
      titulo: "Repertório em pé",
      requisitos: [req("p-uchi-mata"), req("p-kouchi-gari"), req("p-koshi-guruma"), reqTexto("Contra-quedas")],
      criterios: [crit("Tem ao menos três quedas eficazes e responde à queda do parceiro.")],
    },
    {
      id: "g-verde-2",
      titulo: "Meia guarda avançada",
      requisitos: [req("p-meia-invertida"), req("p-meia-profunda")],
      criterios: [crit("Usa a meia invertida/profunda para raspar ou tomar as costas.")],
    },
    {
      id: "g-verde-3",
      titulo: "Sistema de costas",
      requisitos: [req("p-arco-flecha"), req("p-mataleao"), req("p-defesa-costas")],
      criterios: [crit("Encadeia dois ataques de costas e defende quando está atrás.")],
    },
    {
      id: "g-verde-4",
      titulo: "Prova completa",
      requisitos: [req("p-armlock-voador"), req("p-triangulo-voador"), req("p-guarda-sentada"), reqTexto("Revisão geral de todas as faixas")],
      criterios: [crit("Demonstra a grade completa do infantil."), crit("Exame → Azul (a partir dos 16 anos).")],
    },
  ],
};

const PROGRAMA_AZUL = {
  faixaBase: 25,
  tag: "Base do adulto · 16 anos +",
  perfil:
    "A primeira faixa adulta. Repertório completo de gi e no-gi, consistência técnica e início de um estilo próprio. A azul é uma faixa longa: consolida tudo o que virá a ser refinado nas seguintes.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-azul-1",
      titulo: "Quedas competitivas",
      requisitos: [req("p-single-leg"), req("p-baiana"), req("p-tai-otoshi"), req("p-ude-gaeshi")],
      criterios: [crit("Entra e finaliza quedas dos dois lados e defende a queda alheia.")],
    },
    {
      id: "g-azul-2",
      titulo: "Passagens de pressão",
      requisitos: [req("p-double-under"), req("p-long-step"), req("p-leg-drag"), req("p-estrelinha")],
      criterios: [crit("Passa a guarda por pressão e estabiliza controle dominante.")],
    },
    {
      id: "g-azul-3",
      titulo: "Guardas abertas",
      requisitos: [req("p-borboleta"), req("p-escudo"), req("p-delariva-profunda")],
      criterios: [crit("Tem um jogo de guarda funcional com raspagem e finalização.")],
    },
    {
      id: "g-azul-4",
      titulo: "Finalizações encadeadas",
      requisitos: [req("p-armlock-guarda"), req("p-triangulo"), req("p-omoplata"), req("p-kimura"), req("p-botinha")],
      criterios: [crit("Encadeia três finalizações e defende as principais chaves."), crit("Exame → Roxa.")],
    },
  ],
};

const PROGRAMA_ROXA = {
  faixaBase: 30,
  tag: "Refino e estilo próprio",
  perfil:
    "O aluno vira um jogo autoral. Alta complexidade, guardas modernas encadeadas e contra-ataque. Começa também o papel de liderança: a roxa auxilia o professor e serve de exemplo para as faixas coloridas.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-roxa-1",
      titulo: "Guardas modernas",
      requisitos: [req("p-guarda-x"), req("p-one-leg"), req("p-laco"), req("p-delariva")],
      criterios: [crit("Conecta três guardas em uma sequência fluida.")],
    },
    {
      id: "g-roxa-2",
      titulo: "Passar e contra-atacar",
      requisitos: [req("p-leg-drag"), reqTexto("Contra-ataques na passagem")],
      criterios: [crit("Passa por pressão e responde ao contra-ataque do parceiro.")],
    },
    {
      id: "g-roxa-3",
      titulo: "Domínio das costas",
      requisitos: [req("p-arco-flecha"), req("p-mataleao"), reqTexto("Recomposição e defesa das costas")],
      criterios: [crit("Mantém as costas contra resistência e finaliza com controle.")],
    },
    {
      id: "g-roxa-4",
      titulo: "Inversões",
      requisitos: [req("p-berimbolo"), req("p-delariva-invertida"), req("p-meia-profunda")],
      criterios: [crit("Usa inversões para chegar às costas ou finalizar com segurança."), crit("Exame → Marrom.")],
    },
  ],
};

const PROGRAMA_MARROM = {
  faixaBase: 35,
  tag: "Maturidade técnica",
  perfil:
    "Quase professor. Domínio de gi e no-gi, timing, economia de energia e leitura de jogo. A marrom não aprende só técnica nova: aprende a ensinar, a demonstrar e a conduzir a turma.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-marrom-1",
      titulo: "Pegada e timing",
      requisitos: [reqTexto("Luta de pegada (grip fighting) e controle"), reqTexto("Timing e uso eficiente de energia")],
      criterios: [crit("Vence a pegada e impõe o próprio jogo desde o início.")],
    },
    {
      id: "g-marrom-2",
      titulo: "Dominância",
      requisitos: [reqTexto("Dominância posicional e finalização sob pressão"), reqTexto("Resolução de problemas em posições difíceis")],
      criterios: [crit("Sai de posições ruins e finaliza mantendo o controle.")],
    },
    {
      id: "g-marrom-3",
      titulo: "Ensinar",
      requisitos: [reqTexto("Demonstra e explica toda a grade das faixas anteriores"), reqTexto("Conduz uma parte da aula sob supervisão")],
      criterios: [crit("Ensina uma posição de forma clara para uma faixa colorida.")],
    },
    {
      id: "g-marrom-4",
      titulo: "Formação",
      requisitos: [reqTexto("Preparação competitiva de alto nível"), reqTexto("Mentoria das faixas coloridas do projeto")],
      criterios: [crit("Avaliação do professor responsável e do tempo de federação."), crit("Exame → Preta.")],
    },
  ],
};

const PROGRAMA_PRETA = {
  faixaBase: 40,
  tag: "Professor e atleta formado",
  perfil:
    "A faixa preta não encerra o aprendizado — inaugura a responsabilidade de transmitir o conhecimento e os valores do instituto. No sistema, a preta é o topo da escala; os graus da faixa preta seguem o tempo e as regras da federação.",
  faixasEtarias: [],
  graus: [
    {
      id: "g-preta-1",
      titulo: "Requisitos da faixa preta",
      requisitos: [
        reqTexto("Tempo de federação (IBJJF) cumprido nas faixas anteriores"),
        reqTexto("Contribuição concreta ao projeto e à formação de novos alunos"),
        reqTexto("Capacidade de conduzir aulas e graduações"),
        reqTexto("Conduta exemplar dentro e fora do tatame"),
        reqTexto("Compromisso público com a missão do Instituto Tribo de Davi"),
      ],
      criterios: [crit("Concessão é decisão do professor responsável.")],
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

// Escada de restrição lida da grade oficial (pág. 1 do PDF): para cada golpe, o
// número de divisões (d1..d6, na ordem de DIVISOES) em que ele é restrito. As
// bolinhas vermelhas da tabela = Falta Gravíssima; célula vazia = permitido.
// Ordem das divisões: [4-12, 13-15, 16-17+branca, azul/roxa, marrom-preta
// exceto sem-kimono, marrom-preta sem-kimono].
const RESTRITO_ATE: number[] = [
  1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6,
];

const GOLPES_SEED: GolpeRestrito[] = DESCRICOES_GOLPES.map((descricao, i) => {
  const n = RESTRITO_ATE[i] ?? 0;
  const sev: Record<string, string> = {};
  for (let d = 0; d < n; d++) sev[`d${d + 1}`] = "gravissima";
  return { id: `golpe-${i + 1}`, descricao, severidadePorDivisao: sev };
});

const PROGRAMAS_SEED = [
  PROGRAMA_BRANCA,
  PROGRAMA_CINZA,
  PROGRAMA_AMARELA,
  PROGRAMA_LARANJA,
  PROGRAMA_VERDE,
  PROGRAMA_AZUL,
  PROGRAMA_ROXA,
  PROGRAMA_MARROM,
  PROGRAMA_PRETA,
];

// Faixa recomendada de cada posição = a faixa (cor) mais baixa em que ela
// aparece como requisito nos programas semente. Assim, usar uma posição antes
// dessa faixa gera aviso. Posições não usadas ficam sem recomendação.
const RECOMENDADA_POR_POSICAO = new Map<string, number>();
for (const prog of PROGRAMAS_SEED) {
  for (const g of prog.graus) {
    for (const r of g.requisitos) {
      if (!r.posicaoId) continue;
      const atual = RECOMENDADA_POR_POSICAO.get(r.posicaoId);
      if (atual == null || prog.faixaBase < atual) {
        RECOMENDADA_POR_POSICAO.set(r.posicaoId, prog.faixaBase);
      }
    }
  }
}
for (const p of POSICOES_SEED) {
  const rec = RECOMENDADA_POR_POSICAO.get(p.id);
  if (rec != null) p.faixaRecomendada = rec;
}

export const CONFIG_DEFAULT: ConfigGraduacao = {
  // Bump ao ampliar a semente (dispara a migração aditiva no store).
  // v3: severidades dos golpes restritos lidas da grade oficial.
  // v4: faixa recomendada por posição.
  versao: 4,
  posicoes: POSICOES_SEED,
  golpesRestritos: GOLPES_SEED,
  programas: PROGRAMAS_SEED,
  // Parâmetros de aptidão começam vazios: o admin define na tela Parâmetros.
  parametros: [],
};
