import { ShoppingBag, CreditCard, Info, Package } from "lucide-react";
import { SITE } from "@/features/site/conteudoSite";
import { moeda } from "@/lib/format";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { Badge } from "@/components/ui/badge";
import { PaginaPublica } from "@/components/PaginaPublica";
import {
  useVitrine,
  produtoFotoUrl,
  estoqueTotal,
  type Produto,
} from "@/features/loja/produtosApi";

// Distintos e não-vazios, preservando a ordem de cadastro.
function distintos(valores: string[]) {
  return [...new Set(valores.map((v) => v?.trim()).filter(Boolean))];
}

function CartaoProduto({ produto }: { produto: Produto }) {
  const emEstoque = (produto.variacoes ?? []).filter((v) => v.quantidade > 0);
  const tamanhos = distintos(emEstoque.map((v) => v.tamanho));
  const cores = distintos(emEstoque.map((v) => v.cor));
  const esgotado = estoqueTotal(produto) === 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-square w-full bg-secondary/40">
        {produto.temFoto ? (
          <img
            src={produtoFotoUrl(produto.id)}
            alt={produto.nome}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <Package className="size-10" />
          </div>
        )}
        {esgotado && (
          <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Esgotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{produto.nome}</h3>
          <span className="shrink-0 font-semibold text-primary">
            {moeda(produto.preco)}
          </span>
        </div>

        {produto.descricao && (
          <p className="text-sm text-muted-foreground">{produto.descricao}</p>
        )}

        {tamanhos.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Tamanhos:</span>
            {tamanhos.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        )}
        {cores.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Cores:</span>
            {cores.map((c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ))}
          </div>
        )}

        {produto.formasPagamento && (
          <p className="mt-1 inline-flex items-start gap-1.5 text-xs text-muted-foreground">
            <CreditCard className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {produto.formasPagamento}
          </p>
        )}
        {produto.informacoes && (
          <p className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {produto.informacoes}
          </p>
        )}
      </div>
    </div>
  );
}

// Vitrine pública da loja: mostra os produtos ativos cadastrados pelo admin.
// É um mostruário — não há carrinho nem pagamento online.
export function LojaPage() {
  useDocumentTitle(`Loja — ${SITE.nome}`);
  const { data: produtos = [], isLoading } = useVitrine();

  return (
    <PaginaPublica larguraMax="max-w-5xl">
      <section className="mx-auto max-w-5xl px-4 pb-6 pt-4">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight md:text-4xl">
          <ShoppingBag className="size-7 text-primary" />
          Loja
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Camisetas, hashguards e outros produtos do Instituto. Cada compra
          ajuda a manter as aulas gratuitas.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Carregando…
          </p>
        ) : produtos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Em breve — os produtos aparecerão aqui assim que forem cadastrados.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {produtos.map((p) => (
              <CartaoProduto key={p.id} produto={p} />
            ))}
          </div>
        )}
      </section>
    </PaginaPublica>
  );
}
