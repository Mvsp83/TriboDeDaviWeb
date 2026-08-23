# Testes do front (E2)

## Como rodar

```bash
npm run test        # roda todos uma vez (Vitest)
npm run test:watch  # modo interativo
```

Ambiente: **Vitest** + **happy-dom** (para os módulos que usam
`localStorage`/`window`). Config em `vitest.config.ts` (separada da de build).

## O que está coberto

Foco na **lógica pura e de alto risco**, sem depender de rede/DOM completo:

- **`src/lib/offlineQueue`** — a fila da chamada offline (o coração do fluxo de
  chamada sem internet): enfileirar, uma pendência por aula, remover, tolerância
  a `localStorage` corrompido.
- **`src/lib/pixBrCode`** — geração do "Pix copia e cola": CRC16/CCITT-FALSE
  (vetor conhecido) e validade do payload EMV.
- **`src/features/alunos/faixa`** — mapeamento do número da faixa → cor/grau.
- **`src/features/auth/session`** — leitura das claims do JWT e expiração.

## CI

`.github/workflows/ci.yml` roda, a cada push no `master` e em PRs: `npm ci`,
`lint` (oxlint), `test` (Vitest) e `build` (tsc + vite). O deploy do front
(estático — Cloudflare Pages/Netlify) fica pendente da decisão de hospedagem.

## E2E de navegador (Playwright)

Config em `playwright.config.ts`, testes em `e2e/`. Rode com:

```bash
npm run e2e        # roda os testes (sobe o dev server se preciso)
npm run e2e:ui     # modo interativo
```

Cobre hoje as **telas públicas** — que não dependem da API no ar (`e2e/publico.spec.ts`):
site (herói, chamadas, skip-link de acessibilidade, navegação até a
transparência), transparência (identificação/CNPJ) e doação, além do título de
aba por rota. O `webServer` reaproveita um dev server já rodando na 5173.

**Ainda adiado (exige staging da API + banco):** o fluxo completo de chamada
(login → criar aula → registrar presença → offline/sync) e as demais telas
autenticadas (portal do responsável, matrícula com envio, painel). A lógica
offline central já está coberta por unidade aqui; quando houver staging, vale
o smoke test Playwright do caminho feliz.
