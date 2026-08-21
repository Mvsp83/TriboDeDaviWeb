import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { useAuth } from "@/features/auth/AuthContext";
import { carregarPresencas } from "@/features/relatorios/fontes";

export interface Matricula {
  id: number;
  alunoId: number;
  ano: number;
  poloId: number;
  turma: number;
  ativa: boolean;
}

// Matrículas do ano — é o que responde "quantas crianças o projeto atendeu
// em 2026", número que todo edital pede. O cadastro de aluno sozinho não
// responde isso, porque ele não some quando a criança deixa o projeto.
export function useMatriculas(ano: number) {
  return useQuery({
    queryKey: ["matriculas", ano],
    queryFn: () =>
      apiGet<Matricula[] | null>(ApiRotas.matriculasDoAno(ano)).then((r) => r ?? []),
  });
}

// Presenças do período, para calcular a frequência média.
export function usePresencasDoAno() {
  const { sessao } = useAuth();
  const admin = sessao?.isAdministrador ?? false;

  return useQuery({
    queryKey: ["presencas-impacto", admin],
    queryFn: () => carregarPresencas(admin),
    staleTime: 5 * 60 * 1000,
  });
}
