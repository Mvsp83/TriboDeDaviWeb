import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/lib/useTableSort";

interface Props {
  label: string;
  columnKey: string;
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (key: string) => void;
  className?: string;
}

// Cabeçalho de coluna clicável que ordena a tabela (asc → desc → asc).
export function SortableHead({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  className,
}: Props) {
  const ativo = sortKey === columnKey;
  const Icon = !ativo ? ChevronsUpDown : sortDir === "asc" ? ChevronUp : ChevronDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className="inline-flex select-none items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        <Icon
          className={cn("size-3.5", ativo ? "text-foreground" : "opacity-40")}
        />
      </button>
    </TableHead>
  );
}
