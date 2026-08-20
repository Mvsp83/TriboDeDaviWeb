import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Save, FileDown, CheckCircle2, Lock, Loader2 } from "lucide-react";
import {
  useDocumentoOficial,
  useSalvarDocumentoOficial,
  useAprovarDocumentoOficial,
} from "@/features/documentosOficiais/documentosOficiaisApi";
import {
  OFICIO_DEFAULT,
  RECIBO_DEFAULT,
  TIPO_DOC_LABEL,
  type OficioConteudo,
  type ReciboConteudo,
} from "@/features/documentosOficiais/tipos";
import { exportarDocumentoOficialPdf } from "@/features/documentosOficiais/documentosOficiaisPdf";
import { valorPorExtenso } from "@/features/documentosOficiais/valorExtenso";
import { paraInputDate } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { TIPO_DOC_OFICIAL, STATUS_DOC, type DocumentoOficial } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DocumentoOficialEditorPage() {
  const { id, tipo: tipoParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const existenteId = id ? Number(id) : undefined;

  const { data: doc, isLoading } = useDocumentoOficial(existenteId);
  const salvar = useSalvarDocumentoOficial();
  const aprovar = useAprovarDocumentoOficial();

  const tipo = doc ? doc.tipo : tipoParam === "recibo" ? 1 : 0;
  const isRecibo = tipo === TIPO_DOC_OFICIAL.Recibo;
  const travado = doc?.status === STATUS_DOC.Aprovado;

  const [dataDocumento, setDataDocumento] = useState(
    paraInputDate(new Date().toISOString()),
  );
  const [oficio, setOficio] = useState<OficioConteudo>(OFICIO_DEFAULT);
  const [recibo, setRecibo] = useState<ReciboConteudo>(RECIBO_DEFAULT);
  const [confirmarAprovar, setConfirmarAprovar] = useState(false);

  // Carrega o documento existente no formulário.
  useEffect(() => {
    if (!doc) return;
    setDataDocumento(paraInputDate(doc.dataDocumento));
    try {
      const c = JSON.parse(doc.conteudo || "{}");
      if (doc.tipo === TIPO_DOC_OFICIAL.Recibo)
        setRecibo({ ...RECIBO_DEFAULT, ...c });
      else setOficio({ ...OFICIO_DEFAULT, ...c });
    } catch {
      /* conteúdo inválido: mantém defaults */
    }
  }, [doc]);

  function montarDoc(): Partial<DocumentoOficial> {
    const titulo = isRecibo
      ? `Recibo — ${recibo.pagador || "sem pagador"}`
      : `Ofício — ${oficio.destinatario || "sem destinatário"}`;
    return {
      id: existenteId,
      tipo,
      dataDocumento,
      titulo,
      conteudo: JSON.stringify(isRecibo ? recibo : oficio),
    };
  }

  async function onSalvar(): Promise<DocumentoOficial | null> {
    try {
      const salvo = await salvar.mutateAsync(montarDoc());
      toast.success("Rascunho salvo.");
      if (!existenteId && salvo?.id)
        navigate(`/documentos-oficiais/editor/${salvo.id}`, { replace: true });
      return salvo;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar.");
      return null;
    }
  }

  async function onAprovar() {
    setConfirmarAprovar(false);
    // Salva o conteúdo mais recente antes de numerar.
    const salvo = await onSalvar();
    if (!salvo?.id) return;
    try {
      const aprovado = await aprovar.mutateAsync(salvo.id);
      toast.success(`Documento aprovado: nº ${aprovado.numeroFormatado}.`);
      navigate(`/documentos-oficiais/editor/${aprovado.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao aprovar.");
    }
  }

  function onExportar() {
    const preview: DocumentoOficial = {
      id: existenteId ?? 0,
      tipo,
      status: doc?.status ?? 0,
      ano: doc?.ano ?? 0,
      numero: doc?.numero ?? 0,
      numeroFormatado: doc?.numeroFormatado ?? "",
      dataDocumento,
      titulo: "",
      conteudo: JSON.stringify(isRecibo ? recibo : oficio),
      dataAprovacao: doc?.dataAprovacao ?? null,
    };
    const ok = exportarDocumentoOficialPdf(preview);
    if (!ok) toast.error("Permita pop-ups para exportar o PDF.");
  }

  const voltar = () =>
    location.key !== "default"
      ? navigate(-1)
      : navigate("/documentos-oficiais");

  const podeAprovar = useMemo(() => {
    if (isRecibo) return recibo.pagador.trim() && recibo.valor > 0;
    return oficio.destinatario.trim() && oficio.corpo.trim();
  }, [isRecibo, recibo, oficio]);

  if (existenteId && isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={voltar}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">
            {travado ? "" : existenteId ? "Editar " : "Novo "}
            {TIPO_DOC_LABEL[tipo]}
          </h1>
          {travado ? (
            <Badge variant="success" className="gap-1">
              <Lock className="size-3.5" /> Aprovado · nº {doc?.numeroFormatado}
            </Badge>
          ) : (
            <Badge variant="warning">Rascunho</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportar}>
            <FileDown className="size-4" /> Exportar PDF
          </Button>
          {!travado && (
            <>
              <Button
                variant="outline"
                onClick={onSalvar}
                disabled={salvar.isPending}
              >
                {salvar.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Salvar rascunho
              </Button>
              <Button
                onClick={() => setConfirmarAprovar(true)}
                disabled={!podeAprovar || aprovar.isPending}
              >
                <CheckCircle2 className="size-4" /> Aprovar
              </Button>
            </>
          )}
        </div>
      </div>

      {travado && (
        <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          Documento aprovado e numerado oficialmente — não pode mais ser
          alterado. Use "Exportar PDF" para gerar o arquivo.
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5">Data do documento</Label>
              <Input
                type="date"
                value={dataDocumento}
                disabled={travado}
                onChange={(e) => setDataDocumento(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Local</Label>
              <Input
                value={isRecibo ? recibo.local : oficio.local}
                disabled={travado}
                onChange={(e) =>
                  isRecibo
                    ? setRecibo({ ...recibo, local: e.target.value })
                    : setOficio({ ...oficio, local: e.target.value })
                }
              />
            </div>
          </div>

          {isRecibo ? (
            <ReciboCampos recibo={recibo} setRecibo={setRecibo} travado={travado} />
          ) : (
            <OficioCampos oficio={oficio} setOficio={setOficio} travado={travado} />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        aberto={confirmarAprovar}
        onOpenChange={setConfirmarAprovar}
        titulo="Aprovar e numerar oficialmente?"
        descricao={
          <>
            Ao aprovar, o sistema atribui o <strong>número oficial</strong> e o
            documento <strong>não poderá mais ser alterado nem excluído</strong>
            . Esta ação é <strong>irreversível</strong>. Deseja continuar?
          </>
        }
        confirmarLabel="Aprovar"
        destrutivo={false}
        carregando={salvar.isPending || aprovar.isPending}
        onConfirmar={onAprovar}
      />
    </div>
  );
}

function OficioCampos({
  oficio,
  setOficio,
  travado,
}: {
  oficio: OficioConteudo;
  setOficio: (o: OficioConteudo) => void;
  travado: boolean;
}) {
  const set = (campo: keyof OficioConteudo, valor: string) =>
    setOficio({ ...oficio, [campo]: valor });
  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5">Destinatário (A/C)</Label>
        <Input
          value={oficio.destinatario}
          disabled={travado}
          onChange={(e) => set("destinatario", e.target.value)}
          placeholder="Ex.: Sr. Rodrigo"
        />
      </div>
      <div>
        <Label className="mb-1.5">Saudação</Label>
        <Input
          value={oficio.saudacao}
          disabled={travado}
          onChange={(e) => set("saudacao", e.target.value)}
        />
      </div>
      <div>
        <Label className="mb-1.5">Corpo do ofício</Label>
        <Textarea
          value={oficio.corpo}
          disabled={travado}
          onChange={(e) => set("corpo", e.target.value)}
          rows={10}
          placeholder="Separe os parágrafos com uma linha em branco."
        />
      </div>
      <div>
        <Label className="mb-1.5">Fecho</Label>
        <Textarea
          value={oficio.fecho}
          disabled={travado}
          onChange={(e) => set("fecho", e.target.value)}
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1.5">Assinante</Label>
          <Input
            value={oficio.assinante}
            disabled={travado}
            onChange={(e) => set("assinante", e.target.value)}
          />
        </div>
        <div>
          <Label className="mb-1.5">Cargo</Label>
          <Input
            value={oficio.cargo}
            disabled={travado}
            onChange={(e) => set("cargo", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function ReciboCampos({
  recibo,
  setRecibo,
  travado,
}: {
  recibo: ReciboConteudo;
  setRecibo: (r: ReciboConteudo) => void;
  travado: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5">Pagador (de quem recebemos)</Label>
          <Input
            value={recibo.pagador}
            disabled={travado}
            onChange={(e) => setRecibo({ ...recibo, pagador: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-1.5">CPF/CNPJ do pagador (opcional)</Label>
          <Input
            value={recibo.documentoPagador}
            disabled={travado}
            onChange={(e) =>
              setRecibo({ ...recibo, documentoPagador: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label className="mb-1.5">Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={recibo.valor || ""}
            disabled={travado}
            onChange={(e) => {
              const v = Number(e.target.value) || 0;
              // Gera o valor por extenso automaticamente (campo editável).
              setRecibo({ ...recibo, valor: v, valorExtenso: valorPorExtenso(v) });
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5">Valor por extenso</Label>
          <Input
            value={recibo.valorExtenso}
            disabled={travado}
            onChange={(e) =>
              setRecibo({ ...recibo, valorExtenso: e.target.value })
            }
          />
        </div>
      </div>

      <div>
        <Label className="mb-1.5">Referente a</Label>
        <Textarea
          value={recibo.referente}
          disabled={travado}
          onChange={(e) => setRecibo({ ...recibo, referente: e.target.value })}
          rows={3}
          placeholder="Ex.: doação para o evento de graduação de 2026"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="mb-1.5">Assinante (quem emite)</Label>
          <Input
            value={recibo.assinante}
            disabled={travado}
            onChange={(e) => setRecibo({ ...recibo, assinante: e.target.value })}
          />
        </div>
        <div>
          <Label className="mb-1.5">CPF/CNPJ do emitente (opcional)</Label>
          <Input
            value={recibo.documentoAssinante}
            disabled={travado}
            onChange={(e) =>
              setRecibo({ ...recibo, documentoAssinante: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}
