import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PackageMinus } from "lucide-react";
import {
  useSalvarProduto,
  type Produto,
  type SalvarProduto,
} from "@/features/loja/produtosApi";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  produto: Produto | null;
}

const rotuloVariacao = (tamanho: string, cor: string) =>
  [tamanho, cor].map((s) => s?.trim()).filter(Boolean).join(" · ") || "Padrão";

// Registrar venda / dar baixa: reduz o estoque das variações vendidas e salva o
// produto pelo endpoint que já existe (nada muda na API). A compra em si segue
// pelo WhatsApp; isto é o controle manual do estoque num clique.
export function DarBaixaDialog({ aberto, onOpenChange, produto }: Props) {
  const salvar = useSalvarProduto();
  const variacoes = useMemo(() => produto?.variacoes ?? [], [produto]);
  const [vendidos, setVendidos] = useState<number[]>([]);

  useEffect(() => {
    if (aberto) setVendidos(variacoes.map(() => 0));
  }, [aberto, variacoes]);

  const totalVendido = vendidos.reduce((s, n) => s + (n || 0), 0);

  function setVendido(i: number, valor: string, max: number) {
    const n = Math.max(0, Math.min(max, Math.floor(Number(valor) || 0)));
    setVendidos((atual) => atual.map((v, idx) => (idx === i ? n : v)));
  }

  async function onConfirmar() {
    if (!produto) return;
    if (totalVendido <= 0) {
      toast.warning("Informe quantas unidades foram vendidas.");
      return;
    }
    const payload: SalvarProduto = {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      preco: produto.preco,
      fotoArquivoId: produto.fotoArquivoId,
      formasPagamento: produto.formasPagamento,
      informacoes: produto.informacoes,
      ativo: produto.ativo,
      variacoes: variacoes.map((v, i) => ({
        ...v,
        quantidade: Math.max(0, (v.quantidade || 0) - (vendidos[i] || 0)),
      })),
    };
    try {
      await salvar.mutateAsync(payload);
      toast.success("Baixa registrada — estoque atualizado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar o estoque.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar venda / dar baixa</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {produto && (
            <p className="text-sm text-muted-foreground">
              {produto.nome} — informe quantas unidades saíram de cada variação.
            </p>
          )}

          {variacoes.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Este produto não tem variações com estoque para dar baixa.
            </p>
          )}

          {variacoes.map((v, i) => {
            const restante = Math.max(0, (v.quantidade || 0) - (vendidos[i] || 0));
            return (
              <div
                key={v.id ?? i}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {rotuloVariacao(v.tamanho, v.cor)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Estoque: {v.quantidade || 0}
                    {(vendidos[i] || 0) > 0 && (
                      <span className="text-foreground"> → {restante}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Vendidas</span>
                  <Input
                    type="number"
                    min={0}
                    max={v.quantidade || 0}
                    value={vendidos[i] ?? 0}
                    onChange={(e) => setVendido(i, e.target.value, v.quantidade || 0)}
                    disabled={(v.quantidade || 0) === 0}
                    className="w-20"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={salvar.isPending || totalVendido <= 0}>
            {salvar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PackageMinus className="size-4" />
            )}
            Dar baixa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
