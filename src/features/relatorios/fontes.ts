import { apiGet } from "@/lib/api";
import { ApiRotas } from "@/lib/apiRoutes";
import { faixaInfo } from "@/features/alunos/faixa";
import {
  TIPO_BLOCO_LABEL,
  STATUS_PLANO_LABEL,
  ROLE_LABEL,
  TipoBloco,
  type Aluno,
  type Aula,
  type Presenca,
  type PlanoDeAula,
  type Atividade,
  type Usuario,
} from "@/types";

export interface FiltroCtx {
  inicio: string | null; // yyyy-MM-dd
  fim: string | null;
  turma: number | null;
  poloId: number | null;
}

export interface Coluna {
  id: string;
  titulo: string;
  padrao?: boolean;
  valor: (o: unknown) => string;
}

export interface Fonte {
  id: string;
  nome: string;
  somenteAdmin?: boolean;
  colunas: Coluna[];
  carregar: (f: FiltroCtx) => Promise<unknown[]>;
  data?: (o: unknown) => Date | null;
  turma?: (o: unknown) => number | null;
  polo?: (o: unknown) => number | null;
  usaPeriodo?: boolean;
  usaTurma?: boolean;
  usaPolo?: boolean;
}

const dataFmt = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
};
const horaFmt = (t: string) =>
  !t ? "" : (t.includes(".") ? t.split(".").pop()! : t).slice(0, 5);
const simNao = (b: boolean) => (b ? "Sim" : "Não");

function idade(iso: string): string {
  const nasc = new Date(iso);
  if (Number.isNaN(nasc.getTime())) return "";
  const hoje = new Date();
  let i = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) i--;
  return String(i);
}

function dentroPeriodo(dataIso: string, f: FiltroCtx): boolean {
  const d = new Date(dataIso);
  if (f.inicio && d < new Date(f.inicio)) return false;
  if (f.fim) {
    const fim = new Date(f.fim);
    fim.setDate(fim.getDate() + 1);
    if (d >= fim) return false;
  }
  return true;
}

async function carregarPresencas(admin: boolean): Promise<Presenca[]> {
  if (admin) return apiGet<Presenca[]>(ApiRotas.presencasGetAll);
  const aulas = await apiGet<Aula[]>(ApiRotas.aulasPorPolo);
  const listas = await Promise.all(
    aulas.map((a) =>
      apiGet<Presenca[]>(ApiRotas.presencaPorAula(a.id)).catch(() => []),
    ),
  );
  return listas.flat();
}

