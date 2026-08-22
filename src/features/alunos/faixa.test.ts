import { describe, expect, it } from "vitest";
import { faixaInfo } from "@/features/alunos/faixa";

// A API manda a faixa como número 0..40 (9 cores × 4 graus). O faixaInfo
// resolve a cor do intervalo e o grau dentro dela.
describe("faixaInfo", () => {
  it("resolve a cor base sem grau", () => {
    expect(faixaInfo(0).nome).toBe("Branca");
    expect(faixaInfo(20).nome).toBe("Verde");
    expect(faixaInfo(40).nome).toBe("Preta");
  });

  it("acrescenta o grau dentro da cor", () => {
    expect(faixaInfo(2).nome).toBe("Branca 2g");
    expect(faixaInfo(23).nome).toBe("Verde 3g");
  });

  it("a preta não recebe grau (é o topo)", () => {
    expect(faixaInfo(40).nome).toBe("Preta");
  });

  it("sempre devolve cores para o chip", () => {
    const info = faixaInfo(10);
    expect(info.cor).toMatch(/^#/);
    expect(info.texto).toMatch(/^#/);
  });
});
