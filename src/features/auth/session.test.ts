import { describe, expect, it } from "vitest";
import { sessaoDoToken } from "@/features/auth/session";

// Monta um JWT falso (só o payload importa: sessaoDoToken não valida a
// assinatura, só lê as claims e o exp).
function fakeJwt(claims: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(claims)}.assinatura`;
}

const agora = Math.floor(Date.now() / 1000);

describe("sessaoDoToken", () => {
  it("monta a sessão a partir das claims de um token válido", () => {
    const token = fakeJwt({
      unique_name: "admin",
      email: "a@x.com",
      role: "Administrador",
      PoloId: "3",
      PoloNome: "Eça de Queiroz",
      exp: agora + 3600,
    });

    const sessao = sessaoDoToken(token);
    expect(sessao).not.toBeNull();
    expect(sessao!.login).toBe("admin");
    expect(sessao!.poloId).toBe(3);
    expect(sessao!.isAdministrador).toBe(true);
    expect(sessao!.isProfessor).toBe(false);
  });

  it("reconhece o papel de professor", () => {
    const sessao = sessaoDoToken(
      fakeJwt({ unique_name: "prof", role: "Professor", exp: agora + 3600 }),
    );
    expect(sessao!.isProfessor).toBe(true);
    expect(sessao!.isAdministrador).toBe(false);
  });

  it("devolve null para token expirado", () => {
    const token = fakeJwt({ unique_name: "x", role: "Professor", exp: agora - 10 });
    expect(sessaoDoToken(token)).toBeNull();
  });

  it("devolve null para token ausente ou malformado", () => {
    expect(sessaoDoToken(null)).toBeNull();
    expect(sessaoDoToken("não-é-um-jwt")).toBeNull();
  });

  // --- Módulos ---

  it("sem claim Modulos: fallback dá os módulos base, sem graduação para professor", () => {
    const sessao = sessaoDoToken(
      fakeJwt({ unique_name: "prof", role: "Professor", exp: agora + 3600 }),
    );
    expect(sessao!.modulos).toEqual(
      expect.arrayContaining(["core", "captacao", "financeiro", "relacionamento"]),
    );
    expect(sessao!.modulos).not.toContain("graduacao");
  });

  it("sem claim Modulos: professor com permissão ganha graduação", () => {
    const sessao = sessaoDoToken(
      fakeJwt({
        unique_name: "prof",
        role: "Professor",
        PermiteGraduacao: "true",
        exp: agora + 3600,
      }),
    );
    expect(sessao!.modulos).toContain("graduacao");
  });

  it("sem claim Modulos: admin sempre tem graduação", () => {
    const sessao = sessaoDoToken(
      fakeJwt({ unique_name: "admin", role: "Administrador", exp: agora + 3600 }),
    );
    expect(sessao!.modulos).toContain("graduacao");
  });

  it("com claim Modulos: a claim manda e ignora entradas inválidas", () => {
    const sessao = sessaoDoToken(
      fakeJwt({
        unique_name: "admin",
        role: "Administrador",
        Modulos: "core, captacao, inexistente",
        exp: agora + 3600,
      }),
    );
    // Mesmo sendo admin, só vê o que a conta contratou.
    expect(sessao!.modulos).toEqual(["core", "captacao"]);
  });
});
