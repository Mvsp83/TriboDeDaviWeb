import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, FileText, Link2 } from "lucide-react";
import {
  useBens,
  useHistoricoAluno,
  useHistoricoPolo,
  useEmprestarBem,
  useDevolverEmprestimo,
} from "@/features/patrimonio/patrimonioApi";
import { CATEGORIA_BEM_LABEL } from "@/features/patrimonio/tipos";
import { imprimirComodato } from "@/features/patrimonio/comodatoPdf";
import { dataCurtaBR } from "@/lib/format";
import { ApiError } from "@/lib/api";
import type { BemPatrimonial } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  // Destino da alocação: um aluno (quimono/faixa) ou um polo (tatame).
  destino: { tipo: "aluno" | "polo"; id: number; nome: string };
  // Categorias de bem elegíveis (Quimono=0, Faixa=1, Tatame=2).
  categorias: number[];
  // Mostra o botão de termo de comodato por item (faz sentido só para aluno).
  comodato?: boolean;
  // Só admin pode vincular/devolver; sem isso, a seção é só consulta.
  podeGerenciar: boolean;
}

// Lista e gerencia as alocações de patrimônio de um aluno (quimono/faixa) ou de
// um polo (tatame). Cada alocação em aberto consome uma unidade disponível do
// bem; devolver libera de volta. Reusa a mesma API de empréstimo/comodato.
export function VinculosPatrimonio({
  destino,
  categorias,
  comodato = false,
  podeGerenciar,
}: Props) {
  const { data: bens } = useBens();
  const alunoHist = useHistoricoAluno(destino.tipo === "aluno" ? destino.id : null);
  const poloHist = useHistoricoPolo(destino.tipo === "polo" ? destino.id : null);
  const historico = destino.tipo === "aluno" ? alunoHist : poloHist;

  const emprestar = useEmprestarBem();
  const devolver = useDevolverEmprestimo();
  const [bemSelecionado, setBemSelecionado] = useState("");

  const bemPorId = useMemo(
    () => new Map((bens ?? []).map((b) => [b.id, b])),
    [bens],
  );

  // Alocações em aberto (sem devolução) deste destino.
  const abertos = useMemo(
    () => (historico.data ?? []).filter((e) => !e.dataDevolucao),
    [historico.data],
  );

  // Bens elegíveis com pelo menos uma unidade livre.
  const disponiveis = useMemo(
    () =>
      (bens ?? [])
        .filter((b) => categorias.includes(b.categoria))
        .map((b) => ({ bem: b, livres: b.quantidade - (b.alocadosAbertos ?? 0) }))
        .filter((x) => x.livres > 0)
        .sort((a, b) =>
          a.bem.descricao.localeCompare(b.bem.descricao, "pt-BR"),
        ),
    [bens, categorias],
  );

  function rotuloBem(b: BemPatrimonial): string {
    return [CATEGORIA_BEM_LABEL[b.categoria], b.descricao, b.tamanho, b.cor]
      .filter(Boolean)
      .join(" · ");
  }

  async function vincular() {
    if (!bemSelecionado) {
      toast.warning("Escolha um item para vincular.");
      return;
    }
    try {
      await emprestar.mutateAsync({
        bemPatrimonialId: Number(bemSelecionado),
        alunoId: destino.tipo === "aluno" ? destino.id : undefined,
        poloId: destino.tipo === "polo" ? destino.id : undefined,
        observacao: "",
      });
      setBemSelecionado("");
      toast.success("Item vinculado.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao vincular o item.");
    }
  }

  async function devolverItem(emprestimoId: number) {
    try {
      await devolver.mutateAsync(emprestimoId);
      toast.success("Devolução registrada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar a devolução.");
    }
  }

  return (
    <div className="space-y-2">
      {historico.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando vínculos...</p>
      ) : abertos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item vinculado.</p>
      ) : (
        <ul className="space-y-1.5">
          {abertos.map((e) => {
            const bem = bemPorId.get(e.bemPatrimonialId);
            return (
              <li
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {bem ? rotuloBem(bem) : `Bem #${e.bemPatrimonialId}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Desde {dataCurtaBR(e.dataEmprestimo)}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {comodato && bem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Termo de comodato (PDF)"
                      onClick={() => {
                        if (!imprimirComodato(bem, destino.nome))
                          toast.error("Permita pop-ups para o PDF.");
                      }}
                    >
                      <FileText className="size-4" />
                    </Button>
                  )}
                  {podeGerenciar && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Registrar devolução"
                      onClick={() => devolverItem(e.id)}
                      disabled={devolver.isPending}
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {podeGerenciar && (
        <div className="flex items-end gap-2 pt-1">
          <div className="flex-1">
            <Select value={bemSelecionado} onValueChange={setBemSelecionado}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    disponiveis.length === 0
                      ? "Sem itens disponíveis no estoque"
                      : "Vincular um item disponível..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {disponiveis.map(({ bem, livres }) => (
                  <SelectItem key={bem.id} value={String(bem.id)}>
                    {rotuloBem(bem)} ({livres} livre{livres === 1 ? "" : "s"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={vincular}
            disabled={emprestar.isPending || !bemSelecionado}
          >
            {emprestar.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Vincular
          </Button>
        </div>
      )}
    </div>
  );
}
