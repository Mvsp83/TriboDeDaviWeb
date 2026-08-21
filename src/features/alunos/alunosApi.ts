import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import type { Aluno } from "@/types";

export function useAlunos(admin: boolean) {
  return useQuery({
    queryKey: ["alunos", admin],
    queryFn: () =>
      apiGet<Aluno[]>(admin ? ApiRotas.alunosGetAll : ApiRotas.alunosPorPolo),
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
  };
}

export function useSalvarAluno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (aluno: Partial<Aluno>) =>
      aluno.id
        ? apiPut(ApiRotas.alunoUpdate, montarBody(aluno, aluno.id))
        : apiPost(ApiRotas.alunoCreate, montarBody(aluno, 0)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alunos"] }),
  });
}

export function useExcluirAluno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.alunoDelete(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alunos"] }),
  });
}
