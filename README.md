# BelaGo — O Uber da Beleza

Marketplace que conecta clientes a profissionais de beleza autônomas (manicure, cabelo, sobrancelha, cílios, maquiagem, depilação etc.). Protótipo funcional em single-file HTML, empacotado nativamente via Capacitor e integrado ao Supabase.

## Estrutura do repositório

```
index.html          → aplicação completa (HTML + CSS + JS inline, sem build step)
legal.html           → Política de Privacidade e Termos de Uso (página pública)
vercel.json          → configuração de deploy/roteamento no Vercel
supabase/schema.sql  → schema completo do banco (Postgres/Supabase), com RLS
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

1. Rode `supabase/schema.sql` no SQL Editor do seu projeto Supabase.
2. Em `index.html`, dentro do `<head>`, preencha `window.BELAGO_CONFIG` com a `SUPABASE_URL` e a `SUPABASE_ANON_KEY` do seu projeto (Project Settings → API).
3. Sem essa configuração, o app roda normalmente em **modo demo** (dados mockados, 3 contas fixas: `cliente@belago.app`, `profissional@belago.app`, `admin@belago.app`, senha `123456`).

## Deploy

Este repositório é o ambiente de **desenvolvimento**. O ambiente de **produção/homologação** vive no repositório separado `belago-producao`, com seu próprio projeto Vercel.

```bash
npx vercel        # deploy de preview
npx vercel --prod # deploy de produção (dentro do projeto Vercel correto)
```

## Publicação nas lojas (Play Store / App Store)

Ver `docs/` e o projeto BelaGo no Claude para o roadmap completo de publicação, checklist de assets e guia de configuração manual (contas de desenvolvedor, credenciais OAuth, etc.).
