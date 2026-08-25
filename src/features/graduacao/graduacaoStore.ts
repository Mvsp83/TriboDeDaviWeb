// Persistência da configuração de graduação. Hoje é localStorage (chave única);
// o hook de API (graduacaoApi) já isola isto para, no futuro, plugar um
// /api/ConfiguracaoGraduacao sem mexer nas telas.
import {
  type ConfigGraduacao,
  type ProgramaFaixa,
  type Grau,
  type ParametrosFaixa,
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

// Migra o parâmetro do formato antigo (semAdvertencias: boolean) para o novo
// (maxAdvertencias: number | null): exigia => 0 permitidas; não exigia => null.
function normalizarParametro(
  p: ParametrosFaixa & { semAdvertencias?: boolean },
): ParametrosFaixa {
  const maxAdvertencias =
    p.maxAdvertencias !== undefined
      ? p.maxAdvertencias
      : p.semAdvertencias
        ? 0
        : null;
  return {
    faixaBase: p.faixaBase,
    aulasMinimas: p.aulasMinimas ?? 0,
    mesesMinimos: p.mesesMinimos ?? 0,
    maxAdvertencias,
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
// graus/programas para o esquema atual e, quando a semente é ampliada (bump de
// versao), acrescenta o conteúdo NOVO da semente — sem sobrescrever o que o
// usuário já editou (une por id de posição e por faixaBase de programa).
function mesclar(bruto: Partial<ConfigGraduacao> | null): ConfigGraduacao {
  if (!bruto) return CONFIG_DEFAULT;

  const versaoGuardada = bruto.versao ?? 0;
  let posicoes = bruto.posicoes ?? [];
  let programas = (bruto.programas ?? []).map(normalizarPrograma);
  let golpes = bruto.golpesRestritos ?? [];

  // Migração aditiva: só quando a semente é mais nova que o guardado.
  if (versaoGuardada < CONFIG_DEFAULT.versao) {
    // Preenche a faixa recomendada nas posições da semente que ainda não têm
    // (sem tocar nas que o usuário já definiu).
    const recPorId = new Map(
      CONFIG_DEFAULT.posicoes.map((p) => [p.id, p.faixaRecomendada]),
    );
    posicoes = posicoes.map((p) =>
      p.faixaRecomendada == null && recPorId.get(p.id) != null
        ? { ...p, faixaRecomendada: recPorId.get(p.id) }
        : p,
    );
    const idsPos = new Set(posicoes.map((p) => p.id));
    posicoes = [
      ...posicoes,
      ...CONFIG_DEFAULT.posicoes.filter((p) => !idsPos.has(p.id)),
    ];
    const bases = new Set(programas.map((p) => p.faixaBase));
    programas = [
      ...programas,
      ...CONFIG_DEFAULT.programas
        .filter((p) => !bases.has(p.faixaBase))
        .map(normalizarPrograma),
    ];
    // Golpes: mantém os do usuário; para os da semente sem severidade editada,
    // preenche com a severidade oficial; acrescenta os que faltam.
    const porId = new Map(golpes.map((g) => [g.id, g]));
    const idsSemente = new Set(CONFIG_DEFAULT.golpesRestritos.map((g) => g.id));
    const daSemente = CONFIG_DEFAULT.golpesRestritos.map((sg) => {
      const atual = porId.get(sg.id);
      if (!atual) return sg;
      const temSev = Object.keys(atual.severidadePorDivisao ?? {}).length > 0;
      return temSev
        ? atual
        : { ...atual, severidadePorDivisao: sg.severidadePorDivisao };
    });
    const extras = golpes.filter((g) => !idsSemente.has(g.id));
    golpes = [...daSemente, ...extras];
  }

  return {
    versao: Math.max(versaoGuardada, CONFIG_DEFAULT.versao),
    posicoes: posicoes.length > 0 ? posicoes : CONFIG_DEFAULT.posicoes,
    golpesRestritos: golpes.length > 0 ? golpes : CONFIG_DEFAULT.golpesRestritos,
    programas: programas.length > 0 ? programas : CONFIG_DEFAULT.programas,
    // Parâmetros são do usuário; ausentes em configs antigas = lista vazia.
    parametros: (bruto.parametros ?? []).map(normalizarParametro),
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
