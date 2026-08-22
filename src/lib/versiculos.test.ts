import { describe, expect, it } from "vitest";
import { VERSICULOS, versiculoDoDia } from "@/lib/versiculos";

describe("versiculoDoDia", () => {
  it("é o mesmo para a mesma data (estável no dia)", () => {
    const d = new Date(2026, 7, 22);
    expect(versiculoDoDia(d)).toEqual(versiculoDoDia(new Date(2026, 7, 22)));
  });

  it("muda de um dia para o outro", () => {
    const hoje = versiculoDoDia(new Date(2026, 7, 22));
    const amanha = versiculoDoDia(new Date(2026, 7, 23));
    expect(hoje).not.toEqual(amanha);
  });

  it("percorre a lista em ciclo (volta após o tamanho da lista)", () => {
    const base = new Date(2026, 0, 1);
    const depoisDoCiclo = new Date(2026, 0, 1);
    depoisDoCiclo.setDate(base.getDate() + VERSICULOS.length);
    expect(versiculoDoDia(base)).toEqual(versiculoDoDia(depoisDoCiclo));
  });

  it("todo versículo tem referência e texto", () => {
    for (const v of VERSICULOS) {
      expect(v.referencia.length).toBeGreaterThan(0);
      expect(v.texto.length).toBeGreaterThan(0);
    }
  });
});
