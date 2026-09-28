# BelaGo — O Uber da Beleza

Marketplace que conecta clientes a profissionais de beleza autônomas (manicure, cabelo, sobrancelha, cílios, maquiagem, depilação etc.). Protótipo funcional em single-file HTML, empacotado nativamente via Capacitor e integrado ao Supabase.

## Estrutura do repositório

```
index.html          → aplicação completa (HTML + CSS + JS inline, sem build step)
legal.html           → Política de Privacidade e Termos de Uso (página pública)
vercel.json          → configuração de deploy/roteamento no Vercel
supabase/migrations/ → schema do banco (Postgres/Supabase) versionado, com RLS
supabase/seed.sql    → dados de desenvolvimento (contas demo + profissionais)
docs/                → materiais de apoio (identidade visual, kickoff, planilhas de discovery)
CLAUDE.md            → convenções de código e contexto do projeto para o Claude Code
```

## Rodando localmente

Não há build step — é HTML puro.

```bash
npx serve
```

Abre em `http://localhost:3000` (ou a porta indicada pelo `serve`).

## Configurando o Supabase

1. Local (recomendado para dev): `supabase start` e depois `supabase db reset` na raiz — aplica `supabase/migrations/` e `supabase/seed.sql` (contas demo `cliente@belago.app`, `profissional@belago.app`, senha `123456`, e `admin@belago.app`).
2. Projeto remoto: rode os arquivos de `supabase/migrations/` em ordem no SQL Editor do seu projeto Supabase.
3. Em `apps/web/.env`, preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. Sem essa configuração, o `apps/web` roda normalmente em **modo demo** (DataSource mock, dados em memória/localStorage, as mesmas 3 contas demo acima).

## Deploy

Este repositório é o ambiente de **desenvolvimento**. O ambiente de **produção/homologação** vive no repositório separado `belago-producao`, com seu próprio projeto Vercel.

```bash
npx vercel        # deploy de preview
npx vercel --prod # deploy de produção (dentro do projeto Vercel correto)
```

## Publicação nas lojas (Play Store / App Store)

Ver `docs/` e o projeto BelaGo no Claude para o roadmap completo de publicação, checklist de assets e guia de configuração manual (contas de desenvolvedor, credenciais OAuth, etc.).
