import { useCallback, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  QrCode,
  Download,
  ShieldX,
  KeyRound,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { usePolos } from "@/features/polos/polosApi";
import {
  useAlunos,
  useExcluirAluno,
  useExportarDadosAluno,
  useAnonimizarAluno,
  usePrepararCodigosResponsavel,
} from "@/features/alunos/alunosApi";
import { AlunoFormDialog } from "@/features/alunos/AlunoFormDialog";
import { CodigoResponsavelDialog } from "@/features/responsavel/CodigoResponsavelDialog";
import { imprimirCodigos } from "@/features/responsavel/imprimirCodigos";
import { faixaInfo } from "@/features/alunos/faixa";
import { imprimirCarteirinhas } from "@/features/carteirinha/carteirinhaPdf";
import { ApiError } from "@/lib/api";
import { useTableSort, type SortValue } from "@/lib/useTableSort";
import { SortableHead } from "@/components/SortableHead";
import type { Aluno } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function FaixaBadge({ faixa }: { faixa: number }) {
  const info = faixaInfo(faixa);
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: info.cor,
        color: info.texto,
        borderColor: "rgba(0,0,0,0.15)",
      }}
    >
      {info.nome}
    </span>
  );
}

export function AlunosPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  const { data: alunos, isLoading, isError } = useAlunos(admin);
  const { data: polos } = usePolos();
  const excluir = useExcluirAluno();
  const exportar = useExportarDadosAluno();
  const anonimizar = useAnonimizarAluno();
  const prepararCodigos = usePrepararCodigosResponsavel();

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroPolo, setFiltroPolo] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");

  const [dialogAberto, setDialogAberto] = useState(false);
  const [alunoEdicao, setAlunoEdicao] = useState<Aluno | null>(null);
  const [alunoExcluir, setAlunoExcluir] = useState<Aluno | null>(null);
  const [alunoAnonimizar, setAlunoAnonimizar] = useState<Aluno | null>(null);
  const [alunoCodigo, setAlunoCodigo] = useState<Aluno | null>(null);

  const nomePorPolo = useMemo(() => {
    const map = new Map<number, string>();
    polos?.forEach((p) => map.set(p.id, p.nome));
    return map;
  }, [polos]);

  const filtrados = useMemo(() => {
    const norm = (s: string) => s.toLocaleLowerCase("pt-BR");
    return (alunos ?? []).filter((a) => {
      if (filtroNome && !norm(a.nome).includes(norm(filtroNome))) return false;
      if (
        filtroPolo &&
        !norm(nomePorPolo.get(a.poloId) ?? "").includes(norm(filtroPolo))
      )
        return false;
      if (filtroTurma && String(a.turma) !== filtroTurma) return false;
      return true;
    });
  }, [alunos, filtroNome, filtroPolo, filtroTurma, nomePorPolo]);

  const acessar = useCallback(
    (a: Aluno, key: string): SortValue => {
      switch (key) {
        case "nome":
          return a.nome;
        case "faixa":
          return a.faixa; // ordena pela progressão da faixa
        case "polo":
          return nomePorPolo.get(a.poloId) ?? "";
        case "cidade":
          return a.cidade ?? "";
        case "celular":
          return a.celular ?? "";
        case "nascimento":
          return a.dataNascimento ? new Date(a.dataNascimento) : null;
        default:
          return "";
      }
    },
    [nomePorPolo],
  );

  const { sorted, sortKey, sortDir, toggleSort } = useTableSort(
    filtrados,
    acessar,
    { key: "nome" },
  );

  function abrirNovo() {
    setAlunoEdicao(null);
    setDialogAberto(true);
  }

  function abrirEdicao(aluno: Aluno) {
    setAlunoEdicao(aluno);
    setDialogAberto(true);
  }

  async function gerarCarteirinha(aluno: Aluno) {
    const ok = await imprimirCarteirinhas([
      { aluno, nomePolo: nomePorPolo.get(aluno.poloId) ?? "-" },
    ]);
    if (!ok) toast.error("Permita pop-ups para gerar a carteirinha.");
  }

  async function confirmarExclusao() {
    if (!alunoExcluir) return;
    try {
      await excluir.mutateAsync(alunoExcluir.id);
      toast.success("Aluno excluído.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao excluir o aluno.",
      );
    } finally {
      setAlunoExcluir(null);
    }
  }

  // LGPD — acesso/portabilidade: baixa os dados do aluno como JSON.
  async function exportarDados(aluno: Aluno) {
    try {
      const dados = await exportar.mutateAsync(aluno.id);
      const nomeArquivo = `aluno-${aluno.id}-dados-lgpd.json`;
      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Dados exportados.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao exportar os dados.",
      );
    }
  }

  // LGPD — eliminação: apaga os dados pessoais mantendo o histórico anonimizado.
  async function confirmarAnonimizacao() {
    if (!alunoAnonimizar) return;
    try {
      await anonimizar.mutateAsync(alunoAnonimizar.id);
      toast.success("Dados pessoais anonimizados.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao anonimizar o aluno.",
      );
    } finally {
      setAlunoAnonimizar(null);
    }
  }

  // Gera os códigos faltantes e abre a folha de impressão (entrega física).
  async function imprimirTodosCodigos() {
    try {
      const itens = await prepararCodigos.mutateAsync();
      if (!itens || itens.length === 0) {
        toast.info("Nenhum aluno para gerar código.");
        return;
      }
      if (!imprimirCodigos(itens, nomePorPolo)) {
        toast.error("Permita pop-ups para imprimir os códigos.");
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Erro ao preparar os códigos.",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Carregando..." : `${filtrados.length} aluno(s)`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={imprimirTodosCodigos}
            disabled={prepararCodigos.isPending}
            title="Gera os códigos faltantes e abre a folha para imprimir"
          >
            {prepararCodigos.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Printer className="size-4" />
            )}
            Imprimir códigos
          </Button>
          {admin && (
            <Button onClick={abrirNovo}>
              <Plus className="size-4" />
              Novo aluno
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="pl-9"
            />
          </div>
          {admin && (
            <Input
              placeholder="Polo"
              value={filtroPolo}
              onChange={(e) => setFiltroPolo(e.target.value)}
            />
          )}
          <Input
            placeholder="Turma (1, 2 ou 3)"
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {(
                  [
                    ["nome", "Nome"],
                    ["faixa", "Faixa"],
                    ["polo", "Polo"],
                    ["cidade", "Cidade"],
                    ["celular", "Celular"],
                    ["nascimento", "Nascimento"],
                  ] as const
                ).map(([key, label]) => (
                  <SortableHead
                    key={key}
                    label={label}
                    columnKey={key}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                ))}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-destructive">
                    Erro ao carregar os alunos. Tente novamente.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nenhum aluno encontrado.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                sorted.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>
                      <FaixaBadge faixa={a.faixa} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {nomePorPolo.get(a.poloId) ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.cidade ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.celular ?? "-"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {a.dataNascimento
                        ? new Date(a.dataNascimento).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => gerarCarteirinha(a)}
                          aria-label="Carteirinha"
                          title="Carteirinha com QR"
                        >
                          <QrCode className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirEdicao(a)}
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {/* Código do responsável: professor+ (a família pode
                            ter perdido) — não é exclusivo de admin. */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAlunoCodigo(a)}
                          aria-label="Acesso do responsável"
                          title="Código de acesso do responsável"
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        {admin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportarDados(a)}
                            disabled={
                              exportar.isPending &&
                              exportar.variables === a.id
                            }
                            aria-label="Exportar dados (LGPD)"
                            title="Exportar dados do aluno (LGPD)"
                          >
                            {exportar.isPending && exportar.variables === a.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Download className="size-4" />
                            )}
                          </Button>
                        )}
                        {admin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAlunoAnonimizar(a)}
                            aria-label="Anonimizar (LGPD)"
                            title="Anonimizar dados pessoais (LGPD)"
                            className="text-amber-600 hover:text-amber-600"
                          >
                            <ShieldX className="size-4" />
                          </Button>
                        )}
                        {admin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAlunoExcluir(a)}
                            aria-label="Excluir"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlunoFormDialog
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        aluno={alunoEdicao}
        polos={polos ?? []}
        poloPadrao={sessao?.poloId}
      />

      <Dialog
        open={alunoExcluir !== null}
        onOpenChange={(o) => !o && setAlunoExcluir(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Deseja excluir o aluno <strong>{alunoExcluir?.nome}</strong>? Esta
              ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlunoExcluir(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
              disabled={excluir.isPending}
            >
              {excluir.isPending && <Loader2 className="size-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={alunoAnonimizar !== null}
        onOpenChange={(o) => !o && setAlunoAnonimizar(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Anonimizar dados pessoais (LGPD)</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Isto apaga os <strong>dados pessoais</strong> de{" "}
                  <strong>{alunoAnonimizar?.nome}</strong> — nome, RG, CPF,
                  endereço, contatos e responsável — e da ficha de inscrição.
                </p>
                <p>
                  O histórico de presença, matrícula e graduação{" "}
                  <strong>é preservado de forma anonimizada</strong> para a
                  prestação de contas. A ação não pode ser desfeita. Para exportar
                  os dados antes, use o botão de download.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAlunoAnonimizar(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarAnonimizacao}
              disabled={anonimizar.isPending}
            >
              {anonimizar.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Anonimizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CodigoResponsavelDialog
        aluno={alunoCodigo}
        aberto={alunoCodigo !== null}
        onOpenChange={(o) => !o && setAlunoCodigo(null)}
      />
    </div>
  );
}
