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

// FAQ da página de Informações: categorias com perguntas. Cada pergunta abre a
// resposta (acordeão) e pode levar à parte certa do site por um link opcional.
export interface LinkFaq {
  label: string;
  para: string; // rota interna (ex.: "/matricula") ou URL externa
  externo?: boolean;
}
export interface PerguntaFaq {
  pergunta: string;
  resposta: string;
  link?: LinkFaq;
}
export interface CategoriaFaq {
  titulo: string;
  perguntas: PerguntaFaq[];
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
    "Fundado em 2013, na cidade de Blumenau (SC), o Instituto Tribo de Davi, que na época se chamava Instituto Elo Vital, nasceu através de um sonho de fazer a diferença e transformar vidas, com a missão de oferecer alternativas por meio do esporte, da cultura e da assistência social.",
    "Desde o início, o Instituto se dedicou a oferecer oportunidades para crianças, adolescentes e adultos, principalmente aos em situação de vulnerabilidade social, fortalecendo valores como respeito, disciplina, amor ao próximo e cidadania.",
    "Ao longo dos anos, a prática do jiu-jitsu se tornou a principal ferramenta de inclusão e desenvolvimento utilizada pela instituição. Mais do que ensinar técnicas de luta, o objetivo sempre foi formar cidadãos conscientes, capazes de enfrentar desafios com determinação, respeito ao próximo e resiliência. O Instituto busca ser uma alternativa saudável e transformadora ao caminho das drogas, oferecendo um ambiente seguro, de aprendizado e crescimento, pautado em princípios cristãos.",
    "Com sede em Blumenau, o Instituto ao longo dos anos evoluiu e expandiu suas atividades para diferentes polos na cidade, como Itoupavazinha, Guarapari, Araranguá e Eça de Queiroz, proporcionando aulas seguindo o calendário escolar e mantendo as atividades durante todo o ano, sem pausa entre os semestres. A metodologia de ensino do jiu-jitsu adotada prioriza o crescimento técnico, físico e emocional, aliando fundamentos esportivos a valores humanos e espirituais.",
    "Além do trabalho esportivo, o Instituto Tribo de Davi também atua em frentes socioeducativas, atendendo pessoas em cumprimento de medidas socioeducativas. Essa atuação multifacetada reforça o compromisso com a transformação social e o fortalecimento da comunidade, sempre guiados pelos valores cristãos.",
    "Desde sua fundação, centenas de alunos já passaram pelos tatames do Instituto, carregando consigo não apenas novas habilidades esportivas, mas também lições de vida e fé. A cada troca de faixa, celebra-se mais do que um avanço técnico — celebra-se a superação, a perseverança e o potencial humano que floresce quando guiado por valores eternos.",
    "Hoje, mais de uma década após seu início, o Instituto Tribo de Davi continua firme em sua missão, expandindo seu alcance e consolidando-se como referência em projetos sociais que unem esporte, fé e cidadania.",
  ] as string[],

  // Prestação de contas. O texto pode ser ajustado; os documentos aparecem
  // como links para download (relatórios, balancetes, etc.).
  prestacaoContas: {
    texto:
      "A transparência é um compromisso do Instituto. Publicamos aqui os relatórios e documentos da nossa prestação de contas — de onde vêm e para onde vão os recursos que mantêm o projeto.",
    documentos: [] as Documento[],
  },

  // FAQ da página "/informacoes": organizado por assunto. Cada pergunta abre a
  // resposta ao clicar e pode levar à parte certa do site. AJUSTE as respostas
  // e adicione perguntas à vontade — categoria/pergunta sem conteúdo some.
  informacoes: {
    // Texto de abertura da página (opcional; vazio esconde).
    intro:
      "Reunimos aqui as dúvidas mais comuns das famílias e dos alunos. Toque em uma pergunta para ver a resposta.",
    categorias: [
      {
        titulo: "Sobre o projeto",
        perguntas: [
          {
            pergunta: "O que é o Instituto Tribo de Davi?",
            resposta:
              "É um projeto social fundado em 2013, em Blumenau (SC), que usa o jiu-jitsu como ferramenta de transformação de vidas, com base em valores cristãos. Atende crianças, adolescentes e adultos, principalmente em situação de vulnerabilidade social.",
          },
          {
            pergunta: "O projeto é realmente gratuito?",
            resposta:
              "Sim. As aulas são 100% gratuitas, sem mensalidade. O quimono e a faixa são emprestados pelo instituto a quem precisar.",
          },
          {
            pergunta: "Quem pode participar?",
            resposta:
              "Crianças, adolescentes e adultos. Há turmas para o público infantil e uma ficha específica para adultos.",
            link: { label: "Fazer inscrição", para: "/matricula" },
          },
          {
            pergunta: "Em quais valores o projeto se baseia?",
            resposta:
              "Disciplina, respeito, cidadania e princípios cristãos — usando o esporte como um caminho saudável de crescimento e uma alternativa firme frente às drogas.",
          },
        ],
      },
      {
        titulo: "Inscrição e matrícula",
        perguntas: [
          {
            pergunta: "Como faço a inscrição?",
            resposta:
              "A inscrição é online, pelo nosso site. Você preenche a ficha (criança/adolescente ou adulto) e a equipe do polo revisa e confirma a matrícula.",
            link: { label: "Fazer inscrição", para: "/matricula" },
          },
          {
            pergunta: "Preciso levar algum documento?",
            resposta:
              "A ficha pede os dados do aluno e do responsável (nome, RG, CPF, endereço e contato). Não é preciso anexar documentos digitalizados na inscrição.",
          },
          {
            pergunta: "Posso enviar uma foto do aluno?",
            resposta:
              "Sim, é opcional. Deve ser uma foto apenas do rosto, em ambiente claro. Você pode tirar na hora pelo celular ou escolher uma imagem. Fotos fora dessas diretrizes são removidas pela equipe na aprovação.",
            link: { label: "Fazer inscrição", para: "/matricula" },
          },
          {
            pergunta: "Já sou aluno; como faço a rematrícula?",
            resposta:
              "No formulário de inscrição há a opção de trazer seus dados pelo CPF do responsável e a data de nascimento do aluno, evitando redigitar tudo.",
            link: { label: "Fazer rematrícula", para: "/matricula" },
          },
          {
            pergunta: "Tem turma para adultos?",
            resposta:
              "Sim. Ao iniciar a inscrição, escolha o público 'Adulto' para abrir a ficha específica.",
            link: { label: "Inscrição de adulto", para: "/matricula" },
          },
        ],
      },
      {
        titulo: "Aulas, uniforme e horários",
        perguntas: [
          {
            pergunta: "Preciso ter quimono para começar?",
            resposta:
              "Não. O instituto empresta quimono e faixa a quem precisar — é só chegar com vontade de treinar.",
          },
          {
            pergunta: "Quais são os horários das aulas?",
            resposta:
              "Os horários variam conforme o polo e a turma. Confira com a equipe do polo mais próximo pelos nossos canais de contato.",
          },
          {
            pergunta: "O projeto para nas férias escolares?",
            resposta:
              "Não. Seguimos o calendário escolar, mas mantemos as atividades ao longo de todo o ano, sem pausa entre os semestres.",
          },
          {
            pergunta: "O que acontece se o aluno faltar?",
            resposta:
              "A presença é registrada em toda aula. Quando um aluno começa a faltar, a família é procurada antes que ele desista.",
          },
        ],
      },
      {
        titulo: "Graduação (faixas)",
        perguntas: [
          {
            pergunta: "Como funciona a graduação?",
            resposta:
              "O jiu-jitsu infantil vai da faixa branca à preta, com graus intermediários. A troca de faixa reconhece a evolução técnica, a frequência e o comportamento do aluno no tatame.",
          },
          {
            pergunta: "Quando o aluno troca de faixa?",
            resposta:
              "As graduações acontecem em datas definidas pela equipe técnica, conforme a evolução de cada aluno.",
          },
        ],
      },
      {
        titulo: "Acompanhar o aluno",
        perguntas: [
          {
            pergunta: "Como acompanho a frequência do meu filho?",
            resposta:
              "Pela Área do Responsável, usando o código de acesso do aluno e a data de nascimento. Lá você vê presenças, avisos e graduações.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },
          {
            pergunta: "Como justifico uma falta?",
            resposta:
              "Na Área do Responsável, na lista de presenças, é possível justificar uma falta específica.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },
          {
            pergunta: "Como autorizo ou revogo o uso de imagem?",
            resposta:
              "A autorização de uso de imagem pode ser dada ou retirada a qualquer momento na Área do Responsável.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },
          {
            pergunta: "Onde consigo o código de acesso?",
            resposta:
              "O código é fornecido pela equipe do polo. Fale com o professor responsável pela turma do aluno.",
          },
        ],
      },
      {
        titulo: "Fotos, vídeos e eventos",
        perguntas: [
          {
            pergunta: "Onde vejo fotos das aulas e eventos?",
            resposta:
              "Na nossa Galeria, com coleções de treinos, graduações e eventos do projeto.",
            link: { label: "Ver galeria", para: "/galeria" },
          },
          {
            pergunta: "Vocês têm vídeos?",
            resposta: "Sim, há uma galeria de vídeos no site, junto das fotos.",
            link: { label: "Ver galeria", para: "/galeria" },
          },
        ],
      },
      {
        titulo: "Apoiar o projeto",
        perguntas: [
          {
            pergunta: "Como faço uma doação?",
            resposta:
              "Você pode doar por Pix, de forma rápida e segura, pela nossa página de doação.",
            link: { label: "Doar por Pix", para: "/doar" },
          },
          {
            pergunta: "Onde vejo a prestação de contas?",
            resposta:
              "Na página de Transparência, com os números de impacto, o resumo financeiro e os documentos do projeto.",
            link: { label: "Ver transparência", para: "/transparencia" },
          },
          {
            pergunta: "Posso ajudar de outras formas?",
            resposta:
              "Sim. Doação de materiais, voluntariado e parcerias ajudam muito o projeto a seguir. Fale com a equipe pelos nossos canais.",
          },
        ],
      },
      {
        titulo: "Polos e Endereços",
        perguntas: [
          {
            pergunta: "Em quais bairros vocês atuam?",
            resposta:
              "Com sede em Blumenau (SC), o instituto mantém polos em bairros como Itoupavazinha, Guarapari, Araranguá e Eça de Queiroz.",
          },
          {
            pergunta: "Como falo com a equipe?",
            resposta:
              "Fale com a gente pelos canais no rodapé do site (WhatsApp, e-mail ou Instagram). Teremos prazer em ajudar.",
          },
        ],
      },
    ] as CategoriaFaq[],
  },

  // PREENCHER: polos com endereço, horários e responsável.
  // Enquanto a lista estiver vazia, a parte de polos não aparece.
  polos: [] as Polo[],

  contato: {
    // PREENCHER: telefone só com números, com DDD (ex.: "47999998888").
    whatsapp: "",
    // PREENCHER: e-mail institucional.
    email: "institutotribodedavi@gmail.com",
    // PREENCHER: usuário do Instagram, sem o "@".
    instagram: "institutotribodedavi",
    // PREENCHER: cidade/estado de atuação.
    cidade: "Blumenau/SC",
  },
};

export const temContato = () =>
  Boolean(
    SITE.contato.whatsapp || SITE.contato.email || SITE.contato.instagram
  );

// A página de Informações aparece se houver alguma pergunta no FAQ ou polos.
export const temInformacoes = () =>
  SITE.informacoes.categorias.some((c) => c.perguntas.length > 0) ||
  SITE.polos.length > 0;
