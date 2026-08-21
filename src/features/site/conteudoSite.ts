// Conteúdo do site público. Tudo o que muda com o tempo (contatos, polos,
// horários, números) fica aqui, num lugar só, para não precisar caçar texto
// dentro do componente.
//
// >>> OS CAMPOS MARCADOS COM "PREENCHER" ESTÃO VAZIOS DE PROPÓSITO. <<<
// Onde não sabemos a informação real, o site simplesmente não mostra a seção,
// em vez de exibir um dado inventado.

export interface Polo {
  nome: string;
  endereco?: string;
  horarios?: string;
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

  // PREENCHER: polos com endereço e horários reais.
  // Enquanto a lista estiver vazia, a seção não aparece no site.
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
