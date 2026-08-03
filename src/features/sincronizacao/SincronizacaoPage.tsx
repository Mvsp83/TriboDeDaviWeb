import { useState } from "react";
import { RefreshCw, RefreshCcwDot, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { usePolos } from "@/features/polos/polosApi";
import {
  useHistoricoSincronizacao,
  useUltimaSincronizacao,
  useSincronizarTudo,
  useSincronizarPolo,
} from "@/features/sincronizacao/sincronizacaoApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

function dataHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export function SincronizacaoPage() {
  const { data: polos } = usePolos();
  const [poloFiltro, setPoloFiltro] = useState(0);

  const { data: historico, isLoading } = useHistoricoSincronizacao(poloFiltro);
  const { data: ultima } = useUltimaSincronizacao();
  const sincTudo = useSincronizarTudo();
  const sincPolo = useSincronizarPolo();

  const sincronizando = sincTudo.isPending || sincPolo.isPending;

  async function executarTudo() {
    const r = await sincTudo.mutateAsync();
    toast[r.sucesso ? "success" : "error"](r.mensagem);
  }

  async function executarPolo() {
    if (poloFiltro === 0) return;
    const r = await sincPolo.mutateAsync(poloFiltro);
    toast[r.sucesso ? "success" : "error"](r.mensagem);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Sincronização de Cadastros</h2>
        <Button onClick={executarTudo} disabled={sincronizando}>
          <RefreshCw className={sincTudo.isPending ? "size-4 animate-spin" : "size-4"} />
          Sincronizar tudo
        </Button>
      </div>

      {ultima ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Clock className="size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground">Última sincronização</p>
              <p>
                <strong>{dataHora(ultima.dataExecucao)}</strong> — Polo:{" "}
                {ultima.poloNome} — Origem: <strong>{ultima.origem}</strong> —
                Status:{" "}
                {ultima.sucesso ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="size-4" /> Sucesso
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <XCircle className="size-4" /> Falha
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Nenhuma sincronização registrada ainda.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-56">
            <Label className="mb-1.5">Filtrar por polo</Label>
            <Select
              value={String(poloFiltro)}
              onValueChange={(v) => setPoloFiltro(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todos os polos</SelectItem>
                {(polos ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {poloFiltro > 0 && (
            <Button variant="secondary" onClick={executarPolo} disabled={sincronizando}>
              <RefreshCcwDot
                className={sincPolo.isPending ? "size-4 animate-spin" : "size-4"}
              />
              Sincronizar este polo
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Polo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Inseridos</TableHead>
                <TableHead>Atualizados</TableHead>
                <TableHead>Ignorados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && (historico ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    Nenhum histórico encontrado.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                (historico ?? []).map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="tabular-nums">
                      {dataHora(h.dataExecucao)}
                    </TableCell>
                    <TableCell>{h.poloNome}</TableCell>
                    <TableCell className="text-muted-foreground">{h.origem}</TableCell>
                    <TableCell
                      className={
                        h.inseridos > 0 ? "font-medium text-success" : "text-muted-foreground"
                      }
                    >
                      {h.inseridos > 0 ? `+${h.inseridos}` : 0}
                    </TableCell>
                    <TableCell
                      className={h.atualizados > 0 ? "font-medium text-primary" : "text-muted-foreground"}
                    >
                      {h.atualizados}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{h.ignorados}</TableCell>
                    <TableCell>
                      {h.sucesso ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="size-4" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <XCircle className="size-4" /> Falha
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {h.erros && h.erros !== "[]" ? (
                        <span className="text-warning">⚠ Sim</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
