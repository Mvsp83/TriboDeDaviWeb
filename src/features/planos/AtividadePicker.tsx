import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { TipoBloco, type Atividade, type HistoricoAtividade } from "@/types";
import { Input } from "@/components/ui/input";

interface Props {
  atividades: Atividade[];
  tipo: number;
  selecionadasIds: number[];
  historico: Map<number, HistoricoAtividade>;
  onAdd: (atividade: Atividade) => void;
}

// Autocomplete leve: filtra a biblioteca pelo tipo do bloco (Outro mostra
// todas), exclui as já escolhidas e casa por nome/tags. Clicar adiciona.
export function AtividadePicker({
  atividades,
  tipo,
  selecionadasIds,
  historico,
  onAdd,
}: Props) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const fecharTimer = useRef<number>(0);

  const opcoes = useMemo(() => {
    const q = texto.trim().toLocaleLowerCase("pt-BR");
    const sel = new Set(selecionadasIds);
    return atividades
      .filter((a) => tipo === TipoBloco.Outro || a.tipo === tipo)
      .filter((a) => !sel.has(a.id))
      .filter(
        (a) =>
          !q ||
          a.nome.toLocaleLowerCase("pt-BR").includes(q) ||
          (a.tags ?? "").toLocaleLowerCase("pt-BR").includes(q),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      .slice(0, 20);
  }, [atividades, tipo, selecionadasIds, texto]);

  function rotulo(a: Atividade): string {
    const h = historico.get(a.id);
    if (!h) return a.nome;
    const d = new Date(h.ultimaData);
    const data = Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return `${a.nome} — visto ${data} (${h.vezes}x)`;
  }

  function adicionar(a: Atividade) {
    onAdd(a);
    setTexto("");
    setAberto(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Adicionar atividade da biblioteca"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => {
            fecharTimer.current = window.setTimeout(() => setAberto(false), 120);
          }}
          className="pl-9"
        />
      </div>

      {aberto && opcoes.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md"
          onMouseDown={() => window.clearTimeout(fecharTimer.current)}
        >
          {opcoes.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                // Impede o input de perder o foco (e a lista de fechar) antes do
                // clique — senão a seleção "não acontece" no clique.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => adicionar(a)}
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-secondary"
              >
                {rotulo(a)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
