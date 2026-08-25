import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Printer } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { useAlunos } from "@/features/alunos/alunosApi";
import { usePolos } from "@/features/polos/polosApi";
import { useGraduacoes } from "@/features/graduacoes/graduacoesApi";
import { useEventosCalendario } from "@/features/calendario/calendarioApi";
import { abrirParaImpressao } from "@/lib/impressaoDocumento";
import {
  montarRascunhoAtividades,
  rascunhoParaHtml,
} from "@/features/administrativo/relatorioAtividadesDraft";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function GerarRascunhoDialog({
  aberto,
  onOpenChange,
}: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const anoAtual = new Date().getFullYear();

  const [ano, setAno] = useState(anoAtual);
  const [texto, setTexto] = useState("");

  const { data: alunos } = useAlunos(admin);
  const { data: polos } = usePolos();
  const { data: graduacoes } = useGraduacoes(ano);
  const { data: eventos } = useEventosCalendario(ano);

  const anos = [anoAtual, anoAtual - 1, anoAtual - 2, anoAtual - 3];

  function gerar() {
    setTexto(
      montarRascunhoAtividades({
        ano,
        alunos: alunos ?? [],
        polos: polos ?? [],
        graduacoes: graduacoes ?? [],
        eventos: eventos ?? [],
      }),
    );
    toast.success("Rascunho gerado a partir dos dados do sistema.");
  }

  function baixarPdf() {
    if (!texto.trim()) return;
    const ok = abrirParaImpressao({
      titulo: `Relatório de Atividades — ${ano} (rascunho)`,
      subtitulo: "Rascunho gerado a partir dos dados do sistema",
      corpoHtml: rascunhoParaHtml(texto),
    });
    if (!ok) toast.error("Permita pop-ups para baixar o PDF.");
  }

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar rascunho do Relatório de Atividades</DialogTitle>
          <DialogDescription>
            Monta um rascunho a partir dos dados do sistema (alunos, polos,
            graduações e eventos do ano). Revise e complemente antes de baixar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <Label className="mb-1.5">Ano</Label>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={gerar}>
            <Sparkles className="size-4" />
            {texto ? "Refazer rascunho" : "Gerar rascunho"}
          </Button>
        </div>

        <Textarea
          rows={16}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Clique em 'Gerar rascunho' para montar o texto a partir dos dados do ano."
          className="font-mono text-sm"
        />

        <p className="text-xs text-muted-foreground">
          Depois de ajustar, use <strong>Baixar PDF</strong> e envie o arquivo em{" "}
          <strong>Novo documento</strong> para guardá-lo no sistema.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={baixarPdf} disabled={!texto.trim()}>
            <Printer className="size-4" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
