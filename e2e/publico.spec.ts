import { test, expect } from "@playwright/test";

// Telas públicas: sem login, sem API. Garante que o visitante e as famílias
// sempre encontram o site no ar, com a navegação e os títulos certos.

test.describe("Site público", () => {
  test("mostra o herói e as chamadas de ação", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Instituto Tribo de Davi/);
    await expect(
      page.getByRole("heading", {
        name: /Jiu-jitsu que forma campeões dentro e fora do tatame/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Fazer uma doação/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Fazer inscrição/i })).toBeVisible();
  });

  test("tem o link de pular para o conteúdo (acessibilidade)", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: /Pular para o conteúdo/i });
    await expect(skip).toHaveAttribute("href", "#conteudo");
  });

  test("navega até a transparência pelo menu", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Transparência" }).first().click();
    await expect(page).toHaveURL(/\/transparencia$/);
    await expect(
      page.getByRole("heading", { name: /De onde vêm e para onde vão os recursos/i }),
    ).toBeVisible();
  });
});

test.describe("Transparência", () => {
  test("exibe identificação legal do instituto", async ({ page }) => {
    await page.goto("/transparencia");
    await expect(page).toHaveTitle(/Transparência e impacto/);
    // CNPJ oficial já preenchido no conteúdo curado.
    await expect(page.getByText("11.407.173/0001-45")).toBeVisible();
  });
});

test.describe("Doação", () => {
  test("carrega a página de doação por Pix", async ({ page }) => {
    await page.goto("/doar");
    await expect(page).toHaveTitle(/Doar por Pix/);
    await expect(
      page.getByRole("heading", { name: /Ajude o Instituto Tribo de Davi/i }),
    ).toBeVisible();
  });
});

test.describe("Galeria", () => {
  test("carrega a galeria por evento", async ({ page }) => {
    await page.goto("/galeria");
    await expect(page).toHaveTitle(/Galeria de fotos/);
    await expect(
      page.getByRole("heading", { name: /Galeria de fotos/i }),
    ).toBeVisible();
  });

  test("é acessível pelo menu do site", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Galeria" }).first().click();
    await expect(page).toHaveURL(/\/galeria$/);
  });
});

test.describe("Títulos por rota", () => {
  test("cada tela pública tem seu próprio título", async ({ page }) => {
    await page.goto("/matricula");
    await expect(page).toHaveTitle(/Inscrição/);

    await page.goto("/responsavel");
    await expect(page).toHaveTitle(/Portal do Responsável/);
  });
});
