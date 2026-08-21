// Rotas da API usadas pelo portal. Os endpoints "get-all" exigem papel
// Administrador; os "get-por-polo" retornam apenas os dados do polo do
// usuário autenticado e aceitam qualquer papel.
const TODAS_TURMAS = "turmas=1&turmas=2&turmas=3";

export const ApiRotas = {
  login: "/api/v1/auth/login",

  alunosGetAll: "/api/Aluno/get-all",
  alunosPorPolo: `/api/Aluno/get-por-polo?${TODAS_TURMAS}`,
  alunoCreate: "/api/Aluno/create",
  alunoUpdate: "/api/Aluno/update",
  alunoDelete: (id: number) => `/api/Aluno/delete/${id}`,

  aulasGetAll: "/api/Aula/get-all",
  aulasPorPolo: `/api/Aula/get-por-polo?${TODAS_TURMAS}`,

  presencasGetAll: "/api/Presenca/get-all",
  presencaPorAula: (aulaId: number) => `/api/Presenca/aula/${aulaId}`,
  // Chamada: grava o lote inteiro de uma aula (trava a aula) e ajusta um
  // registro já salvo. Ambos exigem papel Professor ou superior na API.
  presencaBatchCreate: "/api/Presenca/batch/create",
  presencaUpdate: "/api/Presenca/update",

  polos: "/api/Polo/get-por-polo",
  poloCreate: "/api/Polo/create",
  poloUpdate: "/api/Polo/update",
  poloDelete: (id: number) => `/api/Polo/delete/${id}`,

  usuariosGetAll: "/api/Usuario/get-all",
  usuarioCreate: "/api/Usuario/create",
  usuarioUpdate: "/api/Usuario/update",
  usuarioDelete: (id: number) => `/api/Usuario/delete/${id}`,
  meuAvatar: "/api/Usuario/meu-avatar",

  aniversariantes: (mes: number) => `/api/Aniversariante/aniversariantes/${mes}`,

  atividadesGetAll: "/api/Atividade/get-all",
  atividadeCreate: "/api/Atividade/create",
  atividadeUpdate: "/api/Atividade/update",
  atividadeDelete: (id: number) => `/api/Atividade/delete/${id}`,
  atividadeHistoricoTurma: (poloId: number, turma: number) =>
    `/api/Atividade/historico-turma?poloId=${poloId}&turma=${turma}`,

  planosGetAll: "/api/PlanoDeAula/get-all",
  planosPorPolo: `/api/PlanoDeAula/get-por-polo?${TODAS_TURMAS}`,
  planoGet: (id: number) => `/api/PlanoDeAula/get/${id}`,
  planoCreate: "/api/PlanoDeAula/create",
  planoUpdate: "/api/PlanoDeAula/update",
  planoDelete: (id: number) => `/api/PlanoDeAula/delete/${id}`,
  planoClonar: (id: number) => `/api/PlanoDeAula/clonar/${id}`,
  planoCriarDeModelo: (modeloId: number) =>
    `/api/PlanoDeAula/criar-de-modelo/${modeloId}`,

  modelosGetAll: "/api/ModeloDeAula/get-all",
  modeloGet: (id: number) => `/api/ModeloDeAula/get/${id}`,
  modeloCreate: "/api/ModeloDeAula/create",
  modeloUpdate: "/api/ModeloDeAula/update",
  modeloDelete: (id: number) => `/api/ModeloDeAula/delete/${id}`,

  sincronizacaoHistorico: (q = 50) =>
    `/api/Sincronizacao/historico?quantidade=${q}`,
  sincronizacaoHistoricoPorPolo: (poloId: number, q = 20) =>
    `/api/Sincronizacao/historico/polo/${poloId}?quantidade=${q}`,
  sincronizacaoUltima: "/api/Sincronizacao/historico/ultima-execucao",
  sincronizarTudo: "/api/Sincronizacao/sincronizar-tudo",
  sincronizarPolo: (poloId: number) =>
    `/api/Sincronizacao/sincronizar-polo/${poloId}`,

  configDocumentoObter: "/api/ConfiguracaoDocumento/obter",
  configDocumentoSalvar: "/api/ConfiguracaoDocumento/salvar",

  calendarioPorAno: (ano: number) => `/api/EventoCalendario/ano/${ano}`,
  calendarioAnos: "/api/EventoCalendario/anos",
  calendarioCreate: "/api/EventoCalendario/create",
  calendarioUpdate: "/api/EventoCalendario/update",
  calendarioDelete: (id: number) => `/api/EventoCalendario/delete/${id}`,
  calendarioCopiar: (origem: number, destino: number) =>
    `/api/EventoCalendario/copiar/${origem}/${destino}`,

  docOficialPorAno: (ano: number) => `/api/DocumentoOficial/ano/${ano}`,
  docOficialAnos: "/api/DocumentoOficial/anos",
  docOficialGet: (id: number) => `/api/DocumentoOficial/get/${id}`,
  docOficialCreate: "/api/DocumentoOficial/create",
  docOficialUpdate: "/api/DocumentoOficial/update",
  docOficialDelete: (id: number) => `/api/DocumentoOficial/delete/${id}`,
  docOficialAprovar: (id: number) => `/api/DocumentoOficial/aprovar/${id}`,

  patrimonioGetAll: "/api/BemPatrimonial/get-all",
  patrimonioGet: (id: number) => `/api/BemPatrimonial/get/${id}`,
  patrimonioCreate: "/api/BemPatrimonial/create",
  patrimonioUpdate: "/api/BemPatrimonial/update",
  patrimonioDelete: (id: number) => `/api/BemPatrimonial/delete/${id}`,

  relatoriosMeus: "/api/RelatorioSalvo/get-meus",
  relatorioCreate: "/api/RelatorioSalvo/create",
  relatorioDelete: (id: number) => `/api/RelatorioSalvo/delete/${id}`,

  // Documentos contábeis (Drive) — categoria = nome do enum (Dre/Balanco/RelatorioAtividades)
  documentoContabilListar: (categoria: string) =>
    `/api/DocumentoContabil/listar/${categoria}`,
  documentoContabilUpload: (categoria: string) =>
    `/api/DocumentoContabil/upload/${categoria}`,
  documentoContabilDownload: (fileId: string) =>
    `/api/DocumentoContabil/download/${fileId}`,
  documentoContabilExcluir: (fileId: string) =>
    `/api/DocumentoContabil/excluir/${fileId}`,
} as const;
