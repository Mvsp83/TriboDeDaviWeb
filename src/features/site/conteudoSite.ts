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
  chamada: "Jiu-Jitsu que transforma vidas. Propósito que transforma histórias",
  subChamada:
    "Projeto social sem fins lucrativos que oferta Jiu-Jitsu para crianças, adolescentes e adultos, norteado pelos princípios cristãos, pela disciplina e pelo respeito. Em parceria com a comunidade, trabalhamos na formação de cidadãos e na prevenção e combate às drogas.",

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
      titulo: "Disciplina que transforma",
      texto:
        "Mais do que aprender técnicas de jiu-jitsu, nossos alunos aprendem a ter disciplina, respeito, autocontrole e responsabilidade. No tatame, cada treino é uma oportunidade de desenvolver valores que vão muito além do esporte e acompanham a criança e o adolescente em casa, na escola e em toda a sua caminhada.",
    },
    {
      titulo: "Cuidado e acompanhamento de perto",
      texto:
        "Cada aluno importa. Por isso, acompanhamos a presença e a evolução de cada participante aula após aula. Quando percebemos que um aluno está se afastando ou começando a faltar, buscamos entender o motivo e nos aproximar da família. Nosso objetivo não é apenas ensinar jiu-jitsu, mas caminhar ao lado de cada aluno e família, ajudando-o a permanecer no caminho do desenvolvimento e da transformação.",
    },
    {
      titulo: "Fé, valores e cidadania",
      texto:
        "Acreditamos que a formação de uma pessoa vai muito além do desenvolvimento físico. Por meio de dinâmicas, ensinamentos e ações socioeducativas, trabalhamos princípios cristãos como amor ao próximo, respeito, responsabilidade, perseverança e solidariedade. Também buscamos fortalecer a comunidade por meio de parcerias com instituições de assistência social, escolas e iniciativas de prevenção e combate às drogas, contribuindo para que crianças, adolescentes e famílias tenham acesso a oportunidades, orientação e um ambiente seguro para crescer.",
    },
  ],

  // AJUSTE com a história real do instituto. Cada item é um parágrafo.
  // Lista vazia esconde a seção "Nossa história".
  historia: [
    "Um sonho que se tornou uma missão",

    "Fundado em 2013, na cidade de Blumenau (SC), o Instituto Tribo de Davi nasceu de um sonho: fazer a diferença e contribuir para a transformação de vidas. Na época, chamado Instituto Elo Vital, iniciou sua trajetória com a missão de oferecer novas oportunidades por meio do esporte, da cultura e da assistência social.",

    "Desde o começo, o Instituto escolheu olhar para pessoas e comunidades que precisam de oportunidades para construir um futuro melhor. Crianças, adolescentes e adultos, especialmente aqueles em situação de vulnerabilidade social, passaram a encontrar no projeto um espaço de acolhimento, desenvolvimento e esperança.",

    "O jiu-jitsu como ferramenta de transformação",

    "Ao longo dessa caminhada, o jiu-jitsu tornou-se uma das principais ferramentas utilizadas pelo Instituto para promover inclusão, disciplina e desenvolvimento humano.",

    "Mas, para nós, o jiu-jitsu nunca foi apenas sobre aprender a lutar.",

    "Cada treino representa uma oportunidade de ensinar respeito, perseverança, autocontrole, responsabilidade e resiliência. No tatame, o aluno aprende a cair e levantar, a respeitar seus limites, a superar desafios e a compreender que grandes conquistas são construídas com dedicação e constância.",

    "É por isso que acreditamos no esporte como uma poderosa ferramenta de transformação social e como uma alternativa saudável ao caminho das drogas e da violência.",

    "Formando pessoas para a vida",

    "Nossa missão vai além da formação esportiva. Queremos contribuir para a formação de cidadãos conscientes, preparados para enfrentar desafios, respeitar o próximo e fazer boas escolhas.",

    "A metodologia do Instituto busca unir desenvolvimento técnico e físico aos aspectos emocionais, sociais e espirituais. Os alunos são incentivados a crescer dentro e fora do tatame, entendendo que cada conquista exige esforço, disciplina e perseverança.",

    "Tudo isso é construído sobre princípios cristãos que valorizam a fé, o amor ao próximo, a dignidade humana e o compromisso com a comunidade.",

    "Presença que alcança a comunidade",

    "Com sede em Blumenau, o Instituto Tribo de Davi ampliou sua atuação ao longo dos anos. Hoje atuamos em 5 polos: Eça de Queiroz, Itoupavazinha, Araranguá, Artex e Casa de Jairo.",

    "As atividades acompanham o calendário escolar e são mantidas durante todo o ano, proporcionando aos alunos continuidade no aprendizado, na convivência e no desenvolvimento.",

    "Mais do que oferecer aulas, buscamos construir ambientes seguros, acolhedores e capazes de gerar novas perspectivas para crianças, adolescentes e famílias.",

    "Esporte, fé e cidadania",

    "O trabalho do Instituto também se estende para além dos tatames. Atuamos no atendimento a pessoas em cumprimento de medidas socioeducativas, buscando contribuir para processos de mudança, reconstrução de vínculos e novas oportunidades.",

    "Também valorizamos a construção de parcerias com escolas, instituições de assistência social e organizações que atuam na prevenção e no combate às drogas. Acreditamos que a transformação de uma comunidade acontece quando pessoas e instituições se unem em torno de um propósito maior.",

    "Uma história construída por muitas vidas",

    "Desde sua fundação, centenas de alunos já passaram pelos tatames do Instituto Tribo de Davi. Cada um deles deixou uma história e levou consigo muito mais do que técnicas de jiu-jitsu.",

    "Levou aprendizados, amizades, disciplina, superação e experiências que acompanham uma pessoa por toda a vida.",

    "Por isso, cada troca de faixa representa muito mais do que uma conquista esportiva. É a celebração de uma etapa vencida, de um esforço recompensado e de uma pessoa que está aprendendo a acreditar em seu próprio potencial.",

    "Um propósito que continua",

    "Mais de uma década depois de sua fundação, o Instituto Tribo de Davi continua avançando com o mesmo propósito que deu origem à sua história: usar o esporte, a fé e a educação como instrumentos para transformar vidas e construir um futuro melhor.",

    "Seguimos acreditando que toda criança merece uma oportunidade, que todo jovem pode escolher um caminho diferente e que, quando uma comunidade se une para cuidar de suas pessoas, vidas podem ser transformadas.",

    "Instituto Tribo de Davi — esporte, fé e cidadania transformando vidas.",
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
      "Reunimos aqui as principais dúvidas sobre o Instituto, as aulas, a inscrição e o acompanhamento dos alunos. Toque em uma pergunta para saber mais.",

    categorias: [
      {
        titulo: "Sobre o projeto",
        perguntas: [
          {
            pergunta: "O que é o Instituto Tribo de Davi?",
            resposta:
              "O Instituto Tribo de Davi é um projeto social fundado em 2013, em Blumenau (SC), que utiliza o jiu-jitsu e o esporte como ferramentas de transformação social. Nosso trabalho é voltado para crianças, adolescentes e adultos, especialmente pessoas em situação de vulnerabilidade social, promovendo disciplina, respeito, cidadania e princípios cristãos.",
          },

          {
            pergunta: "O projeto é realmente gratuito?",
            resposta:
              "Sim. As aulas são 100% gratuitas e não há cobrança de mensalidade. Quando necessário, o Instituto também disponibiliza quimono e faixa por empréstimo, conforme a disponibilidade.",
          },

          {
            pergunta: "Quem pode participar?",
            resposta:
              "O projeto atende crianças a partir dos 5 anos, adolescentes e adultos. Cada polo possui suas próprias turmas e horários, de acordo com a faixa etária e a organização das aulas.",
            link: { label: "Fazer inscrição", para: "/matricula" },
          },

          {
            pergunta: "Em quais valores o projeto se baseia?",
            resposta:
              "Nosso trabalho é fundamentado em disciplina, respeito, responsabilidade, cidadania, empatia e princípios cristãos. Acreditamos no esporte como um caminho saudável de desenvolvimento e como uma alternativa ao combate às drogas, à violência e a outros caminhos que podem comprometer o futuro de nossos alunos.",
          },

          {
            pergunta: "Qual é a nossa missão?",
            resposta:
              "Nossa missão é transformar vidas por meio do esporte, da educação, da fé e da assistência social, oferecendo oportunidades para que crianças, adolescentes e adultos desenvolvam seu potencial e construam um futuro melhor.",
          },
        ],
      },

      {
        titulo: "Polos e endereços",
        perguntas: [
          {
            pergunta: "Quais são nossos endereços?",
            resposta:
              "O Instituto Tribo de Davi possui atividades em 5 polos de Blumenau. Os endereços, horários e informações de cada local podem ser consultados na página de polos.",
            link: { label: "Ver polos e horários", para: "/polos" },
          },

          {
            pergunta: "Posso escolher qualquer polo?",
            resposta: "Você deve escolher o polo mais próximo de sua casa.",
            link: { label: "Fazer inscrição", para: "/matricula" },
          },

          {
            pergunta: "Como falo com a equipe?",
            resposta:
              "Você pode entrar em contato pelo e-mail: institutotribodedavi@gmail.com -  ou procurar diretamente os professores nos horários de aula de cada polo. Teremos prazer em orientar você.",
          },
        ],
      },

      {
        titulo: "Inscrição e matrícula",
        perguntas: [
          {
            pergunta: "Como faço a minha inscrição?",
            resposta:
              "A inscrição é realizada 100% online, aqui pelo site. Seu cadastro passará por uma revisão e aprovação.",
            link: { label: "Fazer inscrição", para: "/matricula" },
          },

          {
            pergunta: "Preciso levar algum documento?",
            resposta:
              "Não é necessário anexar documentos digitalizados durante a inscrição. O formulário solicita os principais dados do aluno e, quando necessário, do responsável, como nome, RG, CPF, endereço e contatos.",
          },

          {
            pergunta: "Posso enviar uma foto do aluno?",
            resposta:
              "Sim. O envio da foto é opcional e ajuda na identificação do aluno e na organização dos cadastros. Recomendamos uma foto individual, apenas do rosto, em local bem iluminado. A equipe poderá solicitar uma nova foto caso a imagem não esteja adequada.",
            link: { label: "Fazer inscrição", para: "/matricula" },
          },

          {
            pergunta: "Já sou aluno; como faço a rematrícula?",
            resposta:
              "A rematrícula também pode ser feita pelo formulário online. Ao informar o CPF do responsável e a data de nascimento do aluno, o sistema pode localizar os dados já cadastrados, facilitando o preenchimento e evitando a necessidade de digitar tudo novamente.",
            link: { label: "Fazer rematrícula", para: "/matricula" },
          },

          {
            pergunta: "Tem turma para adultos?",
            resposta:
              "Sim. O Instituto também oferece atividades para adultos, conforme a disponibilidade de cada polo. Durante a inscrição, selecione o público 'Adulto' para acessar a ficha correspondente.",
            link: { label: "Inscrição de adulto", para: "/matricula" },
          },

          {
            pergunta:
              "Depois de fazer a inscrição, já posso começar a treinar?",
            resposta:
              "Após o preenchimento da inscrição, é necessário aguardar a confirmação da equipe responsável pelo polo. Assim que a matrícula for aprovada, você receberá as orientações para iniciar as aulas.",
          },
        ],
      },

      {
        titulo: "Aulas, uniforme e horários",
        perguntas: [
          {
            pergunta: "Preciso ter quimono para começar?",
            resposta:
              "Não. Você não precisa comprar um quimono para começar. O Instituto disponibiliza quimonos e faixas por empréstimo para quem precisar, conforme a disponibilidade. O mais importante é chegar com disposição para aprender e treinar.",
          },

          {
            pergunta: "Quais são os horários das aulas?",
            resposta:
              "Os horários variam de acordo com o polo, a faixa etária e a turma. Consulte a página de polos para encontrar o local mais próximo e verificar os horários disponíveis.",
            link: { label: "Ver polos e horários", para: "/polos" },
          },

          {
            pergunta: "O projeto para nas férias escolares?",
            resposta:
              "Não. Embora as atividades acompanhem o calendário escolar, o Instituto mantém as aulas durante todo o ano, sem pausa entre os semestres. Dessa forma, os alunos podem continuar treinando e evoluindo de forma contínua.",
          },

          {
            pergunta: "O que acontece se o aluno faltar?",
            resposta:
              "A frequência é registrada aula a aula. Quando percebemos que um aluno está faltando com frequência, buscamos entender o motivo e entramos em contato com a família. Nosso objetivo é acompanhar de perto cada aluno, ajudar quando houver alguma dificuldade e evitar que ele abandone o projeto.",
          },

          {
            pergunta: "O aluno precisa saber jiu-jitsu para participar?",
            resposta:
              "Não. Não é necessário ter experiência anterior. As aulas são conduzidas de acordo com o nível e a faixa de cada aluno, permitindo que iniciantes aprendam desde os fundamentos.",
          },

          {
            pergunta: "O jiu-jitsu é seguro para crianças?",
            resposta:
              "Sim. As atividades são orientadas por professores e adaptadas à faixa etária e ao nível de desenvolvimento dos alunos. O respeito, o controle dos movimentos e a segurança fazem parte dos ensinamentos do jiu-jitsu.",
          },
        ],
      },

      {
        titulo: "Graduação e faixas",
        perguntas: [
          {
            pergunta: "Como funciona a graduação?",
            resposta:
              "A graduação acompanha o desenvolvimento do aluno ao longo de sua trajetória no jiu-jitsu. No infantil, o sistema de faixas vai da branca à verde, com graus intermediários. A evolução considera aspectos como aprendizado técnico, frequência, dedicação, disciplina e comportamento.",
          },

          {
            pergunta: "Quando o aluno troca de faixa?",
            resposta:
              "As graduações acontecem em datas definidas pela equipe técnica. Não existe uma data automática para a troca de faixa, pois cada aluno possui seu próprio ritmo de evolução. A graduação representa o reconhecimento de uma caminhada construída com treino, dedicação e disciplina.",
          },

          {
            pergunta: "A frequência influencia na graduação?",
            resposta:
              "Sim. A frequência e o comprometimento com os treinos fazem parte do processo de avaliação. A graduação busca reconhecer não apenas o conhecimento técnico, mas também a dedicação, a disciplina e a evolução do aluno.",
          },
        ],
      },

      {
        titulo: "Acompanhar o aluno",
        perguntas: [
          {
            pergunta: "Como acompanho a frequência do meu filho?",
            resposta:
              "Pela Área do Responsável, você pode acompanhar as informações do aluno utilizando o código de acesso e a data de nascimento. Entre outras informações, é possível consultar a frequência, avisos e graduações.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },

          {
            pergunta: "Como justifico uma falta?",
            resposta:
              "Na Área do Responsável, você pode acessar a lista de presenças e justificar uma falta específica. A justificativa será encaminhada para análise da equipe responsável.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },

          {
            pergunta: "Como autorizo ou revogo o uso de imagem?",
            resposta:
              "A autorização para uso de imagem pode ser concedida ou retirada pelo responsável diretamente na Área do Responsável. Dessa forma, a família mantém maior controle sobre essa autorização.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },

          {
            pergunta: "Onde consigo o código de acesso?",
            resposta:
              "O código de acesso é fornecido ao final do processo de inscrição. Caso você não tenha anotado ou tenha perdido o código, procure o professor responsável pela turma para receber orientação.",
          },

          {
            pergunta: "Posso acompanhar mais de um filho?",
            resposta:
              "Sim. Quando houver mais de um aluno vinculado ao mesmo responsável, a Área do Responsável permite consultar as informações dos alunos cadastrados, conforme os vínculos registrados no Instituto.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },
        ],
      },

      {
        titulo: "Fotos, vídeos e eventos",
        perguntas: [
          {
            pergunta: "Onde vejo fotos das aulas e eventos?",
            resposta:
              "Na nossa Galeria você encontra registros de treinos, graduações, eventos e outros momentos especiais do Instituto. Também compartilhamos conteúdos em nosso Instagram oficial.",
            link: { label: "Ver galeria", para: "/galeria" },
          },

          {
            pergunta: "Vocês têm vídeos?",
            resposta:
              "Sim. A Galeria também reúne vídeos de atividades, eventos e momentos do projeto. Novos conteúdos são adicionados conforme as atividades acontecem.",
            link: { label: "Ver galeria", para: "/galeria" },
          },

          {
            pergunta: "Meu filho pode aparecer nas fotos e vídeos?",
            resposta:
              "Somente quando houver autorização de uso de imagem registrada. O responsável pode consultar, autorizar ou revogar essa autorização pela Área do Responsável.",
            link: { label: "Área do Responsável", para: "/responsavel" },
          },
        ],
      },

      {
        titulo: "Apoiar o projeto",
        perguntas: [
          {
            pergunta: "Como faço uma doação?",
            resposta:
              "Você pode contribuir com o Instituto por meio de uma doação via Pix. Cada contribuição ajuda a manter as atividades e ampliar as oportunidades oferecidas aos nossos alunos.",
            link: { label: "Doar por Pix", para: "/doar" },
          },

          {
            pergunta: "Para onde vão as doações?",
            resposta:
              "As doações ajudam na manutenção das atividades do Instituto, aquisição e manutenção de materiais, apoio aos polos e desenvolvimento dos projetos sociais. Trabalhamos para utilizar os recursos de forma responsável e transparente.",
            link: { label: "Ver transparência", para: "/transparencia" },
          },

          {
            pergunta: "Onde vejo a prestação de contas?",
            resposta:
              "Na página de Transparência, você encontra informações sobre o impacto do projeto, o resumo financeiro e os documentos disponibilizados pelo Instituto.",
            link: { label: "Ver transparência", para: "/transparencia" },
          },

          {
            pergunta: "Posso ajudar de outras formas?",
            resposta:
              "Sim. Existem muitas maneiras de fazer parte dessa missão. Doações de materiais, voluntariado, apoio profissional e parcerias com empresas e instituições também são importantes para que o projeto continue crescendo. Para saber como ajudar, entre em contato com nossa equipe pelo e-mail institutotribodedavi@gmail.com.",
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
