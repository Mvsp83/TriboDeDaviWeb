import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Camera, Plus, Trash2 } from "lucide-react";
import { comprimirImagem } from "@/features/fotosTreino/fotosTreinoApi";
import { ApiError } from "@/lib/api";
import {
  enviarFotoProduto,
  produtoFotoUrl,
  useSalvarProduto,
  type Produto,
  type VariacaoProduto,
} from "@/features/loja/produtosApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const VARIACAO_NOVA: VariacaoProduto = { tamanho: "", cor: "", quantidade: 0 };

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  produto: Produto | null;
}

export function ProdutoFormDialog({ aberto, onOpenChange, produto }: Props) {
  const salvar = useSalvarProduto();
  const editando = produto !== null;

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [formasPagamento, setFormasPagamento] = useState("");
  const [informacoes, setInformacoes] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [variacoes, setVariacoes] = useState<VariacaoProduto[]>([]);

  const fotoRef = useRef<HTMLInputElement>(null);
  const [fotoArquivoId, setFotoArquivoId] = useState<string | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setNome(produto?.nome ?? "");
    setPreco(produto ? String(produto.preco) : "");
    setDescricao(produto?.descricao ?? "");
    setFormasPagamento(produto?.formasPagamento ?? "");
    setInformacoes(produto?.informacoes ?? "");
    setAtivo(produto?.ativo ?? true);
    setVariacoes(produto?.variacoes?.map((v) => ({ ...v })) ?? []);
    setFotoArquivoId(null);
    setFotoPreview(produto?.temFoto ? produtoFotoUrl(produto.id) : null);
  }, [aberto, produto]);

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fotoRef.current) fotoRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Selecione uma imagem.");
      return;
    }
    setEnviandoFoto(true);
    try {
      const blob = await comprimirImagem(file, 800, 0.85);
      const id = await enviarFotoProduto(blob);
      setFotoArquivoId(id);
      setFotoPreview(URL.createObjectURL(blob));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao enviar a foto.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  function atualizarVariacao(
    i: number,
    campo: keyof VariacaoProduto,
    valor: string | number,
  ) {
    setVariacoes((atual) =>
      atual.map((v, idx) => (idx === i ? { ...v, [campo]: valor } : v)),
    );
  }

  async function onSubmit() {
    if (!nome.trim()) {
      toast.warning("Informe o nome do produto.");
      return;
    }
    const precoNum = Number(preco.replace(",", "."));
    if (Number.isNaN(precoNum) || precoNum < 0) {
      toast.warning("Informe um preço válido.");
      return;
    }
    try {
      await salvar.mutateAsync({
        id: produto?.id,
        nome: nome.trim(),
        descricao: descricao.trim(),
        preco: precoNum,
        formasPagamento: formasPagamento.trim(),
        informacoes: informacoes.trim(),
        ativo,
        fotoArquivoId: fotoArquivoId ?? undefined,
        variacoes: variacoes.filter(
          (v) => v.tamanho.trim() || v.cor.trim() || v.quantidade > 0,
        ),
      });
      toast.success(editando ? "Produto atualizado." : "Produto cadastrado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            O produto aparece na loja do site quando marcado como ativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-3">
            {fotoPreview ? (
              <img
                src={fotoPreview}
                alt="Prévia"
                className="size-20 rounded-lg border border-border object-cover"
              />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                <Camera className="size-6" />
              </span>
            )}
            <input
              ref={fotoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={escolherFoto}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fotoRef.current?.click()}
              disabled={enviandoFoto}
            >
              {enviandoFoto ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {fotoPreview ? "Trocar foto" : "Adicionar foto"}
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5">Preço (R$) *</Label>
              <Input
                inputMode="decimal"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                Ativo (aparece na loja)
              </label>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Descrição</Label>
              <Textarea
                rows={2}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Formas de pagamento</Label>
              <Input
                value={formasPagamento}
                onChange={(e) => setFormasPagamento(e.target.value)}
                placeholder="Ex.: Pix, dinheiro, cartão"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Informações</Label>
              <Textarea
                rows={2}
                value={informacoes}
                onChange={(e) => setInformacoes(e.target.value)}
                placeholder="Ex.: retirada no polo, prazo de entrega…"
              />
            </div>
          </div>

          {/* Variações (estoque por tamanho + cor) */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <Label>Variações e estoque</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setVariacoes((a) => [...a, { ...VARIACAO_NOVA }])}
              >
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
            {variacoes.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sem variações. Adicione tamanho, cor e quantidade em estoque.
              </p>
            ) : (
              <div className="space-y-2">
                {variacoes.map((v, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2"
                  >
                    <div className="w-20">
                      <Label className="mb-1 text-xs">Tamanho</Label>
                      <Input
                        value={v.tamanho}
                        onChange={(e) =>
                          atualizarVariacao(i, "tamanho", e.target.value)
                        }
                        placeholder="P, M…"
                      />
                    </div>
                    <div className="min-w-24 flex-1">
                      <Label className="mb-1 text-xs">Cor</Label>
                      <Input
                        value={v.cor}
                        onChange={(e) =>
                          atualizarVariacao(i, "cor", e.target.value)
                        }
                        placeholder="Preta…"
                      />
                    </div>
                    <div className="w-20">
                      <Label className="mb-1 text-xs">Estoque</Label>
                      <Input
                        type="number"
                        min={0}
                        value={v.quantidade}
                        onChange={(e) =>
                          atualizarVariacao(
                            i,
                            "quantidade",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setVariacoes((a) => a.filter((_, idx) => idx !== i))
                      }
                      aria-label="Remover variação"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={salvar.isPending || enviandoFoto}>
            {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
