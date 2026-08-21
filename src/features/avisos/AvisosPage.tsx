import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Trash2, Loader2, Send } from "lucide-react";
import {
  useAvisos,
  useCriarAviso,
  useExcluirAviso,
} from "@/features/avisos/avisosApi";
import { ApiError } from "@/lib/api";
import { dataBR } from "@/lib/format";
import { PUBLICO_AVISO_LABEL, type Aviso } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AvisosPage() {
  const { data: avisos, isLoading } = useAvisos();
  const criar = useCriarAviso();
  const excluir = useExcluirAviso();

  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("1");
  const [paraExcluir, setParaExcluir] = useState<Aviso | null>(null);

  async function publicar() {
    if (!mensagem.trim()) {
      toast.warning("Escreva a mensagem do aviso.");
      return;
    }
    try {
      await criar.mutateAsync({
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        publicoAlvo: Number(publicoAlvo),
      });
      toast.success("Aviso publicado.");
      setTitulo("");
      setMensagem("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao publicar.");
    }
  }

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Aviso removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Avisos internos</h1>
        <p className="text-sm text-muted-foreground">
          O aviso aparece para o público-alvo ao entrar no sistema. Cada usuário
          pode dar "ciente" (some) ou adiar (reaparece no próximo login).
        </p>
      </div>

      {/* Novo aviso */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label className="mb-1.5">Título (opcional)</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Reunião"
              />
            </div>
            <div>
              <Label className="mb-1.5">Público-alvo</Label>
              <Select value={publicoAlvo} onValueChange={setPublicoAlvo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PUBLICO_AVISO_LABEL).map(([v, label]) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5">Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={3}
              placeholder="Ex.: Reunião dia 30/08 às 19h no polo Eça de Queiroz."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={publicar} disabled={criar.isPending}>
              {criar.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Publicar aviso
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Avisos publicados */}
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (avisos?.length ?? 0) === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Megaphone className="size-8" />
            <p className="text-sm">Nenhum aviso publicado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {avisos!.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.titulo || "Aviso"}</span>
                    <Badge variant="outline">
                      {PUBLICO_AVISO_LABEL[a.publicoAlvo] ?? "Todos"}
                    </Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {a.mensagem}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dataBR(a.dataCriacao)}
                    {a.criadoPor ? ` · ${a.criadoPor}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setParaExcluir(a)}
                  aria-label="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir aviso"
        descricao="Remover este aviso? Ele deixará de aparecer para todos."
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
