import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GraduationCap, Printer, Pencil, Plus } from "lucide-react";
import { faixaInfo, OPCOES_FAIXA_BASE } from "@/features/alunos/faixa";
import { useConfigGraduacao } from "./graduacaoApi";
import { imprimirApostilaFaixa } from "./apostilaHtml";
import { type ProgramaFaixa } from "./tipos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Resumo numérico de um programa para o card da lista.
function resumo(prog: ProgramaFaixa) {
  const graus = prog.graus.length;
  const requisitos = prog.graus.reduce((s, g) => s + g.requisitos.length, 0);
  const criterios = prog.graus.reduce((s, g) => s + g.criterios.length, 0);
  return { graus, requisitos, criterios, idades: prog.faixasEtarias.length };
}

export function ProgramasPage() {
  const { data: cfg } = useConfigGraduacao();
  const navigate = useNavigate();

  const porBase = useMemo(
    () => new Map((cfg?.programas ?? []).map((p) => [p.faixaBase, p])),
    [cfg],
  );

  function editar(base: number) {
    navigate(`/graduacao/programas/editor/${base}`);
  }

  async function gerarApostila(prog: ProgramaFaixa) {
    if (!cfg) return;
    if (!(await imprimirApostilaFaixa(prog, cfg, "todas"))) {
      toast.error("Permita pop-ups para gerar a apostila.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <GraduationCap className="mt-0.5 size-4 shrink-0" />
        <p>
          Programas de graduação por faixa. Abra um para montar os graus, os
          requisitos e os critérios, ou gere a apostila em PDF.{" "}
          <span className="font-medium text-foreground">Salvo neste navegador</span>{" "}
          por enquanto.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {OPCOES_FAIXA_BASE.map((f) => {
          const info = faixaInfo(f.valor);
          const prog = porBase.get(f.valor);
          const r = prog ? resumo(prog) : null;
          return (
            <Card
              key={f.valor}
              className="cursor-pointer overflow-hidden transition hover:ring-2 hover:ring-primary/30"
              onClick={() => editar(f.valor)}
            >
              {/* Banda com a cor real da faixa */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: info.cor, color: info.texto }}
              >
                <span className="text-lg font-bold">{info.nome}</span>
                {prog?.tag && (
                  <span className="text-right text-xs uppercase tracking-wide opacity-80">
                    {prog.tag}
                  </span>
                )}
              </div>

              <CardContent className="space-y-3 p-4">
                {prog && r ? (
                  <>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">{r.graus}</span> graus
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{r.requisitos}</span>{" "}
                        requisitos
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{r.criterios}</span>{" "}
                        critérios
                      </span>
                      {r.idades > 0 && (
                        <span>
                          <span className="font-medium text-foreground">{r.idades}</span>{" "}
                          faixas etárias
                        </span>
                      )}
                    </div>
                    {/* stopPropagation: os botões não disparam o clique do card. */}
                    <div
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button size="sm" onClick={() => editar(f.valor)}>
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => gerarApostila(prog)}
                      >
                        <Printer className="size-3.5" />
                        Apostila
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Sem programa ainda.
                    </span>
                    <Button size="sm" variant="outline" onClick={() => editar(f.valor)}>
                      <Plus className="size-3.5" />
                      Criar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
