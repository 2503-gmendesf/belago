# BelaGo — Contexto do Projeto

## O que é o BelaGo
BelaGo é um marketplace de beleza ("O Uber da Beleza") que conecta clientes a profissionais de beleza (cabelo, unhas, sobrancelha, cílios, maquiagem, depilação, penteado, micropigmentação). O app é um protótipo/MVP em **single-file HTML** puro — sem frameworks e sem bundler. Tudo em `index.html`, com integração progressiva ao Supabase (`supabase/schema.sql`). Sem credenciais válidas, roda em modo demo com dados em memória.

## Arquivo principal
- **`index.html`** — único arquivo da aplicação. CSS, sprite de ícones, HTML estático, JS e a camada Supabase, nessa ordem.
- Não criar arquivos separados (`.js`, `.css`) a menos que o usuário peça explicitamente.
- Não usar frameworks (React, Vue, etc.) nem bibliotecas externas além das Google Fonts já importadas e do `supabase-js`.
- `legal.html` é a página legal estática; segue os mesmos tokens de cor.

---

## Design System (minimalista e monocromático)

### Princípios
- Interface limpa: muito espaço em branco, bordas de 1px no lugar de sombras, uma hierarquia tipográfica curta.
- Cor só onde carrega significado. Ação primária é **preta**; o resto é cinza.
- Sem emojis, sem gradientes, sem ilustrações coloridas. Ícones em SVG de linha.

### Tokens (`:root`)
```
--bg:#FAFAFA  --surface:#FFFFFF  --surface2:#F4F4F5  --border:#E6E6E9  --border2:#D2D2D8
--text:#0A0A0A  --text2:#5C5C66  --text3:#9A9AA4
--ink:#0A0A0A (ação primária)  --on-ink:#FFFFFF
--accent:#E8448A (uso mínimo: coração de favorito, ponto de "não lida", marca)
--ok:#15803D  --warn:#B45309  --bad:#B91C1C (apenas no ponto dos selos de status e em ações destrutivas)
--r-sm:8px  --r-md:12px  --r-lg:16px  --r-xl:22px
```
Para mudar o carácter da marca, altere `--accent` e `--ink`; nenhum outro lugar tem cor fixa (exceto o gráfico de linhas do admin, em SVG).

### Tipografia
- Única família: `DM Sans` (`--font`). Classes: `.h1` (26px), `.h2` (17px), `.h3` (15px), `.eyebrow` (rótulo em caixa-alta), `.muted`, `.faint`, `.small`, `.tiny`.

### Ícones
- Sprite `<symbol id="i-nome">` no início do `<body>`, traço 1,75px, cantos arredondados, `currentColor`.
- Uso: `ic('nome')` em JS, ou `<svg class="ic"><use href="#i-nome"/></svg>` em HTML. Tamanhos: `.ic-sm`, `.ic-lg`, `.ic-xl`.
- Novo ícone: adicionar um `<symbol>` ao sprite (24x24, sem fill, só traço). Ícones de marcas (Instagram, Google etc.) ficam no mesmo sprite.

### Componentes (classes)
`.btn` (`.sec`, `.ghost`, `.danger`, `.sm`), `.icon-btn`, `.chip`/`.chips` (`.wrap`), `.seg` (segmentado), `.card`, `.list` + `.li`, `.kv`, `.tag` (`.ok` `.warn` `.bad`), `.avatar` (`.sm` `.md` `.lg`), `.field` + `.input`/`.select`/`.textarea`, `.switch`, `.kpi`, `.bars`, `.overlay` + `.sheet`, `.empty`, `.faq`.

---

## Arquitetura

### Renderização
- O HTML tem só contêineres (`<div class="screen" id="s-home"></div>`); o conteúdo é gerado por funções `renderX()` com template strings.
- **Todo texto vindo de usuário/banco vai por `esc()`** antes de entrar em HTML. Argumentos de `onclick` com strings usam `jsArg()`.
- Estado em memória no objeto `DB` (`pros`, `appts`, `expenses`, `notifs`, `favs`) e `ME` (cliente logado). Cliente e profissional compartilham `DB.appts`: um agendamento criado por um aparece na agenda do outro e gera notificação.

