# BelaGo — O Uber da Beleza

Marketplace que conecta clientes a profissionais de beleza autônomas (manicure, cabelo, sobrancelha, cílios, maquiagem, depilação etc.). Monorepo TypeScript com front React e API Fastify, integrado ao Supabase. O protótipo single-file original foi preservado na branch `belago-legado`.

## Estrutura do repositório

```
apps/web/            → front: React + Vite + TypeScript (SPA, compatível com Capacitor)
apps/api/            → API: Fastify + TypeScript (só o que exige servidor)
packages/shared/     → tipos, schemas zod e regras de negócio compartilhadas (CFG, status, especialidades)
supabase/migrations/ → schema do banco (Postgres/Supabase) versionado, com RLS
supabase/seed.sql    → dados de desenvolvimento (contas demo + profissionais)
docs/                → identidade visual, kickoff, discovery e plano de migração
CLAUDE.md            → convenções de código e contexto do projeto para o Claude Code
```

## Requisitos

- Node conforme `.nvmrc` (24.x) e **pnpm** (workspaces).

## Rodando localmente

```bash
pnpm install
pnpm dev        # web em http://localhost:5173 e api em http://localhost:3333
```

Outros scripts (raiz): `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (testes da API, Vitest), `pnpm format`.

Sem configuração de Supabase, o `apps/web` roda em **modo demo**: DataSource mock, dados em `localStorage`, com três contas (`cliente@belago.app`, `profissional@belago.app`, `admin@belago.app`, senha `123456`).

## Configurando o Supabase

1. Local (recomendado para dev): `pnpm supabase:start` e depois `pnpm supabase:reset` — aplica `supabase/migrations/` e `supabase/seed.sql`.
2. Projeto remoto: rode os arquivos de `supabase/migrations/` em ordem (`0001` a `0005`) no SQL Editor e, para dados de desenvolvimento, o `seed.sql`.
3. Front — `apps/web/.env.local` (ver `.env.example`):
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API; a anon key é pública).
   - `VITE_API_URL` (URL da API, ex.: `http://localhost:3333`).
   - `VITE_SUPPORT_WHATSAPP` (opcional, só dígitos com DDI).
4. API — `apps/api/.env` (ver `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WEB_ORIGIN` e `PAYMENT_WEBHOOK_SECRET`. A `service_role` só existe na API, nunca no front nem no git.

## Deploy (Vercel)

Dois projetos Vercel a partir deste repositório, ambos com deploy da branch `main`:

| Projeto | Root Directory | Config |
|---|---|---|
| `belago` (front) | `apps/web` | `apps/web/vercel.json` |
| `belago-api` | `apps/api` | `apps/api/vercel.json` (função em `api/index.js`) |

As variáveis de ambiente de cada projeto são as listadas acima. As `VITE_*` entram no build do front, então é preciso um novo deploy depois de alterá-las. A CI (`.github/workflows/ci.yml`) roda typecheck, lint, test e build a cada push na `main`.

## Publicação nas lojas (Play Store / App Store)

O `apps/web/dist` segue buildável como app web puro para empacotamento posterior com Capacitor. Ver `docs/` para o roadmap de publicação, checklist de assets e configuração manual (contas de desenvolvedor, credenciais OAuth, etc.).
