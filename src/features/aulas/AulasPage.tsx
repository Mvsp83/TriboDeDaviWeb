import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CheckCircle2, ChevronRight, Clock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/AuthContext";
import { useAulas, useCriarAula } from "@/features/aulas/aulasApi";
import { usePolos } from "@/features/polos/polosApi";
import { ApiError } from "@/lib/api";
import { dataBR, horaCurta } from "@/lib/format";
import type { Polo } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function NovaAulaDialog({
  open,
  onOpenChange,
  admin,
  poloIdProfessor,
  poloNomeProfessor,
  polos,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  admin: boolean;
  poloIdProfessor: number | null;
  poloNomeProfessor: string;
  polos: Polo[];
}) {
  const criar = useCriarAula();
  const [data, setData] = useState("");
  const [turma, setTurma] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [poloId, setPoloId] = useState<number | null>(admin ? null : poloIdProfessor);

  // Limpa o formulário sempre que o diálogo abre.
  useEffect(() => {
    if (open) {
      setData("");
      setTurma("");
      setInicio("");
      setFim("");
      setPoloId(admin ? null : poloIdProfessor);
    }
  }, [open, admin, poloIdProfessor]);

  async function salvar() {
    if (poloId == null) return toast.warning("Selecione o polo.");
    if (!data) return toast.warning("Informe a data.");
    if (!turma) return toast.warning("Selecione a turma.");
    if (!inicio || !fim) return toast.warning("Informe o horário de início e fim.");
    // Comparação de "HH:mm" funciona lexicograficamente (24h com zero à esquerda).
    if (fim <= inicio) return toast.warning("A hora de fim deve ser maior que a de início.");

    try {
      await criar.mutateAsync({
        poloId,
        data,
        turma: Number(turma),
        horaInicio: inicio,
        horaFim: fim,
      });
      toast.success("Aula criada!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar a aula.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova aula</DialogTitle>
          <DialogDescription>
            Cadastre a aula para depois fazer a chamada. Professores criam apenas
            no próprio polo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5">Polo</Label>
            {admin ? (
              <Select
                value={poloId != null ? String(poloId) : ""}
                onValueChange={(v) => setPoloId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o polo" />
                </SelectTrigger>
                <SelectContent>
                  {polos.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={poloNomeProfessor || "-"} disabled />
            )}
          </div>

          <div>
            <Label className="mb-1.5">Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Turma</Label>
            <Select value={turma} onValueChange={setTurma}>
              <SelectTrigger>
                <SelectValue placeholder="Turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Turma 1</SelectItem>
                <SelectItem value="2">Turma 2</SelectItem>
                <SelectItem value="3">Turma 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5">Início</Label>
            <Input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5">Fim</Label>
            <Input type="time" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={criar.isPending}>
            {criar.isPending && <Loader2 className="size-4 animate-spin" />}
            Criar aula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AulasPage() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  // Professor e Supervisor podem criar aula (a API valida o polo).
  const podeCriar = admin || (sessao?.isProfessor ?? false) || sessao?.role === "Supervisor";
  const navigate = useNavigate();

  const { data: aulas, isLoading, isError } = useAulas(admin);
  const { data: polos } = usePolos();

  const [filtroPolo, setFiltroPolo] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [novaAula, setNovaAula] = useState(false);

  const nomePorPolo = useMemo(() => {
    const m = new Map<number, string>();
    polos?.forEach((p) => m.set(p.id, p.nome));
    return m;
  }, [polos]);

  const filtradas = useMemo(() => {
    const norm = (s: string) => s.toLocaleLowerCase("pt-BR");
    return (aulas ?? [])
      .filter(
        (a) =>
          !filtroPolo ||
          norm(nomePorPolo.get(a.poloId) ?? "").includes(norm(filtroPolo)),
      )
      .filter((a) => !filtroData || dataBR(a.data).includes(filtroData))
      .filter((a) => !filtroTurma || String(a.turma) === filtroTurma)
      .sort((a, b) => +new Date(b.data) - +new Date(a.data));
  }, [aulas, filtroPolo, filtroData, filtroTurma, nomePorPolo]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Carregando..."
            : `${filtradas.length} aula(s) · clique numa aula para ver a chamada`}
        </p>
        {podeCriar && (
          <Button size="sm" onClick={() => setNovaAula(true)}>
            <Plus className="size-4" />
            Nova aula
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {admin && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Polo"
                value={filtroPolo}
                onChange={(e) => setFiltroPolo(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          <Input
            placeholder="Data (dd/MM/aaaa)"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
          />
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
                <TableHead>Data</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Presença</TableHead>
                <TableHead className="w-10" aria-label="Abrir" />
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
                    Erro ao carregar as aulas. Tente novamente.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Nenhuma aula encontrada.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtradas.map((a) => (
                  <TableRow
                    key={a.id}
                    onClick={() => navigate(`/chamada/${a.id}`)}
                    className="cursor-pointer transition-colors hover:bg-secondary/40"
                  >
                    <TableCell className="font-medium tabular-nums">
                      {dataBR(a.data)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {nomePorPolo.get(a.poloId) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Turma {a.turma}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {horaCurta(a.horaInicio)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {horaCurta(a.horaFim)}
                    </TableCell>
                    <TableCell>
                      {a.presencaSalva ? (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <CheckCircle2 className="size-4" /> Salva
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-warning">
                          <Clock className="size-4" /> Pendente
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <ChevronRight className="size-4" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <NovaAulaDialog
        open={novaAula}
        onOpenChange={setNovaAula}
        admin={admin}
        poloIdProfessor={sessao?.poloId ?? null}
        poloNomeProfessor={sessao?.poloNome ?? ""}
        polos={polos ?? []}
      />
    </div>
  );
}
