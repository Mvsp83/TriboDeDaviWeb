// Persistência da configuração de graduação. Hoje é localStorage (chave única);
// o hook de API (graduacaoApi) já isola isto para, no futuro, plugar um
// /api/ConfiguracaoGraduacao sem mexer nas telas.
import {
  type ConfigGraduacao,
  type ProgramaFaixa,
  type Grau,
  novoId,
} from "./tipos";
import { CONFIG_DEFAULT } from "./seed";

const CHAVE = "tribo:graduacao";

// Migra um grau de um formato antigo (criterioExame único) para o novo
// (lista de criterios). Também garante os arrays esperados.
function normalizarGrau(g: Grau & { criterioExame?: string }): Grau {
  const criterios =
    g.criterios && g.criterios.length > 0
      ? g.criterios
      : g.criterioExame
        ? [{ id: novoId(), texto: g.criterioExame, faixaEtariaId: null }]
        : [];
  return {
    id: g.id ?? novoId(),
    titulo: g.titulo ?? "",
    requisitos: g.requisitos ?? [],
    criterios,
  };
}

function normalizarPrograma(p: ProgramaFaixa): ProgramaFaixa {
  return {
    ...p,
    faixasEtarias: p.faixasEtarias ?? [],
    graus: (p.graus ?? []).map(normalizarGrau),
  };
}

// Mescla raso com o default: se uma versão antiga não tiver algum campo novo,
// ele entra do default em vez de ficar undefined. Também migra o formato dos
// graus/programas para o esquema atual.
function mesclar(bruto: Partial<ConfigGraduacao> | null): ConfigGraduacao {
  if (!bruto) return CONFIG_DEFAULT;
  return {
    versao: bruto.versao ?? CONFIG_DEFAULT.versao,
    posicoes: bruto.posicoes ?? CONFIG_DEFAULT.posicoes,
    golpesRestritos: bruto.golpesRestritos ?? CONFIG_DEFAULT.golpesRestritos,
    programas: (bruto.programas ?? CONFIG_DEFAULT.programas).map(normalizarPrograma),
  };
}

export function carregarConfig(): ConfigGraduacao {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return CONFIG_DEFAULT;
    return mesclar(JSON.parse(cru) as Partial<ConfigGraduacao>);
  } catch {
    return CONFIG_DEFAULT;
  }
}

export function salvarConfig(cfg: ConfigGraduacao): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(cfg));
  } catch {
    // Se o storage estiver cheio/indisponível, o erro sobe para quem chamou
    // decidir (toast). Não engolimos silenciosamente aqui de propósito.
    throw new Error("Não foi possível salvar neste navegador.");
  }
}
