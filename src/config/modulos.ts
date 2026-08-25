// Módulos comerciais da plataforma. Um "módulo" agrupa várias features do
// sistema para fins de contratação: a conta (tenant) contrata um conjunto de
// módulos, e isso decide o que aparece no menu e o que cada rota libera.
//
// Fonte da verdade da CONTRATAÇÃO é o backend (claim "Modulos" no JWT). Aqui só
// declaramos o catálogo e as regras de leitura. O gate visual é UX: a API
// precisa validar o mesmo no servidor.

export type ModuloId =
  | "core"
  | "graduacao"
  | "captacao"
  | "financeiro"
  | "relacionamento";

export interface Modulo {
  nome: string;
  descricao: string;
}

// Catálogo. "core" é a base: acompanha todos os planos e nunca é escondido.
export const MODULOS: Record<ModuloId, Modulo> = {
  core: {
    nome: "Gestão & Operação",
    descricao:
      "Alunos, matrícula, chamada, presenças, frequência, aulas e planejamento.",
  },
  graduacao: {
    nome: "Graduação Pro",
    descricao:
      "Programas de graduação, posições, golpes restritos, apostilas e certificados.",
  },
  captacao: {
    nome: "Captação & Impacto",
    descricao:
      "Doações, doadores, relatório de impacto e transparência pública.",
  },
  financeiro: {
    nome: "Financeiro & Contábil",
    descricao:
      "Extratos, aplicações, DRE, balanço, patrimônio e documentos oficiais.",
  },
  relacionamento: {
    nome: "Relacionamento",
    descricao:
      "Portal do responsável, avisos, calendário e notificações às famílias.",
  },
};

export const MODULO_IDS = Object.keys(MODULOS) as ModuloId[];

export function isModuloId(valor: string): valor is ModuloId {
  return (MODULO_IDS as string[]).includes(valor);
}

// Interpreta a claim "Modulos" do JWT (lista separada por vírgula) numa lista
// de ModuloId válidos, ignorando entradas desconhecidas.
export function parseModulos(raw: string | undefined | null): ModuloId[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(isModuloId);
}