// Monta as fontes de relatório. `nomePolo` resolve o nome do polo pelo id.
export function montarFontes(
  admin: boolean,
  nomePolo: (id: number) => string,
): Fonte[] {
  return [
    {
      id: "alunos",
      nome: "Alunos",
      turma: (o) => (o as Aluno).turma,
      polo: (o) => (o as Aluno).poloId,
      carregar: async () => {
        const alunos = await apiGet<Aluno[]>(
          admin ? ApiRotas.alunosGetAll : ApiRotas.alunosPorPolo,
        );
        return [...alunos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      },
      colunas: [
        { id: "nome", titulo: "Nome", padrao: true, valor: (o) => (o as Aluno).nome },
        { id: "nascimento", titulo: "Nascimento", padrao: true, valor: (o) => dataFmt((o as Aluno).dataNascimento) },
        { id: "idade", titulo: "Idade", padrao: true, valor: (o) => idade((o as Aluno).dataNascimento) },
        { id: "faixa", titulo: "Faixa", padrao: true, valor: (o) => faixaInfo((o as Aluno).faixa).nome },
        { id: "turma", titulo: "Turma", padrao: true, valor: (o) => String((o as Aluno).turma) },
        { id: "polo", titulo: "Polo", padrao: true, valor: (o) => nomePolo((o as Aluno).poloId) },
        { id: "celular", titulo: "Celular", valor: (o) => (o as Aluno).celular ?? "" },
        { id: "responsavel", titulo: "Responsável", valor: (o) => (o as Aluno).responsavel ?? "" },
        { id: "rg", titulo: "RG", valor: (o) => (o as Aluno).rg ?? "" },
        { id: "cpf", titulo: "CPF", valor: (o) => (o as Aluno).cpf ?? "" },
        { id: "endereco", titulo: "Endereço", valor: (o) => (o as Aluno).endereco ?? "" },
        { id: "bairro", titulo: "Bairro", valor: (o) => (o as Aluno).bairro ?? "" },
        { id: "cidade", titulo: "Cidade", valor: (o) => (o as Aluno).cidade ?? "" },
        { id: "escola", titulo: "Escola", valor: (o) => (o as Aluno).escola ?? "" },
        { id: "periodo", titulo: "Período escolar", valor: (o) => (o as Aluno).periodo ?? "" },
        { id: "peso", titulo: "Peso (kg)", valor: (o) => (o as Aluno).peso?.toString() ?? "" },
      ],
    },
    {
      id: "aulas",
      nome: "Aulas",
      data: (o) => new Date((o as Aula).data),
      turma: (o) => (o as Aula).turma,
      polo: (o) => (o as Aula).poloId,
      carregar: () =>
        apiGet<Aula[]>(admin ? ApiRotas.aulasGetAll : ApiRotas.aulasPorPolo),
      colunas: [
        { id: "data", titulo: "Data", padrao: true, valor: (o) => dataFmt((o as Aula).data) },
        { id: "inicio", titulo: "Início", padrao: true, valor: (o) => horaFmt((o as Aula).horaInicio) },
        { id: "fim", titulo: "Fim", padrao: true, valor: (o) => horaFmt((o as Aula).horaFim) },
        { id: "turma", titulo: "Turma", padrao: true, valor: (o) => String((o as Aula).turma) },
        { id: "polo", titulo: "Polo", padrao: true, valor: (o) => nomePolo((o as Aula).poloId) },
        { id: "presencaSalva", titulo: "Presença registrada", valor: (o) => simNao((o as Aula).presencaSalva) },
      ],
    },
    {
      id: "presencas",
      nome: "Presenças",
      data: (o) => new Date((o as Presenca).data),
      polo: (o) => (o as Presenca).poloId,
      carregar: () => carregarPresencas(admin),
      colunas: [
        { id: "data", titulo: "Data", padrao: true, valor: (o) => dataFmt((o as Presenca).data) },
        { id: "aluno", titulo: "Aluno", padrao: true, valor: (o) => (o as Presenca).nomeAluno },
        { id: "presente", titulo: "Presente", padrao: true, valor: (o) => simNao((o as Presenca).estaPresente) },
        { id: "polo", titulo: "Polo", valor: (o) => nomePolo((o as Presenca).poloId) },
        { id: "obs", titulo: "Observações", valor: (o) => (o as Presenca).observacoes ?? "" },
      ],
    },
    {
      id: "planos",
      nome: "Planos de Aula",
      data: (o) => new Date((o as PlanoDeAula).dataPrevista),
      turma: (o) => (o as PlanoDeAula).turma,
      polo: (o) => (o as PlanoDeAula).poloId,
      carregar: () =>
        apiGet<PlanoDeAula[]>(admin ? ApiRotas.planosGetAll : ApiRotas.planosPorPolo),
      colunas: [
        { id: "data", titulo: "Data", padrao: true, valor: (o) => dataFmt((o as PlanoDeAula).dataPrevista) },
        { id: "titulo", titulo: "Título", padrao: true, valor: (o) => (o as PlanoDeAula).titulo },
        { id: "turma", titulo: "Turma", padrao: true, valor: (o) => String((o as PlanoDeAula).turma) },
        { id: "status", titulo: "Status", padrao: true, valor: (o) => STATUS_PLANO_LABEL[(o as PlanoDeAula).status] },
        { id: "polo", titulo: "Polo", padrao: true, valor: (o) => nomePolo((o as PlanoDeAula).poloId) },
        { id: "objetivo", titulo: "Objetivo", valor: (o) => (o as PlanoDeAula).objetivo ?? "" },
        { id: "duracao", titulo: "Duração (min)", valor: (o) => String((o as PlanoDeAula).duracaoTotalMinutos) },
        {
          id: "planejado",
          titulo: "Planejado (min)",
          valor: (o) => String((o as PlanoDeAula).blocos.reduce((s, b) => s + b.duracaoMinutos, 0)),
        },
        { id: "blocos", titulo: "Blocos", valor: (o) => String((o as PlanoDeAula).blocos.length) },
      ],
    },
    {
      id: "atividades",
      nome: "Atividades",
      carregar: async () => {
        const ativ = await apiGet<Atividade[]>(ApiRotas.atividadesGetAll);
        return [...ativ].sort((a, b) => a.tipo - b.tipo || a.nome.localeCompare(b.nome, "pt-BR"));
      },
      colunas: [
        { id: "nome", titulo: "Nome", padrao: true, valor: (o) => (o as Atividade).nome },
        { id: "tipo", titulo: "Tipo", padrao: true, valor: (o) => TIPO_BLOCO_LABEL[(o as Atividade).tipo] },
        { id: "tags", titulo: "Tags", padrao: true, valor: (o) => (o as Atividade).tags ?? "" },
        { id: "principio", titulo: "Princípio", valor: (o) => (o as Atividade).principio ?? "" },
        { id: "referencia", titulo: "Referência bíblica", valor: (o) => (o as Atividade).referenciaBiblica ?? "" },
        { id: "video", titulo: "Vídeo", valor: (o) => (o as Atividade).videoUrl ?? "" },
        { id: "descricao", titulo: "Descrição", valor: (o) => (o as Atividade).descricao ?? "" },
      ],
    },
    {
      id: "frequencia",
      nome: "Frequência por Aluno",
      usaPeriodo: true,
      polo: (o) => (o as FrequenciaLinha).poloId,
      carregar: async (f) => {
        const presencas = (await carregarPresencas(admin)).filter((p) =>
          dentroPeriodo(p.data, f),
        );
        const grupos = new Map<number, FrequenciaLinha>();
        for (const p of presencas) {
          let l = grupos.get(p.alunoId);
          if (!l) {
            l = { nomeAluno: p.nomeAluno, poloId: p.poloId, registros: 0, presencas: 0 };
            grupos.set(p.alunoId, l);
          }
          l.registros += 1;
          if (p.estaPresente) l.presencas += 1;
        }
        return [...grupos.values()].sort((a, b) =>
          a.nomeAluno.localeCompare(b.nomeAluno, "pt-BR"),
        );
      },
      colunas: [
        { id: "aluno", titulo: "Aluno", padrao: true, valor: (o) => (o as FrequenciaLinha).nomeAluno },
        { id: "polo", titulo: "Polo", padrao: true, valor: (o) => nomePolo((o as FrequenciaLinha).poloId) },
        { id: "registros", titulo: "Aulas registradas", padrao: true, valor: (o) => String((o as FrequenciaLinha).registros) },
        { id: "presencas", titulo: "Presenças", padrao: true, valor: (o) => String((o as FrequenciaLinha).presencas) },
        { id: "faltas", titulo: "Faltas", padrao: true, valor: (o) => String((o as FrequenciaLinha).registros - (o as FrequenciaLinha).presencas) },
        {
          id: "percentual",
          titulo: "% Presença",
          padrao: true,
          valor: (o) => {
            const l = o as FrequenciaLinha;
            return l.registros === 0 ? "-" : `${Math.round((l.presencas * 100) / l.registros)}%`;
          },
        },
      ],
    },
    {
      id: "atividades-aplicadas",
      nome: "Atividades mais Aplicadas",
      usaPeriodo: true,
      usaTurma: true,
      usaPolo: true,
      carregar: async (f) => {
        const [planos, atividades] = await Promise.all([
          apiGet<PlanoDeAula[]>(admin ? ApiRotas.planosGetAll : ApiRotas.planosPorPolo),
          apiGet<Atividade[]>(ApiRotas.atividadesGetAll),
        ]);
        const filtrados = planos.filter((p) => {
          if (!dentroPeriodo(p.dataPrevista, f)) return false;
          if (f.turma != null && p.turma !== f.turma) return false;
          if (admin && f.poloId != null && p.poloId !== f.poloId) return false;
          return true;
        });

        const info = new Map(atividades.map((a) => [a.id, a]));
        const usos = new Map<number, { vezes: number; planos: Set<number>; ultima: string }>();
        for (const p of filtrados) {
          for (const b of p.blocos) {
            for (const a of b.atividades) {
              let u = usos.get(a.atividadeId);
              if (!u) {
                u = { vezes: 0, planos: new Set(), ultima: p.dataPrevista };
                usos.set(a.atividadeId, u);
              }
              u.vezes += 1;
              u.planos.add(p.id);
              if (new Date(p.dataPrevista) > new Date(u.ultima)) u.ultima = p.dataPrevista;
            }
          }
        }

        return [...usos.entries()]
          .map(([id, u]) => {
            const a = info.get(id);
            return {
              nome: a?.nome ?? `Atividade #${id}`,
              tipo: a?.tipo ?? TipoBloco.Outro,
              vezes: u.vezes,
              planos: u.planos.size,
              ultima: u.ultima,
            } as AtividadeAplicadaLinha;
          })
          .sort((a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome, "pt-BR"));
      },
      colunas: [
        { id: "nome", titulo: "Atividade", padrao: true, valor: (o) => (o as AtividadeAplicadaLinha).nome },
        { id: "tipo", titulo: "Tipo", padrao: true, valor: (o) => TIPO_BLOCO_LABEL[(o as AtividadeAplicadaLinha).tipo] },
        { id: "vezes", titulo: "Vezes aplicada", padrao: true, valor: (o) => String((o as AtividadeAplicadaLinha).vezes) },
        { id: "planos", titulo: "Planos", padrao: true, valor: (o) => String((o as AtividadeAplicadaLinha).planos) },
        { id: "ultima", titulo: "Última aplicação", padrao: true, valor: (o) => dataFmt((o as AtividadeAplicadaLinha).ultima) },
      ],
    },
    {
      id: "usuarios",
      nome: "Usuários",
      somenteAdmin: true,
      carregar: async () => {
        const usuarios = await apiGet<Usuario[]>(ApiRotas.usuariosGetAll);
        return [...usuarios].sort((a, b) => a.login.localeCompare(b.login, "pt-BR"));
      },
      colunas: [
        { id: "login", titulo: "Login", padrao: true, valor: (o) => (o as Usuario).login },
        { id: "email", titulo: "E-mail", padrao: true, valor: (o) => (o as Usuario).email },
        { id: "papel", titulo: "Papel", padrao: true, valor: (o) => ROLE_LABEL[(o as Usuario).role] ?? "" },
        { id: "polo", titulo: "Polo", padrao: true, valor: (o) => (o as Usuario).poloNome ?? nomePolo((o as Usuario).poloId ?? 0) },
      ],
    },
  ];
}

interface FrequenciaLinha {
  nomeAluno: string;
  poloId: number;
  registros: number;
  presencas: number;
}

interface AtividadeAplicadaLinha {
  nome: string;
  tipo: number;
  vezes: number;
  planos: number;
  ultima: string;
}
