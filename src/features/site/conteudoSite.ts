// Conteúdo do site público. Tudo o que muda com o tempo (contatos, polos,
// horários, textos, fotos) fica aqui, num lugar só, para não precisar caçar
// texto dentro do componente.
//
// >>> OS CAMPOS MARCADOS COM "PREENCHER"/"AJUSTE" SÃO EDITÁVEIS. <<<
// Onde a informação fica vazia, o site simplesmente não mostra aquele item,
// em vez de exibir um dado inventado.

export interface Polo {
  nome: string;
  endereco?: string;
  horarios?: string;
  responsavel?: string;
}

export interface Foto {
  url: string; // caminho da imagem (em /public) ou URL completa
  legenda?: string;
}

export interface Documento {
  nome: string;
  url: string; // link do documento (PDF, Drive, etc.)
}

export const SITE = {
  nome: "Instituto Tribo de Davi",
  // Frase de efeito do topo.
  chamada: "Jiu-jitsu que forma campeões dentro e fora do tatame",
  subChamada:
    "Aulas gratuitas de jiu-jitsu para crianças e adolescentes, com disciplina, respeito e acompanhamento de perto.",

  // Números do projeto. Deixe 0 para esconder o item.
  numeros: {
    alunos: 253,
    polos: 5,
    // PREENCHER: ano em que o instituto começou (0 esconde o item).
    desde: 0,
  },

  // O que o projeto entrega. Editável à vontade.
  pilares: [
    {
      titulo: "Aulas gratuitas",
      texto:
        "Treinos de jiu-jitsu sem mensalidade, com quimono e faixa emprestados pelo instituto a quem precisa.",
    },
    {
      titulo: "Disciplina e respeito",
      texto:
        "Mais do que técnica, o tatame ensina rotina, autocontrole e convivência — valores que a criança leva para casa e para a escola.",
    },
    {
      titulo: "Acompanhamento de perto",
      texto:
        "Presença é registrada aula a aula. Quando um aluno começa a faltar, a família é procurada antes que ele desista.",
    },
  ],

  // AJUSTE com a história real do instituto. Cada item é um parágrafo.
  // Lista vazia esconde a seção "Nossa história".
  historia: [
    "O Instituto Tribo de Davi usa o jiu-jitsu como ferramenta de transformação social, oferecendo aulas gratuitas a crianças e adolescentes. Mais do que ensinar uma arte marcial, o projeto forma caráter — disciplina, respeito e fé caminham junto com a técnica no tatame.",
    "Cada faixa conquistada é também uma conquista pessoal: autoconfiança, rotina e pertencimento. É assim que formamos campeões dentro e fora do tatame.",
  ] as string[],

  // PREENCHER: fotos das aulas, eventos e graduações.
  // Enquanto a lista estiver vazia, a galeria mostra "em breve".
  fotos: [] as Foto[],

  // Prestação de contas. O texto pode ser ajustado; os documentos aparecem
  // como links para download (relatórios, balancetes, etc.).
  prestacaoContas: {
    texto:
      "A transparência é um compromisso do Instituto. Publicamos aqui os relatórios e documentos da nossa prestação de contas — de onde vêm e para onde vão os recursos que mantêm o projeto.",
    documentos: [] as Documento[],
  },

  // Informações gerais do projeto. As regras aparecem em lista.
  informacoes: {
    regras: [
      "Uniforme (quimono) e faixa são emprestados pelo instituto a quem precisa.",
      "A presença é registrada em toda aula — pontualidade e frequência importam.",
      "Respeito ao professor, aos colegas e ao espaço de treino.",
      "A família é comunicada quando o aluno começa a faltar.",
    ] as string[],
  },

  // PREENCHER: polos com endereço, horários e responsável.
  // Enquanto a lista estiver vazia, a parte de polos não aparece.
  polos: [] as Polo[],

  contato: {
    // PREENCHER: telefone só com números, com DDD (ex.: "47999998888").
    whatsapp: "",
    // PREENCHER: e-mail institucional.
    email: "",
    // PREENCHER: usuário do Instagram, sem o "@".
    instagram: "",
    // PREENCHER: cidade/estado de atuação.
    cidade: "",
  },
};

export const temContato = () =>
  Boolean(SITE.contato.whatsapp || SITE.contato.email || SITE.contato.instagram);
