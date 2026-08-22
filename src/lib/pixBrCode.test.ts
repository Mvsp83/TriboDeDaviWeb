import { describe, expect, it } from "vitest";
import { crc16, gerarPixBrCode } from "@/lib/pixBrCode";

describe("crc16 (CCITT-FALSE)", () => {
  it("bate com o vetor de teste conhecido", () => {
    // Vetor clássico do CRC16/CCITT-FALSE: "123456789" → 0x29B1.
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("gerarPixBrCode", () => {
  const dados = {
    chave: "12345678000199",
    nome: "Instituto Tribo de Davi",
    cidade: "Blumenau",
  };

  it("começa com a versão do payload e inclui a GUI do Pix", () => {
    const code = gerarPixBrCode(dados);
    expect(code.startsWith("000201")).toBe(true);
    expect(code).toContain("br.gov.bcb.pix");
    expect(code).toContain("12345678000199");
  });

  it("termina com um CRC válido sobre todo o payload", () => {
    const code = gerarPixBrCode(dados);
    // O CRC cobre tudo, inclusive o "6304"; os 4 últimos chars são o CRC.
    expect(crc16(code.slice(0, -4))).toBe(code.slice(-4));
  });

  it("inclui o valor quando informado (campo 54) e o omite quando ausente", () => {
    const comValor = gerarPixBrCode({ ...dados, valor: 50 });
    const semValor = gerarPixBrCode(dados);
    expect(comValor).toContain("540550.00");
    // Sem valor o payload é mais curto (o campo 54 não entra).
    expect(semValor.length).toBeLessThan(comValor.length);
  });

  it("remove acentos do nome (o padrão só aceita ASCII)", () => {
    const code = gerarPixBrCode({ ...dados, nome: "Instituição Ação" });
    expect(code).toContain("Instituicao Acao");
  });
});
