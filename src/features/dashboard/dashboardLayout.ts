// Layout do Dashboard configurável por usuário. Guarda quais widgets aparecem
// e em que ordem. Fica no localStorage por login — a API .NET não tem endpoint
// de preferências (mesmo caso do Financeiro e do Padrão de Documentos), então a
// config vale por navegador. Para sincronizar entre dispositivos seria preciso
// uma rota na API.

export interface DashboardConfig {
  // Todos os ids conhecidos, na ordem em que aparecem (e no personalizador).
  ordem: string[];
  // Subconjunto de `ordem` que está oculto.
  ocultos: string[];
}

const PREFIXO = "tribo-dashboard:";

// Ajusta a config ao catálogo atual: acrescenta widgets novos (visíveis, no
// fim) e descarta ids que não existem mais. Assim uma versão futura com mais
// widgets não deixa a config "presa" no que foi salvo antes.
export function normalizar(cfg: DashboardConfig, todosIds: string[]): DashboardConfig {
  const conhecidos = new Set(todosIds);
  const ordem = (cfg.ordem ?? []).filter((id) => conhecidos.has(id));
  for (const id of todosIds) if (!ordem.includes(id)) ordem.push(id);
  const ocultos = (cfg.ocultos ?? []).filter((id) => conhecidos.has(id));
  return { ordem, ocultos };
}

export function carregarConfig(login: string, todosIds: string[]): DashboardConfig {
  let base: DashboardConfig = { ordem: [], ocultos: [] };
  try {
    const raw = localStorage.getItem(PREFIXO + login);
    if (raw) base = JSON.parse(raw) as DashboardConfig;
  } catch {
    // JSON inválido: cai no padrão (todos visíveis, ordem do catálogo).
  }
  return normalizar(base, todosIds);
}

export function salvarConfig(login: string, cfg: DashboardConfig): void {
  try {
    localStorage.setItem(PREFIXO + login, JSON.stringify(cfg));
  } catch {
    // Sem localStorage (modo privado/cota): segue sem persistir.
  }
}
