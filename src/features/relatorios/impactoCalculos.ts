import type { Aluno, Aula, Presenca } from "@/types";
import type { Matricula } from "@/features/relatorios/impactoApi";

// Indicadores de impacto do projeto num ano. São os números que editais e
// prestações de contas pedem — e todos saem de dados que o sistema já coleta.

export interface FaixaEtaria {
  rotulo: string;
  quantidade: number;
}

export interface LinhaPolo {
  poloId: number;
  nome: string;
  alunos: number;
  aulas: number;
  frequencia: number | null; // % de presença; null quando não houve chamada
}

export interface Impacto {
  ano: number;
  atendidos: number;
  polos: number;
  aulas: number;
  frequenciaMedia: number | null;
  presencasRegistradas: number;
  faixasEtarias: FaixaEtaria[];
  porPolo: LinhaPolo[];
  bairros: { nome: string; quantidade: number }[];
  escolas: number;
  graduacoes: { nome: string; quantidade: number }[];
}

const FAIXAS_ETARIAS = [
  { rotulo: "Até 7 anos", min: 0, max: 7 },
  { rotulo: "8 a 10 anos", min: 8, max: 10 },
  { rotulo: "11 a 13 anos", min: 11, max: 13 },
  { rotulo: "14 a 17 anos", min: 14, max: 17 },
  { rotulo: "18 anos ou mais", min: 18, max: 200 },
];

// Idade no fim do ano de referência: mantém o número estável, em vez de mudar
// conforme o dia em que o relatório é gerado.
export function idadeNoAno(nascimentoIso: string, ano: number): number | null {
  const n = new Date(nascimentoIso);
  if (Number.isNaN(n.getTime())) return null;
  return ano - n.getFullYear();
}

function contarPor<T>(itens: T[], chave: (i: T) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const i of itens) {
    const k = chave(i);
    if (!k) continue;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function calcularImpacto({
  ano,
  matriculas,
  alunos,
  aulas,
  presencas,
  nomePolo,
  nomeFaixa,
}: {
  ano: number;
  matriculas: Matricula[];
  alunos: Aluno[];
  aulas: Aula[];
  presencas: Presenca[];
  nomePolo: (id: number) => string;
  nomeFaixa: (faixa: number) => string;
}): Impacto {
  // Base do relatório: todos os alunos ativos que o usuário enxerga. A matrícula
  // do ano, quando existe, é usada só para atribuir o polo daquele ano (o aluno
  // pode ter mudado de polo depois) — e NÃO para filtrar quem conta. Filtrar por
  // matrícula quebrava o relatório na transição: enquanto só parte dos alunos
  // tem matrícula (ex.: só os cadastrados pela web), ele mostrava apenas esses.
  const atendidosLista: Aluno[] = alunos;

  // Polo do ano vem da matrícula (o aluno pode ter mudado de polo depois).
  const poloDoAluno = new Map<number, number>(
    matriculas.map((m) => [m.alunoId, m.poloId]),
  );
  const poloDe = (a: Aluno) => poloDoAluno.get(a.id) ?? a.poloId;

  const aulasDoAno = aulas.filter(
    (a) => new Date(a.data).getFullYear() === ano,
  );
  const presencasDoAno = presencas.filter(
    (p) => new Date(p.data).getFullYear() === ano,
  );

  const presentes = presencasDoAno.filter((p) => p.estaPresente).length;
  const frequenciaMedia =
    presencasDoAno.length > 0
      ? Math.round((presentes * 100) / presencasDoAno.length)
      : null;

  // Faixas etárias
  const faixasEtarias = FAIXAS_ETARIAS.map((f) => ({
    rotulo: f.rotulo,
    quantidade: atendidosLista.filter((a) => {
      const i = idadeNoAno(a.dataNascimento, ano);
      return i != null && i >= f.min && i <= f.max;
    }).length,
  })).filter((f) => f.quantidade > 0);

  // Por polo: alunos, aulas e frequência
  const idsPolos = new Set<number>([
    ...atendidosLista.map(poloDe),
    ...aulasDoAno.map((a) => a.poloId),
  ]);

  const porPolo: LinhaPolo[] = [...idsPolos]
    .map((poloId) => {
      const presencasPolo = presencasDoAno.filter((p) => p.poloId === poloId);
      const presentesPolo = presencasPolo.filter((p) => p.estaPresente).length;
      return {
        poloId,
        nome: nomePolo(poloId),
        alunos: atendidosLista.filter((a) => poloDe(a) === poloId).length,
        aulas: aulasDoAno.filter((a) => a.poloId === poloId).length,
        frequencia:
          presencasPolo.length > 0
            ? Math.round((presentesPolo * 100) / presencasPolo.length)
            : null,
      };
    })
    .sort((a, b) => b.alunos - a.alunos || a.nome.localeCompare(b.nome, "pt-BR"));

  // Alcance territorial e escolar
  const bairros = [...contarPor(atendidosLista, (a) => a.bairro?.trim() || null)]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, "pt-BR"));

  const escolas = contarPor(atendidosLista, (a) => a.escola?.trim().toLowerCase() || null).size;

  const graduacoes = [...contarPor(atendidosLista, (a) => nomeFaixa(a.faixa))]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  return {
    ano,
    atendidos: atendidosLista.length,
    polos: porPolo.filter((p) => p.alunos > 0).length,
    aulas: aulasDoAno.length,
    frequenciaMedia,
    presencasRegistradas: presencasDoAno.length,
    faixasEtarias,
    porPolo,
    bairros,
    escolas,
    graduacoes,
  };
}
