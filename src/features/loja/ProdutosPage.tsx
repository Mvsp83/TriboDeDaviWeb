import { useState } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import {
  useProdutos,
  useExcluirProduto,
  produtoFotoUrl,
  estoqueTotal,
  type Produto,
} from "@/features/loja/produtosApi";
import { ProdutoFormDialog } from "@/features/loja/ProdutoFormDialog";
import { ApiError } from "@/lib/api";
import { moeda } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function ProdutosPage() {
  const { data: produtos, isLoading, isError } = useProdutos();
  const excluir = useExcluirProduto();

  const [dialogAberto, setDialogAberto] = useState(false);
  const [edicao, setEdicao] = useState<Produto | null>(null);
  const [excluirAlvo, setExcluirAlvo] = useState<Produto | null>(null);

  async function confirmarExclusao() {
    if (!excluirAlvo) return;
    try {
      await excluir.mutateAsync(excluirAlvo.id);
      toast.success("Produto excluído.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir.");
    } finally {
      setExcluirAlvo(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${produtos?.length ?? 0} produto(s)`}
        </p>
        <Button
          onClick={() => {
            setEdicao(null);
            setDialogAberto(true);
          }}
        >
          <Plus className="size-4" />
          Novo produto
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Erro ao carregar os produtos.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (produtos?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum produto cadastrado. Clique em “Novo produto” para começar.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(produtos ?? []).map((p) => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="flex gap-3 p-4">
              <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-secondary/40">
                {p.temFoto ? (
                  <img
                    src={produtoFotoUrl(p.id)}
                    alt={p.nome}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <Package className="size-6" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate font-semibold">{p.nome}</h3>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEdicao(p);
                        setDialogAberto(true);
                      }}
                      aria-label="Editar"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExcluirAlvo(p)}
                      aria-label="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm font-medium text-primary">
                  {moeda(p.preco)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {p.ativo ? (
                    <Badge variant="success">Na loja</Badge>
                  ) : (
                    <Badge variant="secondary">Oculto</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Estoque: {estoqueTotal(p)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProdutoFormDialog
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        produto={edicao}
      />

      <ConfirmDialog
        aberto={excluirAlvo !== null}
        onOpenChange={(o) => !o && setExcluirAlvo(null)}
        titulo="Excluir produto"
        descricao={
          <>
            Deseja excluir <strong>{excluirAlvo?.nome}</strong>? Esta ação não
            pode ser desfeita.
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
