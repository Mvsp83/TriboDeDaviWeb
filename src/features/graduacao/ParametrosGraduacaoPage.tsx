import { useState } from "react";
import { toast } from "sonner";
import { Save, ListChecks } from "lucide-react";
import {
  useConfigGraduacao,
  useSalvarParametros,
} from "@/features/graduacao/graduacaoApi";
import type { ParametrosFaixa } from "@/features/graduacao/tipos";
import { OPCOES_FAIXA_BASE, faixaInfo } from "@/features/alunos/faixa";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function ParametrosGraduacaoPage() {
  const { data: cfg } = useConfigGraduacao();
  const salvar = useSalvarParametros();

  const [linhas, setLinhas] = useState<ParametrosFaixa[]>(() =>
    OPCOES_FAIXA_BASE.map(({ valor }) => {
      const p = cfg?.parametros.find((x) => x.faixaBase === valor);
      return {
        faixaBase: valor,
        aulasMinimas: p?.aulasMinimas ?? 0,
        mesesMinimos: p?.mesesMinimos ?? 0,
        semAdvertencias: p?.semAdvertencias ?? false,
      };
    }),
  );

  function atualizar(
    faixaBase: number,
    campo: keyof ParametrosFaixa,
    valor: number | boolean,
  ) {
    setLinhas((ls) =>
      ls.map((l) => (l.faixaBase === faixaBase ? { ...l, [campo]: valor } : l)),
    );
  }

  async function salvarTudo() {
    try {
      await salvar.mutateAsync(linhas);
      toast.success("Parâmetros salvos.");
    } catch {
      toast.error("Não foi possível salvar.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <ListChecks className="mt-0.5 size-4 shrink-0" />
        <p>
          Defina, por faixa, o que o aluno precisa cumprir para ser sinalizado{" "}
          <span className="font-medium text-foreground">apto ao exame</span> no
          cadastro e na chamada. As contagens valem{" "}
          <span className="font-medium text-foreground">
            desde a última graduação
          </span>{" "}
          (ou desde a primeira presença, se ainda não graduou). Valor{" "}
          <span className="font-medium text-foreground">0</span> = não exige.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={salvarTudo} disabled={salvar.isPending}>
          <Save className="size-4" />
          Salvar parâmetros
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faixa</TableHead>
                <TableHead className="w-40">Aulas mínimas</TableHead>
                <TableHead className="w-40">Tempo mínimo (meses)</TableHead>
                <TableHead className="w-44">Sem advertências</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => {
                const info = faixaInfo(l.faixaBase);
                return (
                  <TableRow key={l.faixaBase}>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: info.cor, color: info.texto }}
                      >
                        {info.nome}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={l.aulasMinimas}
                        onChange={(e) =>
                          atualizar(
                            l.faixaBase,
                            "aulasMinimas",
                            Math.max(0, Number(e.target.value) || 0),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={l.mesesMinimos}
                        onChange={(e) =>
                          atualizar(
                            l.faixaBase,
                            "mesesMinimos",
                            Math.max(0, Number(e.target.value) || 0),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={l.semAdvertencias ? "1" : "0"}
                        onValueChange={(v) =>
                          atualizar(l.faixaBase, "semAdvertencias", v === "1")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Não exige</SelectItem>
                          <SelectItem value="1">Exige</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
