import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// O proxy encaminha /api para a API .NET em dev, evitando CORS.
// Em produção, defina VITE_API_BASE_URL com a URL pública da API.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // PWA: instalável na tela inicial + service worker para funcionar offline.
    // O app shell é pré-cacheado; os dados (alunos/aulas/presenças) ficam no
    // cache do TanStack Query persistido em localStorage (ver src/main.tsx).
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Tribo de Davi",
        short_name: "Tribo de Davi",
        description:
          "Portal do Instituto Tribo de Davi — chamada e gestão das aulas de jiu-jitsu.",
        lang: "pt-BR",
        theme_color: "#0a0a0b",
        background_color: "#0a0a0b",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        // SPA: navegações offline caem no index.html — menos as chamadas /api,
        // que devem falhar de verdade para acionar a fila offline.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      // Permite testar o PWA/offline rodando `npm run dev`.
      devOptions: { enabled: true, type: "module", navigateFallback: "index.html" },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:7030",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