### Navegação
- Telas usam `.screen` + `.active`. Troca via `goTab(id)` — nunca manipular `.active` diretamente.
- `goTab()` gerencia as **três tab bars**, que são mutuamente exclusivas. Nunca mostrar/esconder tab bars fora dele. O smoke test depende disso.
- Sub-painéis usam `.sub-pane` + `.active` (`switchProfTab`, `switchAdminTab`).
- `routeUser()` roteia por `currentUser.role`.
- Logout (`doLogout`): `onboard`, `login-screen` e `register-screen` usam `display:none/flex` (não `.screen`); `doLogout()` seta `onboard` para `flex`, zera `currentUser` e esconde as tab bars.

### Perfis e navegação inferior
| Perfil | Tela | Tab bar | Abas |
|---|---|---|---|
| `cliente` | `#s-home` e demais `s-*` | `.tab-bar` (a que não é `#prof-tab-bar` nem `#admin-tab-bar`) | Início, Explorar, Agenda, Perfil |
| `profissional` | `#s-prof-panel` | `#prof-tab-bar` | Início, Agenda, Financeiro, Serviços, Perfil |
| `admin` | `#s-admin` | `#admin-tab-bar` | Painel, Profis., Clientes, Financeiro, Config., Perfil |

**Não existe aba "Agendar".** O agendamento começa no perfil da profissional ou num card de serviço (`startBooking()`), passa por `s-book` (passo 1: serviço, data e horário; passo 2: resumo e confirmação) e termina na Agenda.

### IDs
- Telas: `s-` (`s-home`, `s-search`, `s-pro`, `s-book`, `s-appts`, `s-profile`, `s-prof-panel`, `s-admin`).
- Sub-painéis da profissional: `pt-` (`pt-inicio`, `pt-agenda`, `pt-financeiro`, `pt-servicos`, `pt-perfil`). Admin: `at-`.
- Overlays: `ov-` (conteúdo em `ov-x-b`). Genéricos: `ov-form` (formulários), `ov-page` (página cheia), `ov-cancel` (também usado por `askConfirm()`).

### Utilitários globais
`toast(msg)`, `goTab(id)`, `openOv(id, html)`, `closeOv(id)`, `askConfirm(...)`, `ic()`, `esc()`, `brl()`, `avatar()`, `openWa()`, `openMaps()`.

---

## Regras de negócio (uma fonte só: objeto `CFG`)
- Comissão da plataforma **15%**; valores no painel da profissional são líquidos, exceto onde rotulado "bruta".
- Taxa de deslocamento em domicílio **R$ 20**; multa de cancelamento com menos de **2h**: **30%**. O FAQ, a política e o modal de cancelar leem `CFG`, então não escrever esses números em texto solto.
- Agendamentos guardam um **snapshot** (nome, categoria, duração, preço) do serviço no momento da contratação. Alterar ou excluir o serviço depois não muda agendamentos existentes.
- Disponibilidade é por **data + horário + serviços** (`pro.avail['YYYY-MM-DD'] = [{time, all, svc:[ids]}]`), sem recorrência semanal. Só serviços **ativos** são agendáveis; `availableTimes()` também descarta horários passados e conflitos por duração.
- Fase do agendamento é derivada do horário (`phase()`): passou do término vira Histórico ("realizado") automaticamente; `cancelado` é status explícito.
- Avaliação: nota de 0 a 5 e observação, vinculada à profissional e ao serviço realizado.
- Atendimento em domicílio: não mostrar mapa/endereço do estabelecimento; manter WhatsApp.

---

## O que NÃO fazer
- Não criar arquivos separados sem solicitação explícita.
- Não instalar dependências ou npm para o app em si. A única exceção é o tooling de teste (`playwright` como devDependency, usado por `scripts/smoke-test.mjs`); nada disso vai para o `index.html`.
- Não usar `document.write()`.
- Não quebrar o sistema de tab bars (`goTab`).
- Não colocar cores fixas (hex) fora dos tokens do `:root`.
- Não adicionar headers/banners nos painéis de profissional e admin: cada aba tem apenas o título da página.
- Não usar emojis.
- Não reintroduzir PIN fixo ou senha demo como controle de acesso.
- Não inserir texto de usuário em `innerHTML` sem `esc()`.

---

## Contexto de negócio
- MVP para validação com investidores e primeiros usuários.
- Foco em BH e região metropolitana (Betim, Contagem, Sabará).
- Profissionais são majoritariamente mulheres autônomas.
- Clientes buscam conveniência e confiança (avaliações, fotos).
- Modelo de negócio: comissão por agendamento + plano de assinatura para profissionais.
