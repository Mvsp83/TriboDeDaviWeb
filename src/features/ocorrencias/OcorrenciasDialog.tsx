import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle, MessageSquare, Trash2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import { TIPO_OCORRENCIA, STATUS_RECADO, statusRecadoLabel } from "@/lib/ocorrencias";
import {
  useOcorrenciasAluno,
  useCriarOcorrencia,
  useExcluirOcorrencia,
} from "@/features/ocorrencias/ocorrenciasApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  alunoId: number | null;
  alunoNome: string;
}

// Registro de advertências (comportamento) e recados do professor sobre um
// aluno — o que aparece no Portal do Responsável.
export function OcorrenciasDialog({ aberto, onOpenChange, alunoId, alunoNome }: Props) {
  const { data: lista, isLoading } = useOcorrenciasAluno(aberto ? alunoId : null);
  const criar = useCriarOcorrencia();
  const excluir = useExcluirOcorrencia(alunoId ?? 0);

  const [tipo, setTipo] = useState<number>(TIPO_OCORRENCIA.Advertencia);
  const [status, setStatus] = useState("0");
  const [texto, setTexto] = useState("");

  const ehAdvertencia = tipo === TIPO_OCORRENCIA.Advertencia;

  async function salvar() {
    if (alunoId == null) return;
    if (ehAdvertencia && !texto.trim()) {
      toast.warning("Escreva o motivo da advertência.");
      return;
    }
    try {
      await criar.mutateAsync({
        alunoId,
        tipo,
        status: ehAdvertencia ? 0 : Number(status),
        texto: texto.trim(),
      });
      toast.success(ehAdvertencia ? "Advertência registrada." : "Recado registrado.");
      setTexto("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Não foi possível salvar.");
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comportamento e recados</DialogTitle>
          <DialogDescription>
            {alunoNome} — aparece para a família no Portal do Responsável.
          </DialogDescription>
        </DialogHeader>

        {/* Novo registro */}
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={ehAdvertencia ? "default" : "outline"}
              size="sm"
              onClick={() => setTipo(TIPO_OCORRENCIA.Advertencia)}
            >
              <AlertTriangle className="size-4" /> Advertência
            </Button>
            <Button
              type="button"
              variant={!ehAdvertencia ? "default" : "outline"}
              size="sm"
              onClick={() => setTipo(TIPO_OCORRENCIA.Recado)}
            >
              <MessageSquare className="size-4" /> Recado
            </Button>
          </div>

          {!ehAdvertencia && (
            <div>
              <Label className="mb-1.5">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_RECADO.map((s, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="mb-1.5">
              {ehAdvertencia ? "Motivo da advertência" : "Recado (opcional)"}
            </Label>
            <Textarea
              rows={3}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                ehAdvertencia
                  ? "ex: Desrespeitou um colega durante o treino."
                  : "ex: Treinar a fuga de quadril em casa."
              }
            />
          </div>

          <Button onClick={salvar} disabled={criar.isPending}>
            {criar.isPending && <Loader2 className="size-4 animate-spin" />}
            Registrar
          </Button>
        </div>

        {/* Histórico */}
        <div>
          <p className="mb-2 text-sm font-medium">Registros</p>
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : (lista ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum registro ainda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(lista ?? []).map((o) => {
                const adv = o.tipo === TIPO_OCORRENCIA.Advertencia;
                return (
                  <li
                    key={o.id}
                    className={`rounded-md border p-2.5 text-sm ${
                      adv ? "border-destructive/30 bg-destructive/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {adv ? "Advertência" : statusRecadoLabel(o.status)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{dataBR(o.data)}</span>
                        <button
                          type="button"
                          onClick={() => excluir.mutate(o.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    {o.texto && (
                      <p className="mt-1 text-muted-foreground">{o.texto}</p>
                    )}
                    {o.registradoPor && (
                      <p className="mt-1 text-xs text-muted-foreground/70">por {o.registradoPor}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
