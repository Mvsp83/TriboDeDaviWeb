// Rotas da API usadas pelo portal. Os endpoints "get-all" exigem papel
// Administrador; os "get-por-polo" retornam apenas os dados do polo do
// usuário autenticado e aceitam qualquer papel.
const TODAS_TURMAS = "turmas=1&turmas=2&turmas=3";

export const ApiRotas = {
  login: "/api/v1/auth/login",
  refresh: "/api/v1/auth/refresh",
  logout: "/api/v1/auth/logout",

  // 2FA (TOTP) do próprio usuário autenticado.
  doisFatoresStatus: "/api/Usuario/2fa/status",
  doisFatoresIniciar: "/api/Usuario/2fa/iniciar",
  doisFatoresConfirmar: "/api/Usuario/2fa/confirmar",
  doisFatoresDesativar: "/api/Usuario/2fa/desativar",
  usuarioRevogarSessoes: (id: number) => `/api/Usuario/${id}/revogar-sessoes`,

  alunosGetAll: "/api/Aluno/get-all",
  alunosPorPolo: `/api/Aluno/get-por-polo?${TODAS_TURMAS}`,
  alunoCreate: "/api/Aluno/create",
  alunoUpdate: "/api/Aluno/update",
  alunoDelete: (id: number) => `/api/Aluno/delete/${id}`,
  // LGPD (art. 18) — só Administrador.
  alunoExportarDados: (id: number) => `/api/Aluno/${id}/exportar-dados`,
  alunoAnonimizar: (id: number) => `/api/Aluno/${id}/anonimizar`,
  alunosCandidatosRetencao: (mesesInativo: number) =>
    `/api/Aluno/candidatos-retencao?mesesInativo=${mesesInativo}`,

  // Código de acesso do responsável (admin gera/consulta).
  alunoCodigoResponsavel: (id: number) => `/api/Aluno/${id}/codigo-responsavel`,

  // Portal do responsável (público).
  responsavelAcesso: "/api/Responsavel/acesso",
  responsavelPainel: "/api/Responsavel/painel",

  aulasGetAll: "/api/Aula/get-all",
  aulasPorPolo: `/api/Aula/get-por-polo?${TODAS_TURMAS}`,
  aulaCreate: "/api/Aula/create",

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

  dashboardConfigObter: "/api/ConfiguracaoDashboard/obter",
  dashboardConfigSalvar: "/api/ConfiguracaoDashboard/salvar",

  finContas: "/api/Financeiro/contas",
  finContaSalvar: "/api/Financeiro/contas/salvar",
  finContaExcluir: (id: number) => `/api/Financeiro/contas/${id}`,
  finMovimentacoes: "/api/Financeiro/movimentacoes",
  finMovSalvar: "/api/Financeiro/movimentacoes/salvar",
  finMovExcluir: (id: number) => `/api/Financeiro/movimentacoes/${id}`,
  finMovConciliacao: (id: number, conciliado: boolean) =>
    `/api/Financeiro/movimentacoes/${id}/conciliacao?conciliado=${conciliado}`,
  finTransferencia: "/api/Financeiro/transferencias",
  finImportar: "/api/Financeiro/importar",

  // Inscrição: os dois primeiros são públicos (site, sem login).
  inscricaoPolos: "/api/Inscricao/polos",
  inscricaoEnviar: "/api/Inscricao/enviar",
  inscricaoFila: (status: number | null, ano: number) =>
    `/api/Inscricao/fila?ano=${ano}${status != null ? `&status=${status}` : ""}`,
  inscricaoPendentes: "/api/Inscricao/pendentes/total",
  inscricaoObter: (id: number) => `/api/Inscricao/${id}`,
  inscricaoAprovar: (id: number) => `/api/Inscricao/${id}/aprovar`,
  inscricaoRecusar: (id: number) => `/api/Inscricao/${id}/recusar`,
  matriculasDoAno: (ano: number) => `/api/Inscricao/matriculas/${ano}`,

  graduacoes: (ano: number) => `/api/Graduacao?ano=${ano}`,
  graduacoesDoAluno: (alunoId: number) => `/api/Graduacao/aluno/${alunoId}`,
  graduacaoRegistrar: "/api/Graduacao/registrar",
  graduacaoExcluir: (id: number) => `/api/Graduacao/${id}`,

  doadores: "/api/Doacao/doadores",
  doadorSalvar: "/api/Doacao/doadores/salvar",
  doadorExcluir: (id: number) => `/api/Doacao/doadores/${id}`,
  doacoes: (ano: number) => `/api/Doacao?ano=${ano}`,
  doacoesResumo: (ano: number) => `/api/Doacao/resumo/${ano}`,
  doacaoSalvar: "/api/Doacao/salvar",
  doacaoExcluir: (id: number) => `/api/Doacao/${id}`,
  doacaoRecibo: (id: number) => `/api/Doacao/${id}/recibo`,

  auditoria: (entidade: string, usuario: string, limite: number) =>
    `/api/LogAuditoria?entidade=${encodeURIComponent(entidade)}&usuario=${encodeURIComponent(usuario)}&limite=${limite}`,

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

  avisosPendentes: "/api/Aviso/pendentes",
  avisoCiente: (id: number) => `/api/Aviso/ciente/${id}`,
  avisosGetAll: "/api/Aviso/get-all",
  avisoCreate: "/api/Aviso/create",
  avisoDelete: (id: number) => `/api/Aviso/delete/${id}`,

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
