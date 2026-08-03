import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { useAuth } from "@/features/auth/AuthContext";
import type { Aluno, Aniversariante, Aula, Polo } from "@/types";

export interface DashboardData {
  totalAlunos: number;
  totalPolos: number;
  totalAulas: number;
  aniversariantes: Aniversariante[];
}

export function useDashboard() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;
  const mes = new Date().getMonth() + 1;

  return useQuery({
    queryKey: ["dashboard", admin, mes],
    queryFn: async (): Promise<DashboardData> => {
      const [alunos, polos, aniversariantes, aulas] = await Promise.all([
        apiGet<Aluno[]>(admin ? ApiRotas.alunosGetAll : ApiRotas.alunosPorPolo),
        apiGet<Polo[]>(ApiRotas.polos),
        apiGet<Aniversariante[]>(ApiRotas.aniversariantes(mes)),
        apiGet<Aula[]>(admin ? ApiRotas.aulasGetAll : ApiRotas.aulasPorPolo),
      ]);

      return {
        totalAlunos: alunos?.length ?? 0,
        totalPolos: polos?.length ?? 0,
        totalAulas: aulas?.length ?? 0,
        aniversariantes: aniversariantes ?? [],
      };
    },
  });
}
