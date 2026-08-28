import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// Config global de onde a foto do aluno aparece.
export interface ConfigFotoAluno {
  mostrarNoCadastro: boolean;
  mostrarNaChamada: boolean;
  mostrarNoResponsavel: boolean;
  mostrarNaCarteirinha: boolean;
}

export function useConfigFotoAluno() {
  return useQuery({
    queryKey: ["config-foto-aluno"],
    staleTime: 10 * 60 * 1000,
    queryFn: () => apiGet<ConfigFotoAluno>(ApiRotas.alunoConfigFoto),
  });
}

export function useSalvarConfigFotoAluno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cfg: ConfigFotoAluno) => apiPut(ApiRotas.alunoConfigFoto, cfg),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config-foto-aluno"] }),
  });
}

// Foto do aluno em data URI (base64). Só busca quando `habilitado` (ex.: a tela
// está configurada para mostrar e o aluno tem foto).
export function useAlunoFoto(alunoId: number | null, habilitado = true) {
  return useQuery({
    queryKey: ["aluno-foto", alunoId],
    enabled: alunoId != null && habilitado,
    staleTime: 10 * 60 * 1000,
    queryFn: () =>
      apiGet<{ dataUri: string }>(ApiRotas.alunoFoto(alunoId!)).then((r) => r.dataUri),
  });
}

export function useSalvarAlunoFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alunoId, arquivo }: { alunoId: number; arquivo: Blob }) => {
      const form = new FormData();
      form.append("arquivo", arquivo, "aluno.webp");
      return apiPost(ApiRotas.alunoFoto(alunoId), form);
    },
    onSuccess: (_r, { alunoId }) => {
      qc.invalidateQueries({ queryKey: ["aluno-foto", alunoId] });
      qc.invalidateQueries({ queryKey: ["alunos"] });
    },
  });
}

export function useRemoverAlunoFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alunoId: number) => apiDelete(ApiRotas.alunoFoto(alunoId)),
    onSuccess: (_r, alunoId) => {
      qc.invalidateQueries({ queryKey: ["aluno-foto", alunoId] });
      qc.invalidateQueries({ queryKey: ["alunos"] });
    },
  });
}

// Upload público da foto na ficha de inscrição — devolve o id do arquivo, que
// o formulário inclui no envio da inscrição.
export async function enviarFotoInscricao(arquivo: Blob): Promise<string> {
  const form = new FormData();
  form.append("arquivo", arquivo, "inscricao.webp");
  const r = await apiPost<{ fotoArquivoId: string }>(ApiRotas.inscricaoFoto, form);
  return r.fotoArquivoId;
}
