import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export interface Doador {
  id: number;
  tipoPessoa: number; // 0 = física, 1 = jurídica
  nome: string;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  totalDoado: number;
  quantidadeDoacoes: number;
  ultimaDoacao?: string | null;
}

export interface Doacao {
  id: number;
  doadorId?: number | null;
  valor: number;
  data: string;
  forma: string;
  finalidade?: string | null;
  observacoes?: string | null;
  reciboDocumentoId?: number | null;
  reciboNumero?: string | null;
  registradoPor?: string | null;
  nomeDoador?: string | null;
}

export interface ResumoDoacoes {
  ano: number;
  total: number;
  quantidade: number;
  doadores: number;
  ticketMedio: number;
}

export const FORMAS = ["Pix", "Dinheiro", "Transferencia", "Outro"] as const;

export const FORMA_LABEL: Record<string, string> = {
  Pix: "Pix",
  Dinheiro: "Dinheiro",
  Transferencia: "Transferência",
  Outro: "Outro",
};

export function useDoadores() {
  return useQuery({
    queryKey: ["doadores"],
    queryFn: () => apiGet<Doador[] | null>(ApiRotas.doadores).then((r) => r ?? []),
  });
}

export function useDoacoes(ano: number) {
  return useQuery({
    queryKey: ["doacoes", ano],
    queryFn: () => apiGet<Doacao[] | null>(ApiRotas.doacoes(ano)).then((r) => r ?? []),
  });
}

export function useResumoDoacoes(ano: number) {
  return useQuery({
    queryKey: ["doacoes-resumo", ano],
    queryFn: () => apiGet<ResumoDoacoes>(ApiRotas.doacoesResumo(ano)),
  });
}

// Invalida tudo o que depende de doações — os totais por doador mudam junto.
function invalidarTudo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["doacoes"] });
  qc.invalidateQueries({ queryKey: ["doadores"] });
  qc.invalidateQueries({ queryKey: ["doacoes-resumo"] });
}

export function useSalvarDoador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Doador>) =>
      apiPost<Doador>(ApiRotas.doadorSalvar, { ...d, id: d.id ?? 0 }),
    onSuccess: () => invalidarTudo(qc),
  });
}

export function useExcluirDoador() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.doadorExcluir(id)),
    onSuccess: () => invalidarTudo(qc),
  });
}

export function useSalvarDoacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Doacao> & { data: string }) =>
      apiPost<Doacao>(ApiRotas.doacaoSalvar, {
        ...d,
        id: d.id ?? 0,
        data: `${d.data.slice(0, 10)}T00:00:00`,
      }),
    onSuccess: () => invalidarTudo(qc),
  });
}

export function useExcluirDoacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.doacaoExcluir(id)),
    onSuccess: () => invalidarTudo(qc),
  });
}

export function useEmitirRecibo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiPost<Doacao>(ApiRotas.doacaoRecibo(id)),
    onSuccess: () => invalidarTudo(qc),
  });
}
