import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Config própria dos testes — não carrega os plugins de app (PWA/Tailwind),
// só o necessário para rodar as unidades. Ambiente happy-dom para os módulos
// que usam localStorage/window (fila offline, token).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
