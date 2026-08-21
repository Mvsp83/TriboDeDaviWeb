import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface Graduacao {
  id: number;
  alunoId: number;
  poloId: number;
  faixaAnterior: number;
  faixaNova: number;
  data: string;
  observacao?: string | null;
  registradoPor?: string | null;
  nomeAluno?: string | null;
  poloNome?: string | null;
}

export function useGraduacoes(ano: number) {
  return useQuery({
    queryKey: ["graduacoes", ano],
    queryFn: () => apiGet<Graduacao[] | null>(ApiRotas.graduacoes(ano)).then((r) => r ?? []),
  });
}

// Histórico de um aluno — a trilha completa, da primeira faixa até a atual.
export function useGraduacoesDoAluno(alunoId: number | null) {
  return useQuery({
    queryKey: ["graduacoes-aluno", alunoId],
    enabled: alunoId != null,
    queryFn: () =>
      apiGet<Graduacao[] | null>(ApiRotas.graduacoesDoAluno(alunoId!)).then((r) => r ?? []),
  });
}

export interface LoteGraduacao {
  data: string;
  observacao: string;
  alunos: { alunoId: number; faixaNova: number }[];
}

export interface ResultadoGraduacao {
  graduados: number;
  ignorados: string[];
  mensagem: string;
}

export function useRegistrarGraduacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lote: LoteGraduacao) =>
      apiPost<ResultadoGraduacao>(ApiRotas.graduacaoRegistrar, {
        ...lote,
        data: `${lote.data}T00:00:00`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["graduacoes"] });
      qc.invalidateQueries({ queryKey: ["graduacoes-aluno"] });
      // A faixa do aluno muda junto com o registro.
      qc.invalidateQueries({ queryKey: ["alunos"] });
    },
  });
}

export function useExcluirGraduacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.graduacaoExcluir(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["graduacoes"] });
      qc.invalidateQueries({ queryKey: ["graduacoes-aluno"] });
      qc.invalidateQueries({ queryKey: ["alunos"] });
    },
  });
}
