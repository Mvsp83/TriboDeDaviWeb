# Tribo de Davi Web

Portal do Instituto Tribo de Davi (jiu-jitsu): **portal administrativo** +
**site público** e **portal do responsável**, em **React + TypeScript**.
Consome a API REST [InstitutoTriboDeDaviAPI](https://github.com/Mvsp83/InstitutoTriboDeDaviAPI).

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** + componentes no estilo **shadcn/ui** (Radix UI)
- **TanStack Query** (dados/cache) · **React Router** (navegação)
- **React Hook Form** + **Zod** (formulários)
- **Axios** (cliente HTTP com JWT) · **Sonner** (toasts) · **Lucide** (ícones)
- Testes: **Vitest** (unidade) + **Playwright** (e2e) — ver [TESTES.md](TESTES.md)

Tema escuro por padrão, paleta da marca (preto + dourado `#F5C518`); tokens em
`src/index.css`.

## Rodando em desenvolvimento

```bash
npm install
npm run dev
```

Sobe em `http://localhost:5173`. O Vite faz **proxy de `/api`** para a API .NET
(padrão `http://localhost:7030`), evitando CORS — ajuste o alvo com
`VITE_API_PROXY_TARGET` (ver `.env.example`).

Em **produção**, defina `VITE_API_BASE_URL` com a URL pública da API (e a API
precisa liberar CORS para o domínio do portal). O site é publicado como serviço
**estático** (hoje no **Render**, `tribodedavi-web`).

## Autenticação

Login via `POST /api/v1/auth/login`. O JWT fica em `sessionStorage`; a sessão
(papel, polo) vem dos claims. Respostas `401` limpam a sessão e voltam ao login.
Papéis: **Administrador**, **Supervisor**, **Professor** — a navegação e as
ações respeitam o papel. O **portal do responsável** usa um token próprio
(acesso por código do aluno + data de nascimento, sem conta).

## O que tem

**Site público** (sem login): home, doação (Pix), transparência, galeria,
loja/vitrine, informações/polos, inscrição (crianças e adultos) e o assistente
"Davizinho".

**Portal administrativo** (por papel):
- **Operacional** — Alunos, Inscrições, Polos, Chamada, Aulas, Presenças,
  Frequência, Graduações, Aniversariantes, Atletas/Competições, Fotos de treino,
  Programas de graduação.
- **Administrativo** — Solicitações, Avisos, Calendário, Documentos (modelos e
  ofícios/recibos), Patrimônio, Doações, Governança.
- **Financeiro** — Contabilidade (DRE, Balanço, Relatório de Atividades), Contas
  (Extratos, Aplicações, Planilha), Mensalidades (Planos, Matrículas, Cobranças).
- **Relatórios** — construtor com fontes/filtros, exportação CSV e **Acessos ao
  site** (métricas).
- **Configurações** — Usuários, Auditoria, Padrões, Importação, Sincronização,
  Retenção (LGPD).

Persistência: tudo na API REST (inclusive o **Financeiro**, que já migrou do
`localStorage` para `/api/Financeiro`). O `localStorage` é usado só para
convenências locais (ex.: fila da chamada offline, rascunhos).

## Estrutura

```
src/
  components/     ui/ (base), layout/ (Sidebar, Topbar, AppLayout, navConfig), site/
  features/       um diretório por módulo (alunos, matricula, financeiro, metricas, ...)
  lib/            api (axios), rotas, token, utils, queryClient
  types/          modelos do domínio
```
