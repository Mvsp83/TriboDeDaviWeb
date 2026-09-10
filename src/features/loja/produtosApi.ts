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

// ── Vitrine pública ──────────────────────────────────────────────────────────
// Formato do endpoint anônimo: sem estoque exato (só "disponivel"), sem
// "ativo"/"dataCriacao". Separado do Produto (admin) para não vazar estoque.
export interface VariacaoVitrine {
  id?: number;
  tamanho: string;
  cor: string;
  disponivel: boolean;
}

export interface ProdutoVitrine {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  fotoArquivoId?: string;
  temFoto: boolean;
  formasPagamento: string;
  informacoes: string;
  variacoes: VariacaoVitrine[];
}

// Configuração da loja (admin): número de WhatsApp + liga/desliga a compra.
export interface ConfiguracaoLoja {
  id?: number;
  compraWhatsappHabilitada: boolean;
  whatsappNumero: string;
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
// mini = true traz a miniatura (grade); use a cheia no detalhe/preview.
export const produtoFotoUrl = (id: number, mini = false) =>
  `${import.meta.env.VITE_API_BASE_URL || ""}${ApiRotas.produtoFoto(id)}${
    mini ? "?mini=true" : ""
  }`;

// Estoque total somando as variações.
export const estoqueTotal = (p: Produto) =>
  (p.variacoes ?? []).reduce((s, v) => s + (v.quantidade || 0), 0);

// ── Hooks públicos ───────────────────────────────────────────────────────────

export function useVitrine() {
  return useQuery({
    queryKey: ["vitrine"],
    queryFn: async (): Promise<ProdutoVitrine[]> => {
      const lista = await apiGet<ProdutoVitrine[] | null>(
        ApiRotas.produtoVitrine,
      );
      return lista ?? [];
    },
  });
}

// Config da loja — leitura pública (a vitrine usa para o botão de compra).
export function useConfigLoja() {
  return useQuery({
    queryKey: ["config-loja"],
    queryFn: () => apiGet<ConfiguracaoLoja>(ApiRotas.configLojaObter),
  });
}

// ── Hooks admin ──────────────────────────────────────────────────────────────

// Salva a config da loja (admin) e atualiza a leitura pública.
export function useSalvarConfigLoja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: ConfiguracaoLoja) =>
      apiPut<ConfiguracaoLoja>(ApiRotas.configLojaSalvar, c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config-loja"] }),
  });
}

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
