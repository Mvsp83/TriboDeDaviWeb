import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface VariacaoProduto {
  id?: number;
  produtoId?: number;
  tamanho: string;
  cor: string;
  quantidade: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  fotoArquivoId?: string;
  temFoto: boolean;
  formasPagamento: string;
  informacoes: string;
  ativo: boolean;
  dataCriacao: string;
  variacoes: VariacaoProduto[];
}

// Payload de cadastro/edição (id ausente = novo).
export interface SalvarProduto {
  id?: number;
  nome: string;
  descricao: string;
  preco: number;
  fotoArquivoId?: string;
  formasPagamento: string;
  informacoes: string;
  ativo: boolean;
  variacoes: VariacaoProduto[];
}

// URL pública da imagem do produto — vai direto no <img src> (endpoint anônimo).
export const produtoFotoUrl = (id: number) =>
  `${import.meta.env.VITE_API_BASE_URL || ""}${ApiRotas.produtoFoto(id)}`;

// Estoque total somando as variações.
export const estoqueTotal = (p: Produto) =>
  (p.variacoes ?? []).reduce((s, v) => s + (v.quantidade || 0), 0);

// ── Hooks públicos ───────────────────────────────────────────────────────────

export function useVitrine() {
  return useQuery({
    queryKey: ["vitrine"],
    queryFn: async (): Promise<Produto[]> => {
      const lista = await apiGet<Produto[] | null>(ApiRotas.produtoVitrine);
      return lista ?? [];
    },
  });
}

// ── Hooks admin ──────────────────────────────────────────────────────────────

export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: async (): Promise<Produto[]> => {
      const lista = await apiGet<Produto[] | null>(ApiRotas.produtos);
      return lista ?? [];
    },
  });
}

export function useSalvarProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: SalvarProduto) =>
      p.id
        ? apiPut<Produto>(ApiRotas.produtos, p)
        : apiPost<Produto>(ApiRotas.produtos, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["vitrine"] });
    },
  });
}

export function useExcluirProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDelete(ApiRotas.produto(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["vitrine"] });
    },
  });
}

// Sobe a foto do produto e devolve o id do arquivo, incluído no salvar.
export async function enviarFotoProduto(arquivo: Blob): Promise<string> {
  const form = new FormData();
  form.append("arquivo", arquivo, "produto.webp");
  const r = await apiPost<{ fotoArquivoId: string }>(
    ApiRotas.produtoFotoUpload,
    form,
  );
  return r.fotoArquivoId;
}
