import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// Payload do formulário público. `website` é honeypot (fica escondido; se um bot
// preencher, a API descarta a mensagem).
export interface EnvioContato {
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
  website?: string;
}

export interface MensagemContato {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  assunto: string;
  mensagem: string;
  dataCriacao: string;
  lida: boolean;
}

// Público: envia a mensagem (sem token).
export function useEnviarContato() {
  return useMutation({
    mutationFn: (dados: EnvioContato) => apiPost(ApiRotas.contatoEnviar, dados),
  });
}

// Admin: caixa de entrada.
export function useMensagensContato() {
  return useQuery({
    queryKey: ["contato"],
    queryFn: async (): Promise<MensagemContato[]> => {
      const lista = await apiGet<MensagemContato[] | null>(ApiRotas.contatoListar);
      return lista ?? [];
    },
  });
}

export function useContatoNaoLidas(enabled = true) {
  return useQuery({
    queryKey: ["contato-nao-lidas"],
    queryFn: async (): Promise<number> => {
      const r = await apiGet<{ total: number } | null>(ApiRotas.contatoNaoLidas);
      return r?.total ?? 0;
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useMarcarLidaContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiPut(ApiRotas.contatoMarcarLida(id), {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contato"] });
      qc.invalidateQueries({ queryKey: ["contato-nao-lidas"] });
    },
  });
}

export function useExcluirContato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.contatoExcluir(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contato"] });
      qc.invalidateQueries({ queryKey: ["contato-nao-lidas"] });
    },
  });
}
