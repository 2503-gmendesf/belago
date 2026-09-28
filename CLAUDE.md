# BelaGo — Contexto do Projeto

## O que é o BelaGo
BelaGo é um marketplace de beleza ("O Uber da Beleza") que conecta clientes a profissionais de beleza autônomas (cabelo, unhas, sobrancelha, cílios, maquiagem, depilação, penteado, micropigmentação). Foco em BH e região metropolitana (Betim, Contagem, Sabará).

## Migração em andamento (branch `migracao-monorepo`)
O projeto está sendo migrado do protótipo single-file (`index.html`) para um monorepo TypeScript (`apps/web` + `apps/api`), seguindo `docs/PLANO-MIGRACAO.pdf`. Decisões já tomadas:
- Gerenciador de pacotes: **pnpm** (workspaces). Node fixado em `.nvmrc`.
- Front: **React + Vite + TypeScript**.
- API: **Fastify + TypeScript**.
- Capacitor **continua no roadmap** — `apps/web/dist` deve seguir buildável como app web puro (sem SSR), compatível com empacotamento nativo posterior.
- O Supabase com RLS cobre o CRUD; a API só existe onde há lógica que não pode rodar no cliente (validação de disponibilidade/comissão, webhooks de pagamento, payouts, exclusão de conta/LGPD, notificações).

### `index.html` legado
`index.html` (e `legal.html`) permanecem **intactos** até o fim da Fase 4 do plano de migração — servem de referência de comportamento e fallback caso a migração precise ser interrompida. As regras abaixo em "Convenções do protótipo legado" continuam valendo *apenas para esses dois arquivos*. Não adicionar funcionalidade nova a eles; features novas entram já no monorepo.

---

## Estrutura do monorepo

```
belago/
├── apps/
│   ├── web/          React + Vite + TypeScript (front)
│   └── api/           Fastify + TypeScript (API mínima)
├── packages/
│   └── shared/        tipos, schemas zod, constantes (roles, status, especialidades, CFG)
├── supabase/           migrations/ (versionadas) + seed.sql
├── docs/
├── scripts/            smoke-test.mjs (Playwright, roda contra o index.html legado)
├── index.html, legal.html   protótipo legado (ver acima)
├── pnpm-workspace.yaml, tsconfig.base.json, eslint.config.js, .prettierrc.json
└── CLAUDE.md
```

### Scripts (raiz)
- `pnpm dev` — sobe `apps/web` (Vite, :5173) e `apps/api` (Fastify, :3333) juntos.
- `pnpm build` / `pnpm lint` / `pnpm typecheck` — rodam em todos os workspaces.
- `pnpm smoke` — smoke test Playwright do `index.html` legado (não roda contra o monorepo).
- `pnpm types:supabase` — regenera `packages/shared/src/database.types.ts` a partir do projeto Supabase real (precisa do `--project-id` e login via `supabase` CLI; não roda em CI).

### `packages/shared`
Fonte única de verdade para tipos e regras de negócio compartilhadas entre `web` e `api`:
- `constants.ts` — `ROLES`, `PROF_STATUS`, `APPT_STATUS`, `APPT_LOCATION`, `PAYMENT_METHOD`, `SPECIALTIES`, `CFG` (comissão 15%, taxa de deslocamento R$20, multa de cancelamento <2h = 30%).
- `schemas.ts` — schemas `zod` derivados do `supabase/schema.sql` (`profileSchema`, `professionalProfileSchema`, `serviceSchema`, `availabilitySlotSchema`, `appointmentSchema`, `createAppointmentInputSchema`).
- `types.ts` — tipos inferidos dos schemas (`Role`, `Profile`, `ProfessionalProfile`, `Service`, `AvailabilitySlot`, `Appointment`).

Qualquer regra de negócio (comissão, status válidos, transições permitidas) vive aqui, nunca duplicada em `web` ou `api`.

### `apps/api`
Fastify. Supabase direto com RLS cobre o CRUD; a API só faz o que exige servidor (Fase 5):
- `POST /appointments` — valida disponibilidade/conflito, lê preço/duração do serviço no banco (nunca do cliente), calcula taxa de deslocamento e comissão com `packages/shared`, grava o snapshot. O insert direto de agendamento pelo cliente foi removido do RLS (migração 0005); o trigger `trg_appt_no_overlap` é a rede de segurança contra corrida.
- `DELETE /account` — exclusão LGPD: cancela agendamentos futuros, anonimiza dados pessoais e faz soft delete em `auth.users`.
- `POST /payouts` e `POST /payouts/:id/process` (admin) — repasse calculado por `create_payout()` (SQL, só `service_role`).
- `POST /webhooks/payments` — assinatura HMAC-SHA256 (`x-signature`), idempotente por `providerRef`, agnóstico de provedor.
- Notificações: gravadas em `notifications` (in-app). E-mail/push ainda não implementados.

Estrutura: `app.ts` (Fastify + auth JWT), `routes/`, `repo.ts` (porta de dados), `supabaseRepo.ts` (implementação com `service_role`). Testes Vitest em `test/` usam um `FakeRepo` em memória: `pnpm test`. Config em `apps/api/.env` (ver `.env.example`). O front chama a API via `VITE_API_URL`.

