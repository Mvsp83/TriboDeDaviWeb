# Tribo de Davi Web

Portal administrativo do Instituto Tribo de Davi (jiu-jitsu), reescrito em
**React + TypeScript** com visual moderno. Consome a mesma API REST usada pelo
portal Blazor original (`InstitutoTriboDeDaviAPI`), sem alterações no backend.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** + componentes no estilo **shadcn/ui** (Radix UI)
- **TanStack Query** para dados / cache
- **React Router** para navegação
- **React Hook Form** + **Zod** para formulários
- **Axios** (cliente HTTP com JWT) · **Sonner** (toasts) · **Lucide** (ícones)

## Identidade visual

Tema escuro por padrão, na paleta da marca: preto profundo + dourado
(`#F5C518`). Tokens em `src/index.css`.

## Rodando em desenvolvimento

```bash
npm install
npm run dev
```

O app sobe em `http://localhost:5173`. O Vite faz **proxy de `/api`** para a
API .NET (padrão `http://localhost:7030`), evitando CORS. Ajuste o alvo com a
variável `VITE_API_PROXY_TARGET` (veja `.env.example`).

Em **produção**, defina `VITE_API_BASE_URL` com a URL pública da API — nesse
caso a API precisa liberar CORS para o domínio do portal.

## Autenticação

Login via `POST /api/v1/auth/login`. O JWT é guardado em `sessionStorage` e a
sessão (papel, polo) é derivada dos claims do token. Respostas `401` limpam a
sessão e voltam para o login. Papéis: **Administrador**, **Supervisor**,
**Professor** — a navegação e as ações administrativas respeitam o papel.

## Estrutura

```
src/
  components/
    ui/           componentes base (button, input, table, dialog, ...)
    layout/       Sidebar, Topbar, AppLayout, navConfig
    Logo, ProtectedRoute, PlaceholderPage
  features/
    auth/         contexto de sessão, login, decode do JWT
    dashboard/    painel com totais e aniversariantes
    alunos/       CRUD completo (lista, filtros, formulário, faixas)
    polos/        consulta de polos
    administrativo/
      contabilidade  DRE, Balanço, Relatório de Atividades (documentos)
      financeiro/    Extratos, Aplicações e Planilha (contas + lançamentos)
  lib/            api (axios), rotas, token, utils, queryClient
  types/          modelos do domínio
```

## Status da migração

**Migração completa** — todos os módulos do portal Blazor foram reconstruídos:

- **Login**, **Dashboard**
- **Alunos**, **Polos**, **Usuários** — CRUD
- **Aniversariantes** (consulta por mês), **Aulas** (consulta),
  **Presenças** (accordion por aula), **Frequência** (agregada por aluno)
- **Atividades** — CRUD com player de vídeo e busca no YouTube/Google
- **Modelos de Aula** e **Planos de Aula** — editores com blocos, timeline,
  seletor de atividades; planos com lista agrupada por período, clonar e
  criar-de-modelo
- **Sincronização** (admin) — histórico, última execução e ações de sincronizar
- **Relatórios** — construtor com 8 fontes, colunas selecionáveis, filtros,
  exportação CSV, impressão e relatórios salvos

## Administrativo (admin)

Área nova, além da paridade com o portal Blazor:

- **Contabilidade** — **DRE**, **Balanço** e **Relatório de Atividades** guardam
  os documentos anuais enviados pela contabilidade (upload/download via API).
- **Financeiro → Contas** — módulo de tesouraria do instituto:
  - **Extratos** — contas correntes e poupanças, lançamentos de crédito/débito
    com saldo acumulado, conciliação bancária e exportação CSV.
  - **Aplicações** — aportes, resgates e rendimentos das aplicações, com totais
    por período.
  - **Planilha Financeira** — consolidação anual por categoria e mês (receitas,
    despesas, resultado e acumulado), exportável em CSV e PDF.

> **Persistência do Financeiro**: hoje os dados de contas e lançamentos ficam no
> `localStorage` do navegador — a API REST ainda não tem endpoints financeiros.
> A camada de dados (`financeiro/financeiroStore.ts`) é isolada de propósito:
> quando os endpoints existirem, basta reescrevê-la mantendo a assinatura dos
> hooks, sem tocar nas telas.

Duas telas ficam com aviso em vez de reconstrução, por dependerem de algo que
não existe na API REST:

> - **Busca de vídeo in-portal**: exigiria a chave da API do YouTube no backend;
>   num SPA ficaria exposta, então abrimos a busca no YouTube/Google em nova aba
>   (mesmo fallback do portal Blazor sem chave).
> - **Modelos de Documentos**: os uploads ficavam no disco do servidor do portal
>   Blazor, fora da API. A tela explica que depende de um endpoint de documentos
>   ser adicionado à API.
>
> **Importação** já era "em desenvolvimento" no portal original.
