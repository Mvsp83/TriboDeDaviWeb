import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Check, Trash2, Inbox } from "lucide-react";
import {
  useMensagensContato,
  useMarcarLidaContato,
  useExcluirContato,
  type MensagemContato,
} from "@/features/contato/contatoApi";
import { dataHora } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function MensagensContatoPage() {
  const { data: mensagens = [], isLoading } = useMensagensContato();
  const marcarLida = useMarcarLidaContato();
  const excluir = useExcluirContato();

  const [soNaoLidas, setSoNaoLidas] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<MensagemContato | null>(null);

  const lista = useMemo(
    () => (soNaoLidas ? mensagens.filter((m) => !m.lida) : mensagens),
    [mensagens, soNaoLidas],
  );
  const naoLidas = mensagens.filter((m) => !m.lida).length;

  async function confirmarExclusao() {
    if (!paraExcluir) return;
    try {
      await excluir.mutateAsync(paraExcluir.id);
      toast.success("Mensagem removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover.");
    } finally {
      setParaExcluir(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Carregando…"
            : `${mensagens.length} mensagem(ns)${naoLidas > 0 ? ` · ${naoLidas} não lida(s)` : ""}`}
        </p>
        <div className="flex gap-2">
          <Button
            variant={soNaoLidas ? "default" : "outline"}
            size="sm"
            onClick={() => setSoNaoLidas((v) => !v)}
          >
            Só não lidas
          </Button>
        </div>
      </div>

      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}

      {!isLoading && lista.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Inbox className="size-8" />
            {soNaoLidas ? "Nenhuma mensagem não lida." : "Nenhuma mensagem ainda."}
          </CardContent>
        </Card>
      )}

      {!isLoading &&
        lista.map((m) => (
          <Card key={m.id} className={cn(!m.lida && "border-primary/40")}>
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{m.nome}</span>
                  {!m.lida && <Badge>Nova</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {dataHora(m.dataCriacao)}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="size-3.5" /> {m.email}
                  </a>
                )}
                {m.telefone && (
                  <a
                    href={`tel:${m.telefone.replace(/\D/g, "")}`}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="size-3.5" /> {m.telefone}
                  </a>
                )}
              </div>

              {m.assunto && (
                <p className="text-sm font-medium">{m.assunto}</p>
              )}
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {m.mensagem}
              </p>

              <div className="flex justify-end gap-2 pt-1">
                {!m.lida && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => marcarLida.mutate(m.id)}
                    disabled={marcarLida.isPending}
                  >
                    <Check className="size-4" /> Marcar como lida
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setParaExcluir(m)}
                >
                  <Trash2 className="size-4" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

      <ConfirmDialog
        aberto={paraExcluir !== null}
        onOpenChange={(o) => !o && setParaExcluir(null)}
        titulo="Excluir mensagem"
        descricao={
          <>
            Excluir a mensagem de <strong>{paraExcluir?.nome}</strong>?
          </>
        }
        confirmarLabel="Excluir"
        onConfirmar={confirmarExclusao}
        carregando={excluir.isPending}
      />
    </div>
  );
}
