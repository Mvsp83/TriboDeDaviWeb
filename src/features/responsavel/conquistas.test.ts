import { describe, expect, it } from "vitest";
import {
  sequenciaAtual,
  calcularSelos,
  proximoSelo,
  type PresencaLite,
} from "@/features/responsavel/conquistas";

const p = (data: string, presente: boolean): PresencaLite => ({ data, presente });

describe("sequenciaAtual", () => {
  it("conta presenças consecutivas a partir da mais recente", () => {
    // desordenada de propósito — a função ordena por data desc
    const lista = [
      p("2026-03-01", true),
      p("2026-03-08", true),
      p("2026-03-15", true),
      p("2026-02-22", false),
    ];
    expect(sequenciaAtual(lista)).toBe(3);
  });

  it("é zero quando a aula mais recente foi falta", () => {
    const lista = [p("2026-03-01", true), p("2026-03-08", false)];
    expect(sequenciaAtual(lista)).toBe(0);
  });

  it("é zero sem presenças", () => {
    expect(sequenciaAtual([])).toBe(0);
  });
});

describe("calcularSelos", () => {
  it("conquista selos de total pelo resumo (histórico completo)", () => {
    const selos = calcularSelos({ presencas: 30, percentual: 80, totalAulas: 40 }, []);
    const conquistados = selos.filter((s) => s.conquistado).map((s) => s.id);
    expect(conquistados).toContain("total-10");
    expect(conquistados).toContain("total-25");
    expect(conquistados).not.toContain("total-50");
  });

  it("mostra progresso parcial rumo à meta", () => {
    const selos = calcularSelos({ presencas: 40, percentual: 80, totalAulas: 50 }, []);
    const cem = selos.find((s) => s.id === "total-100")!;
    expect(cem.conquistado).toBe(false);
    expect(cem.atual).toBe(40);
    expect(cem.meta).toBe(100);
  });

  it("assiduidade exige mínimo de aulas", () => {
    // 100% mas só 3 aulas → ainda não conquista
    const poucas = calcularSelos({ presencas: 3, percentual: 100, totalAulas: 3 }, []);
    expect(poucas.find((s) => s.id === "assiduidade-90")!.conquistado).toBe(false);
    // 95% com histórico suficiente → conquista
    const muitas = calcularSelos({ presencas: 19, percentual: 95, totalAulas: 20 }, []);
    expect(muitas.find((s) => s.id === "assiduidade-90")!.conquistado).toBe(true);
  });

  it("selos de sequência usam a sequência atual da lista", () => {
    const lista = Array.from({ length: 6 }, (_, i) =>
      p(`2026-03-${String(i + 1).padStart(2, "0")}`, true),
    );
    const selos = calcularSelos({ presencas: 6, percentual: 100, totalAulas: 6 }, lista);
    expect(selos.find((s) => s.id === "seq-5")!.conquistado).toBe(true);
    expect(selos.find((s) => s.id === "seq-10")!.conquistado).toBe(false);
  });
});

describe("proximoSelo", () => {
  it("aponta o selo com menor progresso restante", () => {
    const selos = calcularSelos({ presencas: 24, percentual: 50, totalAulas: 48 }, []);
    // presenças=24 → falta 1 para total-25 (o mais perto)
    expect(proximoSelo(selos)?.id).toBe("total-25");
  });

  it("é null quando tudo foi conquistado", () => {
    const lista = Array.from({ length: 12 }, (_, i) =>
      p(`2026-03-${String(i + 1).padStart(2, "0")}`, true),
    );
    const selos = calcularSelos({ presencas: 150, percentual: 100, totalAulas: 150 }, lista);
    expect(proximoSelo(selos)).toBeNull();
  });
});
