import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export const StatusInscricao = {
  Pendente: 0,
  Aprovada: 1,
  Recusada: 2,
} as const;

export const STATUS_LABEL: Record<number, string> = {
  0: "Pendente",
  1: "Aprovada",
  2: "Recusada",
};

// Espelha o InscricaoDTO da API.
export interface Inscricao {
  id: number;
  ano: number;
  // 0 = criança/adolescente, 1 = adulto.
  publico?: number;
  poloId: number;
  poloNome?: string | null;
  turma?: number | null;
  jaEraAluno: boolean;
  turmaAnterior?: number | null;
  // Id da foto enviada na ficha (quando houver) — o revisor pode conferir.
  fotoArquivoId?: string | null;

  nome: string;
  dataNascimento: string;
  rg?: string | null;
  cpf?: string | null;
  peso?: number | null;
  altura?: number | null;
  faixa: number;
  escola?: string | null;
  serie?: string | null;
  periodo?: string | null;

  parentesco: number;
  parentescoOutro?: string | null;
  nomeResponsavel: string;
  rgResponsavel?: string | null;
  cpfResponsavel?: string | null;

  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  whatsApp: string;
  telefone2?: string | null;

  respostasSaudeJson?: string | null;
  respostasFamiliarJson?: string | null;
  temRestricaoMedica: boolean;
  medicamentos?: string | null;

  aceitouTermo: boolean;
  aceitouImagem: boolean;
  aceitouComodato: boolean;
  aceitouLgpd: boolean;
  nomeAssinatura: string;
  versaoTermos?: string | null;

  status: number;
  alunoId?: number | null;
  dataEnvio: string;
  dataRevisao?: string | null;
  revisadoPor?: string | null;
  observacaoRevisao?: string | null;
}

export function useFilaInscricoes(status: number | null, ano: number) {
  return useQuery({
    queryKey: ["inscricoes", status, ano],
    queryFn: () =>
      apiGet<Inscricao[] | null>(ApiRotas.inscricaoFila(status, ano)).then(
        (r) => r ?? [],
      ),
  });
}

// Contador para o aviso de "há inscrições esperando".
export function useInscricoesPendentes() {
  return useQuery({
    queryKey: ["inscricoes-pendentes"],
    queryFn: () => apiGet<number>(ApiRotas.inscricaoPendentes),
    staleTime: 2 * 60 * 1000,
  });
}

export interface Revisao {
  poloId: number;
  turma: number;
  observacao: string;
  // Quando true, a foto da ficha é descartada (não vai para o aluno).
  descartarFoto?: boolean;
}

// Foto da inscrição (data URI) para o revisor conferir. Só busca quando há foto.
export function useInscricaoFoto(id: number, temFoto: boolean) {
  return useQuery({
    queryKey: ["inscricao-foto", id],
    enabled: temFoto,
    staleTime: 5 * 60_000,
    queryFn: () =>
      apiGet<{ dataUri: string }>(ApiRotas.inscricaoFotoRevisao(id)).then(
        (r) => r.dataUri,
      ),
  });
}

export function useAprovarInscricao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, revisao }: { id: number; revisao: Revisao }) =>
      apiPost(ApiRotas.inscricaoAprovar(id), revisao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscricoes"] });
      qc.invalidateQueries({ queryKey: ["inscricoes-pendentes"] });
      // A aprovação cria ou atualiza um aluno.
      qc.invalidateQueries({ queryKey: ["alunos"] });
    },
  });
}

export interface MatriculaLoteResultado {
  criadas: number;
  jaMatriculados: number;
  totalAlunos: number;
}

// Virada de ano: matricula em lote os alunos ativos ainda sem matrícula no ano.
export function useMatricularAno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ano: number) =>
      apiPost<MatriculaLoteResultado>(ApiRotas.matricularAno(ano)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });
}

export function useRecusarInscricao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      apiPost(ApiRotas.inscricaoRecusar(id), { observacao: motivo, poloId: 0, turma: 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inscricoes"] });
      qc.invalidateQueries({ queryKey: ["inscricoes-pendentes"] });
    },
  });
}
