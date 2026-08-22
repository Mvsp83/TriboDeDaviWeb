import { beforeEach, describe, expect, it } from "vitest";
import {
  chamadaPendenteDaAula,
  chamadasPendentes,
  enfileirarChamada,
  removerChamada,
} from "@/lib/offlineQueue";

// A fila offline é o núcleo da chamada sem internet: uma chamada por aula,
// persistida em localStorage, que o sync reenvia ao voltar a conexão.
describe("offlineQueue", () => {
  beforeEach(() => localStorage.clear());

  const chamada = (aulaId: number) => ({
    aulaId,
    poloId: 1,
    data: "2026-03-01",
    marcas: [],
  });

  it("enfileira e lista uma chamada pendente", () => {
    enfileirarChamada(chamada(10));

    const pendentes = chamadasPendentes();
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].aulaId).toBe(10);
    expect(pendentes[0].criadaEm).toBeGreaterThan(0);
  });

  it("busca a pendente de uma aula específica", () => {
    enfileirarChamada(chamada(10));
    enfileirarChamada(chamada(20));

    expect(chamadaPendenteDaAula(20)?.aulaId).toBe(20);
    expect(chamadaPendenteDaAula(99)).toBeUndefined();
  });

  it("reenviar a mesma aula substitui a anterior (uma por aula)", () => {
    enfileirarChamada(chamada(10));
    enfileirarChamada(chamada(10));

    expect(chamadasPendentes()).toHaveLength(1);
  });

  it("remove a chamada da fila", () => {
    enfileirarChamada(chamada(10));
    removerChamada(10);

    expect(chamadasPendentes()).toHaveLength(0);
  });

  it("tolera localStorage corrompido sem quebrar", () => {
    localStorage.setItem("tribo-chamadas-pendentes", "{ nao é json");
    expect(chamadasPendentes()).toEqual([]);
  });
});
