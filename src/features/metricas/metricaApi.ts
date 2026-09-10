import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { getToken } from "@/lib/token";

const base = import.meta.env.VITE_API_BASE_URL || "";

// Envia um evento de métrica (fire-and-forget). Nunca lança: métrica jamais
// pode atrapalhar a navegação do visitante. Ignora a equipe logada (token de
// admin) — as métricas medem o público do site, não o uso interno. O portal do
// responsável usa outro token (sessionStorage), então continua contando.
export function registrarEvento(evento: string, dimensao?: string) {
  if (getToken()) return;
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

  // Pageview a cada rota (registrarEvento já ignora a equipe logada).
  useEffect(() => {
    registrarEvento("pageview", location.pathname);
  }, [location.pathname]);

  // Uma vez por sessão do visitante: origem do tráfego e dispositivo.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("metrica_sessao")) return;
      sessionStorage.setItem("metrica_sessao", "1");
    } catch {
      /* sem sessionStorage: dispara uma vez por carga da página, tudo bem */
    }
    registrarEvento("origem", classificarOrigem());
    registrarEvento("dispositivo", classificarDispositivo());
  }, []);
}

// Origem do tráfego a partir do referrer. Obs.: apps como Instagram/WhatsApp
// costumam não enviar referrer, então boa parte do social aparece como "direto".
function classificarOrigem(): string {
  try {
    const ref = document.referrer;
    if (!ref) return "direto";
    const host = new URL(ref).hostname.toLowerCase();
    if (host.includes(location.hostname)) return "direto";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("whatsapp") || host === "wa.me") return "whatsapp";
    if (host.includes("facebook") || host.includes("fb.")) return "facebook";
    if (host.includes("google")) return "google";
    if (host.includes("bing")) return "bing";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com"))
      return "twitter";
    if (host.includes("linkedin")) return "linkedin";
    return "outro";
  } catch {
    return "direto";
  }
}

function classificarDispositivo(): string {
  const largura = window.innerWidth || 1024;
  if (largura < 768) return "celular";
  if (largura < 1024) return "tablet";
  return "desktop";
}

// Funil de inscrição: contabiliza cada etapa alcançada, uma vez por preenchimento
// (dedup por instância do formulário — voltar e avançar não conta de novo).
export function useRastrearEtapaInscricao(etapa: string) {
  const enviadas = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!etapa || enviadas.current.has(etapa)) return;
    enviadas.current.add(etapa);
    registrarEvento("inscricao_etapa", etapa);
  }, [etapa]);
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
  origem: ItemContagem[];
  dispositivos: ItemContagem[];
  funilInscricao: ItemContagem[];
}

export function useMetricaResumo(dias: number) {
  return useQuery({
    queryKey: ["metrica-resumo", dias],
    queryFn: () => apiGet<MetricaResumo>(ApiRotas.metricaResumo(dias)),
  });
}
