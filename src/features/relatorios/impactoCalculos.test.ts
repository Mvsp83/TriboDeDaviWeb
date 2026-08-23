import { describe, expect, it } from "vitest";
import { calcularImpacto } from "@/features/relatorios/impactoCalculos";
import type { Aluno, Aula, Presenca } from "@/types";
import type { Matricula } from "@/features/relatorios/impactoApi";

// Fábricas mínimas — só os campos que o cálculo usa.
const aluno = (id: number, over: Partial<Aluno> = {}): Aluno =>
  ({
    id,
    nome: `Aluno ${id}`,
    dataNascimento: "2015-01-01",
    faixa: 0,
    turma: 1,
    poloId: 1,
    bairro: "Centro",
    escola: "Escola X",
    ...over,
  }) as Aluno;

const base = {
  ano: 2026,
  nomePolo: (id: number) => `Polo ${id}`,
  nomeFaixa: (f: number) => `Faixa ${f}`,
  aulas: [] as Aula[],
  presencas: [] as Presenca[],
};

describe("calcularImpacto — base de atendidos", () => {
  it("conta TODOS os alunos, mesmo quando só alguns têm matrícula", () => {
    // Regressão: antes, ter 1 matrícula fazia o relatório mostrar só o(s)
    // matriculado(s). Agora a base é o cadastro inteiro.
    const alunos = [aluno(1), aluno(2), aluno(3)];
    const matriculas: Matricula[] = [
      { id: 1, alunoId: 1, ano: 2026, poloId: 1, turma: 1, ativa: true },
    ];

    const r = calcularImpacto({ ...base, alunos, matriculas });

    expect(r.atendidos).toBe(3);
  });

  it("sem nenhuma matrícula, conta o cadastro todo", () => {
    const alunos = [aluno(1), aluno(2)];
    const r = calcularImpacto({ ...base, alunos, matriculas: [] });
    expect(r.atendidos).toBe(2);
  });

  it("usa a matrícula do ano para atribuir o polo daquele ano", () => {
    // Aluno cadastrado no polo 1, mas matriculado no polo 2 neste ano →
    // deve ser contado no polo 2.
    const alunos = [aluno(1, { poloId: 1 })];
    const matriculas: Matricula[] = [
      { id: 1, alunoId: 1, ano: 2026, poloId: 2, turma: 1, ativa: true },
    ];

    const r = calcularImpacto({ ...base, alunos, matriculas });

    const polo2 = r.porPolo.find((p) => p.poloId === 2);
    expect(polo2?.alunos).toBe(1);
    expect(r.porPolo.find((p) => p.poloId === 1)).toBeUndefined();
  });
});