### `apps/web`
Vite + React + TS. Ainda não tem roteamento, layouts nem camada de dados (Fase 2 do plano). Ao implementar:
- Roteamento por papel (`cliente`, `profissional`, `admin`) via React Router, substituindo `goTab()`.
- Um layout de tab bar por perfil (`ClienteLayout`, `ProfLayout`, `AdminLayout`) — nunca misturar as três.
- Design tokens migrados para `tokens.css` (ver paleta abaixo).
- `AuthContext` no lugar de `currentUser`/`routeUser()`.
- `services/` com interface `DataSource` (implementações `mock` e `supabase`, alternadas por env).
- Config via `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), nunca `window.BELAGO_CONFIG`.

---

## Design System (vale para o novo front também)

### Princípios
Interface limpa e monocromática: muito espaço em branco, bordas de 1px no lugar de sombras, hierarquia tipográfica curta. Cor só onde carrega significado — ação primária é preta, o resto é cinza. Sem emojis, sem gradientes, sem ilustrações coloridas. Ícones em SVG de linha.

### Tokens
```
--bg:#FAFAFA  --surface:#FFFFFF  --surface2:#F4F4F5  --border:#E6E6E9  --border2:#D2D2D8
--text:#0A0A0A  --text2:#5C5C66  --text3:#9A9AA4
--ink:#0A0A0A (ação primária)  --on-ink:#FFFFFF
--accent:#E8448A (uso mínimo: coração de favorito, ponto de "não lida", marca)
--ok:#15803D  --warn:#B45309  --bad:#B91C1C (apenas selos de status e ações destrutivas)
--r-sm:8px  --r-md:12px  --r-lg:16px  --r-xl:22px
```
Para mudar o carácter da marca, altera-se `--accent` e `--ink`; nenhum outro lugar deve ter cor fixa (exceto o gráfico de linhas do admin, em SVG).

### Tipografia
Única família: `DM Sans`. Escalas equivalentes a `.h1` (26px), `.h2` (17px), `.h3` (15px), eyebrow (rótulo em caixa-alta), texto muted/faint/small/tiny.

### Ícones
Sprite de `<symbol>` (traço 1,75px, cantos arredondados, `currentColor`), 24×24, sem fill. Ícones de marcas (Instagram, Google etc.) no mesmo sprite.

---

## Regras de negócio (uma fonte só: `packages/shared/src/constants.ts` → `CFG`)
- Comissão da plataforma **15%**; valores no painel da profissional são líquidos, exceto onde rotulado "bruta".
- Taxa de deslocamento em domicílio **R$ 20**; multa de cancelamento com menos de **2h**: **30%**.
- Agendamentos guardam um **snapshot** (nome, categoria, duração, preço) do serviço no momento da contratação. Alterar/excluir o serviço depois não muda agendamentos existentes.
- Disponibilidade é por **data + horário + serviços**, sem recorrência semanal. Só serviços **ativos** são agendáveis; horários passados e conflitos por duração são descartados.
- Fase do agendamento é derivada do horário: passou do término vira "realizado" automaticamente; `cancelado` é status explícito.
- Avaliação: nota de 0 a 5 e observação, vinculada à profissional e ao serviço realizado.
- Atendimento em domicílio: não mostrar mapa/endereço do estabelecimento; manter WhatsApp.

---

## O que NÃO fazer (monorepo)
- Não duplicar regra de negócio em `web` e `api` — tudo vive em `packages/shared`.
- Não usar `service_role key` no front.
- Não misturar as três tab bars/layouts de perfil.
- Não colocar cor fixa (hex) fora dos tokens.
- Não adicionar headers/banners nos painéis de profissional e admin.
- Não usar emojis.
- Não reintroduzir PIN fixo ou senha demo como controle de acesso.
- Não inserir texto de usuário em HTML sem sanitização/escape.
- Não remover `index.html`/`legal.html` nem `scripts/smoke-test.mjs` antes do fim da Fase 4.

---

## Convenções do protótipo legado (`index.html`, `legal.html` — só estes arquivos)
- Single-file, sem frameworks, sem bundler, sem arquivos separados.
- Estado em memória: `DB` (`pros`, `appts`, `expenses`, `notifs`, `favs`) e `ME`.
- Navegação: `.screen` + `.active`, trocada só via `goTab(id)`; três tab bars mutuamente exclusivas (`.tab-bar`, `#prof-tab-bar`, `#admin-tab-bar`); sub-painéis via `.sub-pane` + `.active` (`switchProfTab`, `switchAdminTab`); `routeUser()` roteia por `currentUser.role`; `doLogout()` volta para `onboard` (`display:flex`).
- IDs: `s-` (telas), `pt-` (sub-painéis profissional), `at-` (sub-painéis admin), `ov-` (overlays).
- Utilitários: `toast()`, `goTab()`, `openOv()/closeOv()`, `askConfirm()`, `ic()`, `esc()`, `brl()`, `avatar()`.
- Todo texto de usuário/banco passa por `esc()`; `onclick` com strings usa `jsArg()`.

---

## Contexto de negócio
- MVP para validação com investidores e primeiros usuários.
- Profissionais são majoritariamente mulheres autônomas.
- Clientes buscam conveniência e confiança (avaliações, fotos).
- Modelo de negócio: comissão por agendamento + plano de assinatura para profissionais.
