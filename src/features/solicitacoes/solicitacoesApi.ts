import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface MensagemSolicitacao {
  id: number;
  solicitacaoInternaId: number;
  autorLogin: string;
  autorRole: number;
  texto: string;
  dataEnvio: string;
}

export interface Solicitacao {
  id: number;
  assunto: string;
  categoria: number;
  status: number;
  poloId: number | null;
  poloNome: string;
  criadoPorLogin: string;
  criadoPorRole: number;
  destinatarioLogin: string | null;
  dataCriacao: string;
  dataAtualizacao: string;
  ativo: boolean;
  mensagens: MensagemSolicitacao[];
}

export interface NovaSolicitacao {
  assunto: string;
  categoria: number;
  texto: string;
  // Só o admin preenche (mira um professor de um polo). Professor deixa vazio.
  destinatarioLogin?: string;
  poloId?: number | null;
  poloNome?: string;
}

// ── Rótulos (espelham os enums do backend) ───────────────────────────────────

export const CATEGORIA_LABEL: Record<number, string> = {
  0: "Material",
  1: "Estrutura",
  2: "Financeiro",
  3: "Pedagógico",
  4: "Outro",
};

export const STATUS_LABEL: Record<number, string> = {
  0: "Aberta",
  1: "Em andamento",
  2: "Resolvida",
};

export const STATUS = { Aberta: 0, EmAndamento: 1, Resolvida: 2 } as const;

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useSolicitacoes() {
  return useQuery({
    queryKey: ["solicitacoes"],
    queryFn: async (): Promise<Solicitacao[]> => {
      const lista = await apiGet<Solicitacao[] | null>(ApiRotas.solicitacoes);
      return lista ?? [];
    },
  });
}

export function useSolicitacao(id: number | null) {
  return useQuery({
    queryKey: ["solicitacoes", id],
    enabled: id != null,
    queryFn: () => apiGet<Solicitacao>(ApiRotas.solicitacao(id as number)),
  });
}

// Contador de não-resolvidas, para o badge do menu.
export function useContadorSolicitacoes(habilitado = true) {
  return useQuery({
    queryKey: ["solicitacoes", "contador"],
    enabled: habilitado,
    staleTime: 30_000,
    queryFn: async (): Promise<number> => {
      const r = await apiGet<{ naoResolvidas: number }>(
        ApiRotas.solicitacaoContador,
      );
      return r?.naoResolvidas ?? 0;
    },
  });
}

export function useCriarSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nova: NovaSolicitacao) =>
      apiPost<Solicitacao>(ApiRotas.solicitacoes, nova),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["solicitacoes"] }),
  });
}

export function useResponderSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, texto }: { id: number; texto: string }) =>
      apiPost<Solicitacao>(ApiRotas.solicitacaoResponder(id), { texto }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["solicitacoes"] }),
  });
}

export function useAlterarStatusSolicitacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) =>
      apiPost<Solicitacao>(ApiRotas.solicitacaoStatus(id), { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["solicitacoes"] }),
  });
}
