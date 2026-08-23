import { defineConfig, devices } from "@playwright/test";

// E2E de navegador (Playwright). Cobre as TELAS PÚBLICAS — que não dependem da
// API no ar (site, doação, transparência): navegação, títulos por rota e
// conteúdo essencial. As telas que exigem login/API (portal, matrícula,
// painel) ficam para quando houver um staging com dados.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Sobe o dev server se ainda não estiver rodando (reaproveita o existente).
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
