import { describe, expect, it } from "vitest";
import { sugerirQuimono } from "@/features/inscricoes/sugestaoQuimono";

describe("sugerirQuimono", () => {
  it("usa o maior número entre calça e blusa", () => {
    expect(sugerirQuimono("8", "10")).toBe("M2"); // 10 manda
    expect(sugerirQuimono("calça 6", "blusa 8")).toBe("M1"); // extrai o número
  });

  it("mapeia as faixas do padrão", () => {
    expect(sugerirQuimono("2", null)).toBe("M000");
    expect(sugerirQuimono(null, "14")).toBe("M4");
  });

  it("acima de 14 sugere adulto (A0)", () => {
    expect(sugerirQuimono("16", "16")).toBe("A0");
  });

  it("sem número (letras ou vazio) não sugere", () => {
    expect(sugerirQuimono("P", "M")).toBeNull();
    expect(sugerirQuimono("", "")).toBeNull();
    expect(sugerirQuimono(null, undefined)).toBeNull();
  });
});
