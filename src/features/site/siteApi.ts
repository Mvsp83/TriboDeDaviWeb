import { useQuery } from "@tanstack/react-query";
import { ApiRotas } from "@/lib/apiRoutes";

// Números do site vindos do banco (crianças atendidas e polos). Usa fetch puro
// (sem o interceptor do axios) porque a home é pública e não pode ser
// redirecionada ao /login se a API falhar. Em caso de erro, devolve null e a
// tela cai no número estático de conteudoSite como fallback.
const base = import.meta.env.VITE_API_BASE_URL || "";

async function buscarData<T>(rota: string): Promise<T | null> {
  try {
    const res = await fetch(`${base}${rota}`);
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export interface EstatisticasSite {
  alunos: number | null;
  polos: number | null;
}

export function useEstatisticasSite() {
  return useQuery<EstatisticasSite>({
    queryKey: ["site-estatisticas"],
    queryFn: async () => {
      const [alunos, polos] = await Promise.all([
        buscarData<{ total: number }>(ApiRotas.alunosTotalPublico),
        buscarData<unknown[]>(ApiRotas.polosPublicos),
      ]);
      return {
        alunos: typeof alunos?.total === "number" ? alunos.total : null,
        polos: Array.isArray(polos) ? polos.length : null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
