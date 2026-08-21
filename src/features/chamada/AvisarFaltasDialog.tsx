import { MessageCircle, PhoneOff, Check } from "lucide-react";
import { useState } from "react";
import { linkWhatsApp, mensagemFalta } from "@/lib/avisoResponsavel";
import type { Aluno } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Depois de salvar a chamada, oferece avisar os responsáveis dos ausentes.
// Abre o WhatsApp com o texto pronto — quem confere e envia é o professor.
export function AvisarFaltasDialog({
  aberto,
  onOpenChange,
  ausentes,
  dataAula,
  onConcluir,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  ausentes: Aluno[];
  dataAula: string;
  onConcluir: () => void;
}) {
  // Marca quem já foi avisado nesta sessão, para o professor não se perder na lista.
  const [avisados, setAvisados] = useState<Set<number>>(new Set());

  function avisar(aluno: Aluno) {
    const link = linkWhatsApp(
      aluno.celular,
      mensagemFalta({
        nomeAluno: aluno.nome,
        nomeResponsavel: aluno.responsavel,
        data: dataAula,
      }),
    );
    if (!link) return;
    window.open(link, "_blank", "noopener,noreferrer");
    setAvisados((s) => new Set(s).add(aluno.id));
  }

  const comTelefone = ausentes.filter((a) => linkWhatsApp(a.celular, "x"));
  const semTelefone = ausentes.filter((a) => !linkWhatsApp(a.celular, "x"));

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avisar os responsáveis?</DialogTitle>
          <DialogDescription>
            {ausentes.length} aluno(s) faltaram. Um toque abre o WhatsApp com a
            mensagem pronta — você confere e envia.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {comTelefone.map((a) => {
            const jaAvisado = avisados.has(a.id);
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.nome}</p>
                  {a.responsavel && (
                    <p className="truncate text-xs text-muted-foreground">
                      {a.responsavel}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={jaAvisado ? "outline" : "default"}
                  onClick={() => avisar(a)}
                  className="shrink-0"
                >
                  {jaAvisado ? <Check className="size-4" /> : <MessageCircle className="size-4" />}
                  {jaAvisado ? "Avisado" : "Avisar"}
                </Button>
              </li>
            );
          })}

          {semTelefone.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2"
            >
              <p className="truncate text-sm text-muted-foreground">{a.nome}</p>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <PhoneOff className="size-3.5" /> sem celular
              </span>
            </li>
          ))}
        </ul>

        {semTelefone.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Cadastre o celular do responsável em Alunos para poder avisar.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onConcluir}>
            {avisados.size > 0 ? "Concluir" : "Agora não"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
