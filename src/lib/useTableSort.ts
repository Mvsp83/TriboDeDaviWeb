import { useCallback, useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
export type SortValue = string | number | Date | null | undefined;

function comparar(a: SortValue, b: SortValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // nulos por último
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "pt-BR", { numeric: true });
}

// Ordenação de tabela reutilizável: recebe os itens e um acessor (coluna →
// valor) e devolve a lista ordenada + o estado para os cabeçalhos clicáveis.
export function useTableSort<T>(
  items: T[],
  accessor: (item: T, key: string) => SortValue,
  inicial?: { key: string; dir?: SortDir },
) {
  const [sortKey, setSortKey] = useState<string | null>(inicial?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDir>(inicial?.dir ?? "asc");

  const sorted = useMemo(() => {
    if (!sortKey) return items;
    const fator = sortDir === "asc" ? 1 : -1;
    return [...items].sort(
      (a, b) => comparar(accessor(a, sortKey), accessor(b, sortKey)) * fator,
    );
  }, [items, accessor, sortKey, sortDir]);

  const toggleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  return { sorted, sortKey, sortDir, toggleSort };
}
