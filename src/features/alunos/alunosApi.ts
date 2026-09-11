import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Aluno } from "@/types";

export function useAlunos(admin: boolean) {
  return useQuery({
    queryKey: ["alunos", admin],
    queryFn: () =>
      apiGet<Aluno[]>(admin ? ApiRotas.alunosGetAll : ApiRotas.alunosPorPolo),
  });
}

// Envelope paginado da API (PagedResult<AlunoListaDTO>).
interface PaginaAlunos {
  itens: Aluno[];
  total: number;
  pagina: number;
  tamanho: number;
  totalPaginas: number;
}

// Busca TODOS os alunos na versão enxuta (sem CPF/RG/endereço), percorrendo as
// páginas do endpoint /lista. A tela de Alunos filtra/ordena no cliente como
// antes, mas agora sobre um payload muito menor e sem PII desnecessária.
async function buscarTodosLeves(): Promise<Aluno[]> {
  const tamanho = 200;
  const todos: Aluno[] = [];
  for (let pagina = 1; pagina <= 100; pagina++) {
    const res = await apiGet<PaginaAlunos>(ApiRotas.alunoLista(pagina, tamanho));
    const itens = res?.itens ?? [];
    todos.push(...itens);
    if (todos.length >= (res?.total ?? todos.length) || itens.length < tamanho)
      break;
  }
  return todos;
}

// Lista da tela de Alunos: admin usa o endpoint enxuto; professor/supervisor
// continua no get-por-polo (já restrito ao próprio polo).
export function useAlunosLista(admin: boolean) {
  return useQuery({
    queryKey: ["alunos", "lista", admin],
    queryFn: () =>
      admin ? buscarTodosLeves() : apiGet<Aluno[]>(ApiRotas.alunosPorPolo),
  });
}

// ── Alunos sem turma (pendentes) ───────────────────────────────────────────
// Importação de planilha cria o aluno com turma 0 quando a coluna vem vazia; o
// get-por-polo filtra turmas 1-3, então esses só aparecem aqui até alguém
// atribuir a turma. Admin vê todos os polos; professor/supervisor vê o seu.
export interface AlunoPendenteTurma {
  id: number;
  nome: string;
  dataNascimento: string;
  peso?: number | null;
  faixa: number;
  poloId: number;
  poloNome: string;
}

export function useAlunosSemTurma() {
  return useQuery({
    queryKey: ["alunos-sem-turma"],
    queryFn: () =>
      apiGet<AlunoPendenteTurma[] | null>(ApiRotas.alunosSemTurma).then(
        (r) => r ?? [],
      ),
    // O menu lateral consome isto o tempo todo; evita refazer a cada navegação.
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useAtribuirTurma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alunoId, turma }: { alunoId: number; turma: number }) =>
      apiPatch<Aluno>(ApiRotas.alunoAtribuirTurma, { alunoId, turma }),
    onSuccess: () => {
      // Sai da lista de pendentes e passa a aparecer na listagem normal.
      qc.invalidateQueries({ queryKey: ["alunos-sem-turma"] });
      qc.invalidateQueries({ queryKey: ["alunos"] });
    },
  });
}

// Ficha completa de um aluno (todos os campos) sob demanda — para o detalhe e o
// formulário de edição, já que a listagem agora é enxuta.
export function useAluno(id: number | null) {
  return useQuery({
    queryKey: ["aluno", id],
    queryFn: () => apiGet<Aluno>(ApiRotas.alunoGet(id!)),
    enabled: id != null,
  });
}

// A API não aceita campos nulos no AlunoDTO; normaliza antes de enviar
// (mesma lógica do AlunoService.MontarBody do portal Blazor).
function montarBody(aluno: Partial<Aluno>, id: number) {
  return {
    id,
    nome: aluno.nome ?? "",
    rg: aluno.rg ?? "",
    cpf: aluno.cpf ?? "",
    dataNascimento: aluno.dataNascimento || "2000-01-01",
    peso: aluno.peso ?? 0,
    altura: aluno.altura ?? null,
    faixa: aluno.faixa ?? 0,
    endereco: aluno.endereco ?? "",
    numero: aluno.numero ?? "",
    complemento: aluno.complemento ?? "",
    bairro: aluno.bairro ?? "",
    cidade: aluno.cidade ?? "",
    celular: aluno.celular ?? "",
    telefone2: aluno.telefone2 ?? "",
    responsavel: aluno.responsavel ?? "",
    parentesco: aluno.parentesco ?? 0,
    rgResponsavel: aluno.rgResponsavel ?? "",
    cpfResponsavel: aluno.cpfResponsavel ?? "",
    escola: aluno.escola ?? "",
    serie: aluno.serie ?? "",
    periodo: aluno.periodo ?? "",
    poloId: aluno.poloId ?? 0,
    turma: aluno.turma ?? 1,
    autorizaImagem: aluno.autorizaImagem ?? null,
  };
}

export function useSalvarAluno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (aluno: Partial<Aluno>) =>
      aluno.id
        ? apiPut(ApiRotas.alunoUpdate, montarBody(aluno, aluno.id))
        : apiPost(ApiRotas.alunoCreate, montarBody(aluno, 0)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      qc.invalidateQueries({ queryKey: ["aluno"] });
    },
  });
}

export function useExcluirAluno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.alunoDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alunos"] }),
  });
}

// ── LGPD ────────────────────────────────────────────────────────────────

// Pacote de dados devolvido pela exportação. Mantido genérico de propósito: é
// baixado como JSON para o responsável, não renderizado campo a campo.
export interface DadosPessoaisAluno {
  geradoEm: string;
  geradoPor: string;
  cadastro: Record<string, unknown>;
  matriculas: unknown[];
  graduacoes: unknown[];
  presencas: unknown[];
  inscricoes: unknown[];
}

// Acesso/portabilidade: baixa tudo que o sistema guarda sobre o aluno.
export function useExportarDadosAluno() {
  return useMutation({
    mutationFn: (id: number) =>
      apiGet<DadosPessoaisAluno>(ApiRotas.alunoExportarDados(id)),
  });
}

// Eliminação: apaga os dados pessoais mantendo o histórico anonimizado.
export function useAnonimizarAluno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiPost(ApiRotas.alunoAnonimizar(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alunos"] });
      qc.invalidateQueries({ queryKey: ["aluno"] });
    },
  });
}

// ── Código de acesso do responsável ───────────────────────────────────────

export function useCodigoResponsavel(id: number | null) {
  return useQuery({
    queryKey: ["codigo-responsavel", id],
    queryFn: () =>
      apiGet<{ codigo: string | null }>(ApiRotas.alunoCodigoResponsavel(id!)),
    enabled: id !== null,
  });
}

export function useGerarCodigoResponsavel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiPost<{ codigo: string }>(ApiRotas.alunoCodigoResponsavel(id)),
    onSuccess: (_data, id) =>
      qc.invalidateQueries({ queryKey: ["codigo-responsavel", id] }),
  });
}

export interface CodigoResponsavelItem {
  id: number;
  nome: string;
  responsavel: string;
  poloId: number;
  codigo: string;
}

// Impressão em lote: gera os códigos faltantes e devolve a lista completa.
export function usePrepararCodigosResponsavel() {
  return useMutation({
    mutationFn: () =>
      apiPost<CodigoResponsavelItem[]>(ApiRotas.alunosCodigosPreparar),
  });
}
