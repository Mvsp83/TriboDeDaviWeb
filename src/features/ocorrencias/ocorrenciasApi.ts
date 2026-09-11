import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface Ocorrencia {
  id: number;
  alunoId: number;
  tipo: number; // 0 = advertência, 1 = recado
  status: number; // só no recado
  texto: string;
  data: string;
  registradoPor: string;
}

export function useOcorrenciasAluno(alunoId: number | null) {
  return useQuery({
    queryKey: ["ocorrencias", alunoId],
    queryFn: () => apiGet<Ocorrencia[] | null>(ApiRotas.ocorrenciasPorAluno(alunoId!)).then((r) => r ?? []),
    enabled: alunoId != null,
  });
}

export interface NovaOcorrencia {
  alunoId: number;
  tipo: number;
  status: number;
  texto: string;
}

export function useCriarOcorrencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: NovaOcorrencia) => apiPost<Ocorrencia>(ApiRotas.ocorrenciaCriar, dados),
    onSuccess: (_r, dados) => {
      qc.invalidateQueries({ queryKey: ["ocorrencias", dados.alunoId] });
      // Uma advertência muda a contagem que decide o "apto ao exame" — força o
      // recálculo da aptidão (senão o selo fica com o número antigo até o cache
      // vencer). Recado não conta, mas invalidar é barato e mantém tudo em sincronia.
      qc.invalidateQueries({ queryKey: ["graduacao-aptidao"] });
    },
  });
}

export function useExcluirOcorrencia(alunoId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.ocorrenciaExcluir(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ocorrencias", alunoId] });
      // Excluir uma advertência pode tornar o aluno apto de novo — recalcula.
      qc.invalidateQueries({ queryKey: ["graduacao-aptidao"] });
    },
  });
}
