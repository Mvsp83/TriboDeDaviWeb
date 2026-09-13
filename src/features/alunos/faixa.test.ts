import { describe, expect, it } from "vitest";
import { faixaInfo, mudouDeCor, proximaCorBase } from "@/features/alunos/faixa";

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

// Certificado só na troca de cor.
describe("mudouDeCor", () => {
  it("é verdadeiro quando troca a cor", () => {
    expect(mudouDeCor(4, 5)).toBe(true); // Branca 4g → Cinza
    expect(mudouDeCor(9, 10)).toBe(true); // Cinza 4g → Amarela
    expect(mudouDeCor(35, 40)).toBe(true); // Marrom → Preta
  });

  it("é falso quando avança só de grau (mesma cor)", () => {
    expect(mudouDeCor(0, 1)).toBe(false); // Branca → Branca 1g
    expect(mudouDeCor(20, 23)).toBe(false); // Verde → Verde 3g
  });
});

// Próxima cor bifurca por público: criança segue branca→cinza→…→verde→azul;
// adulto segue branca→azul→roxa→marrom→preta (pula as cores infantis).
describe("proximaCorBase", () => {
  it("criança: branca → cinza e verde → azul", () => {
    expect(proximaCorBase(0, false)).toBe(5); // Branca → Cinza
    expect(proximaCorBase(2, false)).toBe(5); // Branca 2g → Cinza
    expect(proximaCorBase(20, false)).toBe(25); // Verde → Azul (ao virar adulto)
  });

  it("adulto: branca → azul, pulando as cores infantis", () => {
    expect(proximaCorBase(0, true)).toBe(25); // Branca → Azul
    expect(proximaCorBase(25, true)).toBe(30); // Azul → Roxa
    expect(proximaCorBase(35, true)).toBe(40); // Marrom → Preta
  });

  it("preta é o topo (não há próxima) em ambos", () => {
    expect(proximaCorBase(40, false)).toBeNull();
    expect(proximaCorBase(40, true)).toBeNull();
  });

  it("público padrão é criança (compatível com o comportamento anterior)", () => {
    expect(proximaCorBase(0)).toBe(5);
  });
});
