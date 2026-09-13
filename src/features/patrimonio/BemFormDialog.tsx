import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSalvarBem } from "@/features/patrimonio/patrimonioApi";
import { CATEGORIAS_BEM, ESTADOS_BEM } from "@/features/patrimonio/tipos";
import { ApiError } from "@/lib/api";
import { paraInputDate } from "@/lib/format";
import type { Aluno, BemPatrimonial, Polo } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEM_POLO = "nenhum";
const SEM_ALUNO = "nenhum";

// Categorias que são emprestadas a um aluno e ganham tamanho/cor (Quimono, Faixa).
const CATEGORIAS_VESTUARIO = new Set(["0", "1"]);

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  bem: BemPatrimonial | null;
  polos: Polo[];
  alunos: Pick<Aluno, "id" | "nome">[];
}

export function BemFormDialog({ aberto, onOpenChange, bem, polos, alunos }: Props) {
  const salvar = useSalvarBem();
  const editando = bem !== null;

  const [categoria, setCategoria] = useState("0");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnitario, setValorUnitario] = useState("");
  const [dataAquisicao, setDataAquisicao] = useState("");
  const [estado, setEstado] = useState("1");
  const [polo, setPolo] = useState(SEM_POLO);
  const [numeroPatrimonio, setNumeroPatrimonio] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [alunoId, setAlunoId] = useState(SEM_ALUNO);

  const vestuario = CATEGORIAS_VESTUARIO.has(categoria);

  useEffect(() => {
    if (!aberto) return;
    setCategoria(String(bem?.categoria ?? 0));
    setDescricao(bem?.descricao ?? "");
    setQuantidade(String(bem?.quantidade ?? 1));
    setValorUnitario(bem?.valorUnitario ? String(bem.valorUnitario) : "");
    setDataAquisicao(bem?.dataAquisicao ? paraInputDate(bem.dataAquisicao) : "");
    setEstado(String(bem?.estado ?? 1));
    setPolo(bem?.poloId ? String(bem.poloId) : SEM_POLO);
    setNumeroPatrimonio(bem?.numeroPatrimonio ?? "");
    setObservacoes(bem?.observacoes ?? "");
    setTamanho(bem?.tamanho ?? "");
    setCor(bem?.cor ?? "");
    setAlunoId(bem?.alunoId ? String(bem.alunoId) : SEM_ALUNO);
  }, [aberto, bem]);

  async function onSalvar() {
    if (!descricao.trim()) {
      toast.warning("Informe a descrição do bem.");
      return;
    }
    try {
      await salvar.mutateAsync({
        id: bem?.id,
        categoria: Number(categoria),
        descricao: descricao.trim(),
        quantidade: Number(quantidade) || 0,
        valorUnitario: Number(valorUnitario) || 0,
        dataAquisicao: dataAquisicao || null,
        estado: Number(estado),
        poloId: polo === SEM_POLO ? null : Number(polo),
        numeroPatrimonio: numeroPatrimonio.trim(),
        observacoes: observacoes.trim(),
        // Tamanho/cor/empréstimo só fazem sentido para vestuário; nas demais
        // categorias vão zerados.
        tamanho: vestuario ? tamanho.trim() : "",
        cor: vestuario ? cor.trim() : "",
        alunoId: vestuario && alunoId !== SEM_ALUNO ? Number(alunoId) : null,
      });
      toast.success(editando ? "Bem atualizado." : "Bem cadastrado.");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar o bem.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar bem" : "Novo bem"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1.5">Descrição / identificação</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Quimono adulto A2 branco"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_BEM.map((c) => (
                    <SelectItem key={c.valor} value={String(c.valor)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Estado</Label>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BEM.map((e) => (
                    <SelectItem key={e.valor} value={String(e.valor)}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5">Quantidade</Label>
              <Input
                type="number"
                min={0}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Valor unitário (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={valorUnitario}
                onChange={(e) => setValorUnitario(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Aquisição</Label>
              <Input
                type="date"
                value={dataAquisicao}
                onChange={(e) => setDataAquisicao(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5">Polo (opcional)</Label>
              <Select value={polo} onValueChange={setPolo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_POLO}>Geral / não vinculado</SelectItem>
                  {polos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5">Nº de patrimônio (opcional)</Label>
              <Input
                value={numeroPatrimonio}
                onChange={(e) => setNumeroPatrimonio(e.target.value)}
              />
            </div>
          </div>

          {/* Vestuário (quimono/faixa): tamanho, cor e empréstimo a um aluno.
              Cadastre 1 unidade por linha para controlar quem está com cada peça. */}
          {vestuario && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5">Tamanho</Label>
                  <Input
                    value={tamanho}
                    onChange={(e) => setTamanho(e.target.value)}
                    placeholder={categoria === "0" ? "ex.: M2 / A2" : "ex.: M2"}
                  />
                </div>
                <div>
                  <Label className="mb-1.5">Cor</Label>
                  <Input
                    value={cor}
                    onChange={(e) => setCor(e.target.value)}
                    placeholder={categoria === "1" ? "ex.: Azul" : "ex.: Branco"}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1.5">Emprestado a (opcional)</Label>
                <Select value={alunoId} onValueChange={setAlunoId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_ALUNO}>Disponível (ninguém)</SelectItem>
                    {[...alunos]
                      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                      .map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-1.5">Observações (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSalvar} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
