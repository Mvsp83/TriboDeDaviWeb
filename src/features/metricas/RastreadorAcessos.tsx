import { useRastrearAcessos } from "@/features/metricas/metricaApi";

// Componente invisível: contabiliza os pageviews do site (visitantes anônimos)
// a cada mudança de rota. Renderizado uma vez, dentro do Router.
export function RastreadorAcessos() {
  useRastrearAcessos();
  return null;
}
