// Textos dos termos aceitos na inscrição, transcritos da ficha em uso.
// A versão fica em questionarios.ts (VERSAO_TERMOS) e é gravada junto com o
// aceite: assim é possível saber, depois, exatamente qual texto foi aceito.
//
// Ao alterar qualquer texto aqui, INCREMENTE a versão — senão os aceites
// antigos passam a apontar para um texto que não é o que a família leu.

export const INSTITUTO = {
  razaoSocial: "Instituto Tribo de Davi",
  cnpj: "11.407.173/0001-45",
  endereco:
    "Rua Benjamin Constant, 2323 - Apto 133 - Vila Nova, Blumenau - SC, 89035-100",
  presidente: "VALDECI DA SILVA",
};

export const TERMO_PARTICIPACAO = `O ${INSTITUTO.razaoSocial}, Organização de direito privado, com CNPJ nº ${INSTITUTO.cnpj}, endereço a ${INSTITUTO.endereco}, neste ato representado por seu presidente, ${INSTITUTO.presidente}, vem através deste instrumento requerer a autorização dos responsáveis pelo menor retro descrito para que este participe do projeto social "PROJETO JIU JITSU – TRIBO DE DAVI", o qual se regerá da seguinte forma:

Este projeto é destinado a crianças e adolescentes, portanto para participar do projeto o responsável pelo menor deverá preencher o termo, responsabilizando-se pelas informações ali contidas;

O Instituto não se responsabiliza sobre qualquer ocorrência de ordem acidental durante o período da aula, dentro ou fora da área de treino;

Para participar do projeto social, o menor deve estar devidamente matriculado na escola, bem como deve apresentar o boletim de notas bimestralmente.`;

export const TERMO_COMODATO = `No decorrer das aulas serão emprestados, em comodato, os direitos de uso dos uniformes (KIMONO e FAIXA). Os uniformes transferidos tem como objetivo auxiliar os alunos na participação das aulas e atividades nas dependências do ${INSTITUTO.razaoSocial} ou Instituições parceiras. Sendo vedado seu uso fora das dependências anteriormente citadas.

Ao término do ano ou havendo o desligamento do projeto, os uniformes DEVERÃO ser devolvidos. A NÃO devolução acarretará em cobrança do valor de R$ 200,00 (duzentos reais).`;

export const TERMO_IMAGEM = `AUTORIZO o uso de minha imagem e voz e do menor na qual sou responsável, em todo e qualquer material entre fotos, vídeos e documentos, para ser utilizada em campanhas promocionais e institucionais, sejam essas destinadas à divulgação ao público em geral. A presente autorização é concedida a título gratuito, abrangendo o uso da imagem e voz acima mencionada em todo território nacional e no exterior, das seguintes formas: out-door; busdoor; folhetos em geral (encartes, mala direta, catálogo, etc.); folder de apresentação; anúncios em revistas e jornais em geral; home page, facebook, instagram e outros do gênero; cartazes; back-light; mídia eletrônica (painéis, vídeo-tapes, televisão, cinema, programa para rádio, entre outros).

Por esta ser a expressão da minha vontade declaro que autorizo o uso acima descrito sem que nada haja a ser reclamado a título de direitos conexos à minha imagem e voz ou a qualquer outro.`;

// Consentimento de tratamento de dados (LGPD). Os dados de saúde do
// questionário são "dados sensíveis" (art. 11), por isso o consentimento é
// específico e destacado, e não embutido nos outros termos.
export const TERMO_LGPD = `Autorizo o ${INSTITUTO.razaoSocial} a tratar os dados pessoais informados nesta ficha — inclusive os dados de saúde do menor, considerados sensíveis pela Lei nº 13.709/2018 (LGPD) — com a finalidade exclusiva de: efetivar a matrícula, acompanhar a frequência e o desenvolvimento do aluno, comunicar-se com o responsável e prestar contas do projeto social.

Os dados serão mantidos enquanto durar a participação no projeto e pelo prazo legal exigido após o encerramento, não sendo compartilhados com terceiros para finalidade comercial. O responsável pode, a qualquer momento, solicitar acesso, correção ou exclusão dos dados junto à administração do instituto.`;

export const PRAZO_FILIACAO = (ano: number) =>
  `A filiação terá a duração até 31 de dezembro de ${ano}.`;
