import { useState } from "react";
import { DownloadCloud, Loader2, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useSincronizarTudo } from "@/features/sincronizacao/sincronizacaoApi";
import {
  useMatricularAno,
  type MatriculaLoteResultado,
} from "@/features/inscricoes/inscricoesApi";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Importação inicial: traz os alunos das planilhas dos polos (uma por polo)
// para o cadastro. Opcionalmente já os marca como ativos num ano (matrícula em
// lote). É a virada do "banco em planilhas" para o sistema.
export function ImportacaoPage() {
  const importar = useSincronizarTudo();
  const matricular = useMatricularAno();
  const anoAtual = new Date().getFullYear();

  const [ativar, setAtivar] = useState(true);
  const [ano, setAno] = useState(anoAtual);
  const [resultado, setResultado] = useState<
    { mensagem: string; matr?: MatriculaLoteResultado } | null
  >(null);

  const processando = importar.isPending || matricular.isPending;

  async function executar() {
    setResultado(null);
    try {
      const imp = await importar.mutateAsync();
      if (!imp.sucesso) {
        toast.error(imp.mensagem);
        return;
      }
      let matr: MatriculaLoteResultado | undefined;
      if (ativar) matr = await matricular.mutateAsync(ano);
      setResultado({ mensagem: imp.mensagem, matr });
      toast.success("Importação concluída.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Falha na importação.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Importação inicial de alunos</h1>
        <p className="text-sm text-muted-foreground">
          Traz os alunos das planilhas dos polos (uma por polo) para o cadastro.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Cada aluno é criado ou atualizado (sem duplicar — casa por CPF e nome).
          No <span className="font-medium text-foreground">teste</span>, marque
          "ativos no ano" ({anoAtual}). Na{" "}
          <span className="font-medium text-foreground">produção</span>, deixe
          desmarcado: os alunos entram no cadastro, mas{" "}
          <span className="font-medium text-foreground">inativos</span> — cada
          família rematricula para o ano novo. Pode rodar mais de uma vez.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <label className="flex items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 size-4 accent-primary"
              checked={ativar}
              onChange={(e) => setAtivar(e.target.checked)}
            />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">
                Marcar os importados como ativos no ano
              </span>{" "}
              — cria a matrícula do ano (torna-os ativos no ciclo).
            </span>
          </label>

          {ativar && (
            <div className="max-w-[10rem]">
              <Label className="mb-1.5">Ano</Label>
              <Input
                type="number"
                value={ano}
                min={2020}
                max={anoAtual + 1}
                onChange={(e) => setAno(Number(e.target.value))}
              />
            </div>
          )}

          <Button onClick={executar} disabled={processando}>
            {processando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <DownloadCloud className="size-4" />
            )}
            Importar das planilhas dos polos
          </Button>
        </CardContent>
      </Card>

      {resultado && (
        <Card>
          <CardContent className="space-y-2 p-5 text-sm">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              Resultado
            </p>
            <p className="whitespace-pre-line text-muted-foreground">
              {resultado.mensagem}
            </p>
            {resultado.matr && (
              <p className="text-muted-foreground">
                Ativados em {ano}:{" "}
                <span className="font-medium text-foreground">
                  {resultado.matr.criadas}
                </span>{" "}
                nova(s) matrícula(s) · {resultado.matr.jaMatriculados} já
                estavam · {resultado.matr.totalAlunos} alunos no total.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
