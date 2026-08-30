import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface MatriculaAno {
  id: number;
  alunoId: number;
  ano: number;
  poloId: number;
  turma: number;
  ativa: boolean;
  alunoNome: string;
  poloNome: string;
}

// Matrículas de um ano (alunos do ano), com nome do aluno e do polo.
export function useMatriculasAno(ano: number) {
  return useQuery({
    queryKey: ["matriculas", ano],
    queryFn: async (): Promise<MatriculaAno[]> => {
      const lista = await apiGet<MatriculaAno[] | null>(
        ApiRotas.matriculasDoAno(ano),
      );
      return lista ?? [];
    },
  });
}

// Liga/desliga a matrícula: inativar libera vaga; reativar reocupa (respeita
// o limite do polo — o backend recusa se estiver lotado).
export function useAlterarAtivaMatricula() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ativa }: { id: number; ativa: boolean }) =>
      apiPost(ApiRotas.matriculaAtiva(id, ativa)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matriculas"] });
      qc.invalidateQueries({ queryKey: ["polos"] });
    },
  });
}
