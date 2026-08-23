import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  FilePlus,
  ReceiptText,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from "lucide-react";
import {
  useDocumentosOficiais,
  useAnosDocumentos,
  useExcluirDocumentoOficial,
} from "@/features/documentosOficiais/documentosOficiaisApi";
import { exportarDocumentoOficialPdf } from "@/features/documentosOficiais/documentosOficiaisPdf";
import { TIPO_DOC_LABEL } from "@/features/documentosOficiais/tipos";
import { dataCurtaBR } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { STATUS_DOC, type DocumentoOficial } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DocumentosOficiaisPage() {
  const navigate = useNavigate();
  const anoCorrente = new Date().getFullYear();
  const [ano, setAno] = useState(anoCorrente);
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const { data: docs, isLoading } = useDocumentosOficiais(ano);
  const { data: anos } = useAnosDocumentos();
  const excluir = useExcluirDocumentoOficial();
  const [paraExcluir, setParaExcluir] = useState<DocumentoOficial | null>(null);

  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>(anos ?? []);
    set.add(anoCorrente);
    set.add(ano);
    return [...set].sort((a, b) => b - a);
  }, [anos, anoCorrente, ano]);

  const filtrados = useMemo(
    () =>
      (docs ?? [])
        .filter((d) => {
          if (filtroTipo === "todos") return true;
          // "Recibos" agrupa recibo comum (1) e recibo de doação (2), que têm
          // numeração própria mas são ambos recibos para quem filtra.
          if (filtroTipo === "recibos") return d.tipo === 1 || d.tipo === 2;
          return d.tipo === Number(filtroTipo);
        })
        .sort((a, b) => b.dataDocumento.localeCompare(a.dataDocumento)),
    [docs, filtroTipo],
  );

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Rascunho excluído.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setAno((a) => a - 1)} aria-label="Ano anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setAno((a) => a + 1)} aria-label="Próximo ano">
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/documentos-oficiais/novo/oficio")}>
            <FilePlus className="size-4" /> Novo ofício
          </Button>
          <Button variant="outline" onClick={() => navigate("/documentos-oficiais/novo/recibo")}>
            <ReceiptText className="size-4" /> Novo recibo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="w-48">
            <Label className="mb-1.5">Tipo</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="0">Ofícios</SelectItem>
                <SelectItem value="recibos">Recibos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Identificação</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}

              {!isLoading && filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Nenhum documento em {ano}.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtrados.map((d) => {
                  const aprovado = d.status === STATUS_DOC.Aprovado;
                  return (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer transition-colors hover:bg-secondary/40"
                      onClick={() => navigate(`/documentos-oficiais/editor/${d.id}`)}
                    >
                      <TableCell className="font-medium tabular-nums">
                        {d.numeroFormatado || "—"}
                      </TableCell>
                      <TableCell>{TIPO_DOC_LABEL[d.tipo]}</TableCell>
                      <TableCell className="text-muted-foreground">{d.titulo}</TableCell>
                      <TableCell className="tabular-nums">{dataCurtaBR(d.dataDocumento)}</TableCell>
                      <TableCell>
                        {aprovado ? (
                          <Badge variant="success" className="gap-1">
                            <Lock className="size-3.5" /> Aprovado
                          </Badge>
                        ) : (
                          <Badge variant="warning">Rascunho</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Exportar PDF"
                            onClick={() => {
                              const ok = exportarDocumentoOficialPdf(d);
                              if (!ok) toast.error("Permita pop-ups para o PDF.");
                            }}
                          >
                            <FileDown className="size-4" />
                          </Button>
                          {!aprovado && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir rascunho"
                              onClick={() => setParaExcluir(d)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir rascunho"
        descricao={
          <>
            Excluir <strong>{paraExcluir?.titulo}</strong>? Só rascunhos podem
            ser excluídos.
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
