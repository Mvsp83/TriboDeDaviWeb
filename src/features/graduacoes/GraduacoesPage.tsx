import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Award, GraduationCap, Loader2, Printer, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunos } from "@/features/alunos/alunosApi";
import { usePolos } from "@/features/polos/polosApi";
import { faixaInfo, OPCOES_FAIXA_BASE, mudouDeCor } from "@/features/alunos/faixa";
import { ApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import {
  useGraduacoes,
  useRegistrarGraduacao,
  useExcluirGraduacao,
  type Graduacao,
} from "@/features/graduacoes/graduacoesApi";
import { imprimirCertificado } from "@/features/graduacoes/certificadoPdf";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Chip com a cor real da faixa — o mesmo código usado na lista de alunos.
function ChipFaixa({ faixa }: { faixa: number }) {
  const info = faixaInfo(faixa);
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: info.cor, color: info.texto }}
    >
      {info.nome}
    </span>
  );
}

// Diálogo de graduação em lote: a turma costuma graduar junta, então o padrão
// é promover todos os selecionados de uma vez.
function RegistrarDialog({
  aberto,
  onOpenChange,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const { data: alunos } = useAlunos(admin);
  const { data: polos } = usePolos();
  const registrar = useRegistrarGraduacao();

  const [poloId, setPoloId] = useState<string>(
    sessao?.poloId != null ? String(sessao.poloId) : "",
  );
  const [turma, setTurma] = useState("todas");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  // Faixa de destino: por padrão, sobe um grau de cada aluno.
  const [modo, setModo] = useState<"grau" | "faixa">("grau");
  const [faixaAlvo, setFaixaAlvo] = useState("5");

  const candidatos = useMemo(() => {
    return (alunos ?? [])
      .filter((a) => !poloId || a.poloId === Number(poloId))
      .filter((a) => turma === "todas" || a.turma === Number(turma))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [alunos, poloId, turma]);

  // Preto (40) é o topo da escala do sistema: não há grau seguinte.
  const novaFaixaDe = (faixaAtual: number) =>
    modo === "grau" ? Math.min(faixaAtual + 1, 40) : Number(faixaAlvo);

  const alternar = (id: number) =>
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function salvar() {
    if (selecionados.size === 0) {
      toast.warning("Selecione ao menos um aluno.");
      return;
    }
    if (!data) {
      toast.warning("Informe a data da graduação.");
      return;
    }

    const lista = candidatos
      .filter((a) => selecionados.has(a.id))
      .map((a) => ({ alunoId: a.id, faixaNova: novaFaixaDe(a.faixa) }));

    try {
      const r = await registrar.mutateAsync({ data, observacao, alunos: lista });
      toast.success(r.mensagem);
      // Quem foi ignorado (já estava na faixa) volta com o motivo.
      r.ignorados?.forEach((m) => toast.warning(m));
      setSelecionados(new Set());
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao registrar.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar graduação</DialogTitle>
          <DialogDescription>
            Selecione os alunos e a nova faixa. A faixa do aluno é atualizada e o
            histórico fica guardado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {admin && (
            <div>
              <Label className="mb-1.5">Polo</Label>
              <Select value={poloId} onValueChange={setPoloId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {(polos ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="mb-1.5">Turma</Label>
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="1">Turma 1</SelectItem>
                <SelectItem value="2">Turma 2</SelectItem>
                <SelectItem value="3">Turma 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Promover para</Label>
            <Select value={modo} onValueChange={(v) => setModo(v as "grau" | "faixa")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grau">Próximo grau de cada um</SelectItem>
                <SelectItem value="faixa">Uma faixa específica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {modo === "faixa" && (
            <div>
              <Label className="mb-1.5">Faixa</Label>
              <Select value={faixaAlvo} onValueChange={setFaixaAlvo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPCOES_FAIXA_BASE.map((f) => (
                    <SelectItem key={f.valor} value={String(f.valor)}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Observação</Label>
            <Input
              placeholder="ex: Exame de faixa do 1º semestre"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm font-medium">
            Alunos ({selecionados.size} de {candidatos.length})
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelecionados(new Set(candidatos.map((a) => a.id)))}
            >
              Todos
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelecionados(new Set())}>
              Limpar
            </Button>
          </div>
        </div>

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {candidatos.map((a) => {
            const nova = novaFaixaDe(a.faixa);
            const marcado = selecionados.has(a.id);
            const semMudanca = nova <= a.faixa;
            return (
              <li key={a.id}>
                <label
                  className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 ${
                    semMudanca ? "border-dashed border-border opacity-60" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={marcado}
                    onChange={() => alternar(a.id)}
                    disabled={semMudanca}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{a.nome}</span>
                  <ChipFaixa faixa={a.faixa} />
                  {!semMudanca && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <ChipFaixa faixa={nova} />
                    </>
                  )}
                  {semMudanca && (
                    <span className="text-xs text-muted-foreground">já está nessa faixa</span>
                  )}
                </label>
              </li>
            );
          })}
          {candidatos.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">
              Nenhum aluno com os filtros atuais.
            </li>
          )}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={registrar.isPending}>
            {registrar.isPending && <Loader2 className="size-4 animate-spin" />}
            <Award className="size-4" />
            Graduar {selecionados.size > 0 ? `(${selecionados.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GraduacoesPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(String(anoAtual));
  const [registrando, setRegistrando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Graduacao | null>(null);

  const { data: graduacoes, isLoading } = useGraduacoes(Number(ano));
  const excluir = useExcluirGraduacao();

  const anos = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3].map(String);
  const lista = graduacoes ?? [];

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Graduação removida e faixa anterior restaurada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <GraduationCap className="mt-0.5 size-4 shrink-0" />
        <p>
          Histórico de graduações do projeto. Registrar atualiza a faixa do aluno
          e guarda a trajetória. O{" "}
          <span className="font-medium text-foreground">certificado para imprimir</span>{" "}
          sai apenas na <span className="font-medium text-foreground">troca de faixa (cor)</span> —
          um grau novo dentro da mesma cor não gera certificado.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-32">
            <Label className="mb-1.5">Ano</Label>
            <Select value={ano} onValueChange={setAno}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${lista.length} graduação(ões)`}
          </p>
          <Button className="ml-auto" onClick={() => setRegistrando(true)}>
            <Award className="size-4" />
            Registrar graduação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && lista.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhuma graduação registrada em {ano}.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                lista.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.nomeAluno}</TableCell>
                    <TableCell className="text-muted-foreground">{g.poloNome}</TableCell>
                    <TableCell>
                      <ChipFaixa faixa={g.faixaAnterior} />
                    </TableCell>
                    <TableCell>
                      <ChipFaixa faixa={g.faixaNova} />
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {dataBR(g.data)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Certificado só na troca de cor — grau novo dentro da
                            mesma cor não gera certificado. */}
                        {mudouDeCor(g.faixaAnterior, g.faixaNova) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Imprimir certificado"
                            onClick={() => {
                              if (!imprimirCertificado(g)) {
                                toast.error("Permita pop-ups para gerar o certificado.");
                              }
                            }}
                          >
                            <Printer className="size-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          title="Remover graduação"
                          onClick={() => setParaExcluir(g)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RegistrarDialog aberto={registrando} onOpenChange={setRegistrando} />

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(v) => !v && setParaExcluir(null)}
        titulo="Remover graduação?"
        descricao={
          <>
            <strong>{paraExcluir?.nomeAluno}</strong> volta para a faixa{" "}
            <strong>{paraExcluir ? faixaInfo(paraExcluir.faixaAnterior).nome : ""}</strong>.
            Use isto para corrigir um lançamento errado.
          </>
        }
        confirmarLabel="Remover"
        destrutivo
        carregando={excluir.isPending}
        onConfirmar={confirmarExclusao}
      />
    </div>
  );
}
