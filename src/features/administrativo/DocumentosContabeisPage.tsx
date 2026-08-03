import { useRef, useState, type ReactNode } from "react";
import { Upload, Download, Trash2, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  useDocumentos,
  useUploadDocumento,
  useExcluirDocumento,
  baixarDocumento,
} from "@/features/administrativo/documentosApi";
import { ApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import type { CategoriaDocumento, DocumentoArquivo } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EXTENSOES_ACEITAS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt";
const TAMANHO_MAX = 20 * 1024 * 1024; // 20 MB, igual ao limite da API

function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  categoria: CategoriaDocumento;
  titulo: string;
  descricao: string;
  acoesExtras?: ReactNode;
}

// Tela reutilizável de armazenamento de documentos no Drive (DRE, Balanço,
// Relatório de Atividades). Upload/listagem/download/exclusão via API.
export function DocumentosContabeisPage({
  categoria,
  titulo,
  descricao,
  acoesExtras,
}: Props) {
  const { data: documentos, isLoading, isError, error } = useDocumentos(categoria);
  const upload = useUploadDocumento(categoria);
  const excluir = useExcluirDocumento(categoria);

  const inputRef = useRef<HTMLInputElement>(null);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] = useState<DocumentoArquivo | null>(null);

  function abrirSeletor() {
    inputRef.current?.click();
  }

  async function onArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo depois
    if (!arquivo) return;

    if (arquivo.size > TAMANHO_MAX) {
      toast.error("O arquivo excede o limite de 20 MB.");
      return;
    }

    try {
      await upload.mutateAsync(arquivo);
      toast.success("Documento enviado com sucesso!");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível enviar o documento.",
      );
    }
  }

  async function onBaixar(doc: DocumentoArquivo) {
    setBaixandoId(doc.id);
    try {
      await baixarDocumento(doc.id, doc.nome);
    } catch {
      toast.error("Não foi possível baixar o documento.");
    } finally {
      setBaixandoId(null);
    }
  }

  async function onConfirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Documento excluído.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Não foi possível excluir o documento.",
      );
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{titulo}</h1>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
        <div className="flex items-center gap-2">
          {acoesExtras}
          <input
            ref={inputRef}
            type="file"
            accept={EXTENSOES_ACEITAS}
            className="hidden"
            onChange={onArquivoSelecionado}
          />
          <Button onClick={abrirSeletor} disabled={upload.isPending}>
            {upload.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Novo documento
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {error instanceof ApiError
                ? error.message
                : "Não foi possível carregar os documentos."}
            </div>
          ) : (documentos?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <FileText className="size-8" />
              <p className="text-sm">Nenhum documento armazenado ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos!.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.nome}</TableCell>
                    <TableCell>{dataBR(doc.dataCriacao)}</TableCell>
                    <TableCell>{tamanhoLegivel(doc.tamanhoBytes)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Baixar"
                        onClick={() => onBaixar(doc)}
                        disabled={baixandoId === doc.id}
                      >
                        {baixandoId === doc.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => setParaExcluir(doc)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(aberto) => !aberto && setParaExcluir(null)}
        titulo="Excluir documento"
        descricao={
          <>
            Excluir <strong>{paraExcluir?.nome}</strong> do Drive? Esta ação não
            pode ser desfeita.
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={onConfirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
