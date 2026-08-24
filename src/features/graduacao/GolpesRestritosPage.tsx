import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Plus, Trash2, ShieldAlert, Image as ImageIcon, Search } from "lucide-react";
import { useConfigGraduacao, useSalvarGolpes } from "./graduacaoApi";
import {
  DIVISOES,
  SEVERIDADE_LABEL,
  type GolpeRestrito,
  novoId,
} from "./tipos";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Ciclo de severidade ao clicar numa célula.
const CICLO: Record<string, string> = {
  normal: "gravissima",
  gravissima: "grave",
  grave: "normal",
};

// Cor da célula por severidade (mesma convenção da tabela oficial: vermelho =
// gravíssima, âmbar = grave, vazio = permitido).
function corSeveridade(sev: string): { bg: string; ponto: string } {
  if (sev === "gravissima") return { bg: "bg-red-600/10", ponto: "bg-red-600" };
  if (sev === "grave") return { bg: "bg-amber-500/10", ponto: "bg-amber-500" };
  return { bg: "", ponto: "bg-transparent border border-muted-foreground/30" };
}

function Celula({
  sev,
  onClick,
}: {
  sev: string;
  onClick: () => void;
}) {
  const c = corSeveridade(sev);
  return (
    <button
      type="button"
      onClick={onClick}
      title={SEVERIDADE_LABEL[sev]}
      className={`flex h-9 w-full items-center justify-center rounded ${c.bg} transition hover:bg-muted`}
    >
      <span className={`size-3 rounded-full ${c.ponto}`} />
    </button>
  );
}

export function GolpesRestritosPage() {
  const { data: cfg } = useConfigGraduacao();
  const salvar = useSalvarGolpes();

  const [golpes, setGolpes] = useState<GolpeRestrito[]>([]);
  const [sujo, setSujo] = useState(false);
  const [verTabela, setVerTabela] = useState(false);
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const visiveis = termo
    ? golpes.filter((g) => g.descricao.toLowerCase().includes(termo))
    : golpes;

  useEffect(() => {
    if (cfg) {
      setGolpes(structuredClone(cfg.golpesRestritos));
      setSujo(false);
    }
  }, [cfg]);

  function marcar(next: GolpeRestrito[]) {
    setGolpes(next);
    setSujo(true);
  }

  function ciclarCelula(golpeId: string, divisaoId: string) {
    marcar(
      golpes.map((g) => {
        if (g.id !== golpeId) return g;
        const atual = g.severidadePorDivisao[divisaoId] ?? "normal";
        const prox = CICLO[atual];
        const sev = { ...g.severidadePorDivisao };
        if (prox === "normal") delete sev[divisaoId];
        else sev[divisaoId] = prox;
        return { ...g, severidadePorDivisao: sev };
      }),
    );
  }

  function editarDescricao(golpeId: string, descricao: string) {
    marcar(golpes.map((g) => (g.id === golpeId ? { ...g, descricao } : g)));
  }

  function addGolpe() {
    marcar([
      ...golpes,
      { id: novoId(), descricao: "Novo golpe", severidadePorDivisao: {} },
    ]);
  }

  function removerGolpe(id: string) {
    marcar(golpes.filter((g) => g.id !== id));
  }

  async function salvarTudo() {
    try {
      await salvar.mutateAsync(golpes);
      setSujo(false);
      toast.success("Matriz de golpes salva neste navegador.");
    } catch {
      toast.error("Erro ao salvar a matriz.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <p>
          O que cada idade/faixa pode ou não fazer (golpes restritos da IBJJF).
          Clique numa célula para alternar{" "}
          <span className="font-medium text-foreground">permitido → gravíssima → grave</span>.
          As severidades vêm da tabela oficial 2024 —{" "}
          <span className="font-medium text-foreground">confira e ajuste</span> o que
          for necessário. Salvo neste navegador por enquanto.
        </p>
      </div>

      {/* Ações + legenda */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Button onClick={salvarTudo} disabled={salvar.isPending || !sujo}>
            <Save className="size-4" />
            {sujo ? "Salvar" : "Salvo"}
          </Button>
          <Button variant="outline" onClick={addGolpe}>
            <Plus className="size-4" />
            Adicionar golpe
          </Button>
          <Button variant="outline" onClick={() => setVerTabela((v) => !v)}>
            <ImageIcon className="size-4" />
            {verTabela ? "Ocultar" : "Ver"} tabela oficial
          </Button>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar golpe..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-red-600" /> Falta gravíssima
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-amber-500" /> Falta grave
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border border-muted-foreground/30" />{" "}
              Permitido
            </span>
          </div>
        </CardContent>
      </Card>

      {verTabela && (
        <Card>
          <CardContent className="p-3">
            <div className="overflow-x-auto">
              <a href="/golpes/matriz.webp" target="_blank" rel="noreferrer" title="Abrir tabela oficial em tamanho cheio">
                <img
                  src="/golpes/matriz.webp"
                  alt="Tabela oficial de golpes proibidos por idade/categoria (IBJJF)"
                  className="min-w-[900px] rounded"
                />
              </a>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Fonte: IBJJF — Golpes Proibidos (2024). Clique para abrir em tamanho cheio.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Matriz editável */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 min-w-[30rem] bg-card p-2 text-left font-medium">
                    Golpe / posição
                  </th>
                  {DIVISOES.map((d) => (
                    <th
                      key={d.id}
                      className="p-2 text-center text-xs font-medium text-muted-foreground"
                      title={d.label}
                    >
                      {d.curto}
                    </th>
                  ))}
                  <th className="w-10 p-2" />
                </tr>
              </thead>
              <tbody>
                {visiveis.map((g) => (
                  <tr key={g.id} className="border-b border-border/60">
                    <td className="sticky left-0 z-10 bg-card p-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                          {golpes.findIndex((x) => x.id === g.id) + 1}
                        </span>
                        <Input
                          value={g.descricao}
                          title={g.descricao}
                          onChange={(e) => editarDescricao(g.id, e.target.value)}
                          className="h-8 w-full"
                        />
                      </div>
                    </td>
                    {DIVISOES.map((d) => (
                      <td key={d.id} className="p-1.5">
                        <Celula
                          sev={g.severidadePorDivisao[d.id] ?? "normal"}
                          onClick={() => ciclarCelula(g.id, d.id)}
                        />
                      </td>
                    ))}
                    <td className="p-1.5 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        title="Remover golpe"
                        onClick={() => removerGolpe(g.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {visiveis.length === 0 && (
                  <tr>
                    <td colSpan={DIVISOES.length + 2} className="py-10 text-center text-muted-foreground">
                      {termo ? "Nenhum golpe encontrado." : "Nenhum golpe cadastrado."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
