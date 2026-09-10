import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { getToken } from "@/lib/token";

const base = import.meta.env.VITE_API_BASE_URL || "";

// Envia um evento de métrica (fire-and-forget). Nunca lança: métrica jamais
// pode atrapalhar a navegação do visitante.
export function registrarEvento(evento: string, dimensao?: string) {
  try {
    const body = JSON.stringify({ evento, dimensao: dimensao ?? null });
    void fetch(`${base}${ApiRotas.metricaEvento}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true, // sobrevive à navegação/fechamento da aba
    }).catch(() => {});
  } catch {
    /* ignora */
  }
}

// Contabiliza um pageview a cada mudança de rota — SÓ para visitantes anônimos
// (sem token). Assim os "acessos ao site" refletem o público, não o uso interno
// da equipe logada. Montar uma vez, dentro do Router.
export function useRastrearAcessos() {
  const location = useLocation();
  useEffect(() => {
    if (getToken()) return; // equipe logada não conta como acesso ao site
    registrarEvento("pageview", location.pathname);
  }, [location.pathname]);
}

export interface SerieDia {
  data: string;
  valor: number;
}
export interface ItemContagem {
  rotulo: string;
  valor: number;
}
export interface MetricaResumo {
  dias: number;
  visitas: number;
  doarCliques: number;
  inscricoesConcluidas: number;
  acessosResponsavel: number;
  visitasPorDia: SerieDia[];
  topPaginas: ItemContagem[];
  topDavizinho: ItemContagem[];
}

export function useMetricaResumo(dias: number) {
  return useQuery({
    queryKey: ["metrica-resumo", dias],
    queryFn: () => apiGet<MetricaResumo>(ApiRotas.metricaResumo(dias)),
  });
}
