import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Trophy,
  ChevronRight,
  Trash2,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { toApiError } from "@/lib/api";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useAlunos } from "@/features/alunos/alunosApi";
import { faixaInfo } from "@/features/alunos/faixa";
import {
  useAtletas,
  useCriarAtleta,
  useRemoverAtleta,
  STATUS_ATLETA,
  type Atleta,
} from "@/features/atletas/atletasApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function statusVariant(s: number): "success" | "warning" | "secondary" {
  if (s === 0) return "success";
  if (s === 1) return "warning";
  return "secondary";
}

function FaixaChip({ faixa }: { faixa: number }) {
  const f = faixaInfo(faixa);
  return (
    <span
      className="rounded px-1.5 py-0.5 text-xs font-medium"
      style={{ background: f.cor, color: f.texto }}
    >
      {f.nome}
    </span>
  );
}

export function AtletasPage() {
  useDocumentTitle("Atletas de alto rendimento");
  const { data: atletas = [], isLoading } = useAtletas();
  const criar = useCriarAtleta();
  const remover = useRemoverAtleta();

  const [novo, setNovo] = useState(false);
  const [alunoSel, setAlunoSel] = useState("");
  const [excluir, setExcluir] = useState<Atleta | null>(null);

  // Alunos que ainda não são atletas (para o seletor).
  const alunos = useAlunos(true);
  const jaAtletas = useMemo(
    () => new Set(atletas.map((a) => a.alunoId)),
    [atletas],
  );
  const disponiveis = useMemo(
    () => (alunos.data ?? []).filter((a) => !jaAtletas.has(a.id)),
    [alunos.data, jaAtletas],
  );

  async function adicionar() {
    if (!alunoSel) return;
    try {
      await criar.mutateAsync(Number(alunoSel));
      toast.success("Atleta incluído.");
      setNovo(false);
      setAlunoSel("");
    } catch (e) {
      toast.error(toApiError(e).message);
    }
  }

  async function confirmarExclusao() {
    if (!excluir) return;
    try {
      await remover.mutateAsync(excluir.id);
      toast.success("Atleta removido do módulo.");
    } catch (e) {
      toast.error(toApiError(e).message);
    } finally {
      setExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Trophy className="size-6 text-primary" />
            Alto rendimento
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Carregando…" : `${atletas.length} atleta(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/atletas/comparativo">
              <BarChart3 className="size-4" />
              Comparativo
            </Link>
          </Button>
          <Button onClick={() => setNovo(true)}>
            <Plus className="size-4" />
            Adicionar atleta
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {atletas.some((a) => a.lesoesAtivas > 0 || a.metasAtencao > 0) && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-warning">
            <AlertTriangle className="size-4" /> Atenção
          </p>
          <ul className="space-y-0.5 text-sm text-muted-foreground">
            {atletas
              .filter((a) => a.lesoesAtivas > 0 || a.metasAtencao > 0)
              .map((a) => (
                <li key={a.id}>
                  <Link to={`/atletas/${a.id}`} className="hover:text-foreground">
                    <strong className="text-foreground">{a.alunoNome}</strong>
                    {a.lesoesAtivas > 0 && ` · ${a.lesoesAtivas} lesão(ões) ativa(s)`}
                    {a.metasAtencao > 0 && ` · ${a.metasAtencao} meta(s) com prazo próximo`}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}

      {!isLoading && atletas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhum atleta ainda. Clique em “Adicionar atleta” para selecionar um
            aluno do cadastro.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {atletas.map((a) => (
            <Card key={a.id} className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center gap-3 p-4">
                <Link to={`/atletas/${a.id}`} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">{a.alunoNome}</span>
                    <FaixaChip faixa={a.faixa} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={statusVariant(a.status)}>
                      {STATUS_ATLETA[a.status]}
                    </Badge>
                    <span>{a.poloNome}</span>
                    {a.totalCompeticoes > 0 && (
                      <span>
                        🥇{a.medalhasOuro} 🥈{a.medalhasPrata} 🥉{a.medalhasBronze}
                      </span>
                    )}
                    {(a.lesoesAtivas > 0 || a.metasAtencao > 0) && (
                      <AlertTriangle className="size-3.5 text-warning" />
                    )}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setExcluir(a)}
                  aria-label="Remover"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
                <Link to={`/atletas/${a.id}`}>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Adicionar */}
      <Dialog open={novo} onOpenChange={setNovo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar atleta</DialogTitle>
            <DialogDescription>
              Selecione um aluno do cadastro para acompanhar como atleta de alto
              rendimento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Aluno</Label>
            <Select value={alunoSel} onValueChange={setAlunoSel}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {disponiveis.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {disponiveis.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todos os alunos já são atletas (ou não há alunos cadastrados).
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNovo(false)}>
              Cancelar
            </Button>
            <Button onClick={adicionar} disabled={!alunoSel || criar.isPending}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={excluir !== null}
        onOpenChange={(o) => !o && setExcluir(null)}
        titulo="Remover do alto rendimento"
        descricao={
          <>
            Remover <strong>{excluir?.alunoNome}</strong> do módulo de atletas?
            Os índices, competições, diário e metas dele serão apagados. O
            cadastro do aluno permanece.
          </>
        }
        confirmarLabel="Remover"
        onConfirmar={confirmarExclusao}
        carregando={remover.isPending}
      />
    </div>
  );
}
