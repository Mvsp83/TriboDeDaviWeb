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

## Próximo passo: E2E de navegador (adiado)

O E2E completo do fluxo de chamada (Playwright: login → criar aula → registrar
presença → validar offline/sync) foi **deixado para depois** porque exige a
**API + banco no ar** e um service worker registrado — instável em CI sem essa
infra. A lógica offline central já está coberta por unidade aqui; quando houver
um ambiente de staging da API, vale um smoke test Playwright do caminho feliz.
