import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";

export const ORGAO = { diretoria: 0, conselho: 1 } as const;

export interface MembroGovernanca {
  id?: number;
  ano: number;
  orgao: number; // 0 = Diretoria, 1 = Conselho Fiscal
  cargo: string;
  nome: string;
  ordem: number;
}

export interface GovernancaPublica {
  ano: number;
  anos: number[];
  membros: MembroGovernanca[];
}

// Cargos fixos da diretoria (ordem = posição no site).
export const CARGOS_DIRETORIA = [
  "Presidente",
  "Vice-Presidente",
  "1º Secretário",
  "2º Secretário",
  "1º Tesoureiro",
  "2º Tesoureiro",
];

// Conselho fiscal: 3 titulares + 3 suplentes.
export const QTD_CONSELHO = 3;

// ── Admin ──────────────────────────────────────────────────────────────────
export function useAnosGovernanca() {
  return useQuery({
    queryKey: ["governanca-anos"],
    queryFn: () => apiGet<number[] | null>(ApiRotas.governancaAnos).then((r) => r ?? []),
  });
}

export function useMembrosGovernanca(ano: number) {
  return useQuery({
    queryKey: ["governanca", ano],
    queryFn: () =>
      apiGet<MembroGovernanca[] | null>(ApiRotas.governancaPorAno(ano)).then((r) => r ?? []),
    enabled: ano > 0,
  });
}

export function useSalvarGovernanca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ano, membros }: { ano: number; membros: MembroGovernanca[] }) =>
      apiPut(ApiRotas.governancaPorAno(ano), membros),
    onSuccess: (_d, { ano }) => {
      qc.invalidateQueries({ queryKey: ["governanca", ano] });
      qc.invalidateQueries({ queryKey: ["governanca-anos"] });
    },
  });
}

// ── Público (Transparência) ─────────────────────────────────────────────────
export function useGovernancaPublica(ano?: number) {
  return useQuery({
    queryKey: ["governanca-publica", ano ?? 0],
    queryFn: async (): Promise<GovernancaPublica> => {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const res = await fetch(`${base}${ApiRotas.governancaPublico(ano)}`);
        if (!res.ok) return { ano: 0, anos: [], membros: [] };
        const json = await res.json();
        return (json?.data as GovernancaPublica) ?? { ano: 0, anos: [], membros: [] };
      } catch {
        return { ano: 0, anos: [], membros: [] };
      }
    },
  });
}
