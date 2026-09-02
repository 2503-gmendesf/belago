# BelaGo — Contexto do Projeto

## O que é o BelaGo
BelaGo é um marketplace de beleza ("O Uber da Beleza") que conecta clientes a profissionais de beleza (manicure, cabelo, sobrancelha, cílios, maquiagem, depilação etc.). O app é um protótipo/MVP em **single-file HTML** puro — sem frameworks, sem bundler, sem backend. Tudo em `index.html`.

## Arquivo principal
- **`index.html`** — único arquivo da aplicação (~3500+ linhas). HTML + CSS + JS inline.
- Não criar arquivos separados (`.js`, `.css`) a menos que o usuário peça explicitamente.
- Não usar frameworks (React, Vue, etc.) nem bibliotecas externas além das Google Fonts já importadas.

---

## Design System

### Paleta de cores
```
--primary:      #E8448A   (Rosa BelaGo)
--purple:       #9B5DE5   (Violeta)
--primary-bg:   #FFF0F6
--green:        #16A34A
--amber:        #D97706
--red:          #DC2626
--bg:           #F7F7F9
--surface:      #FFFFFF
--surface2:     #F2F2F4
--border:       #E8E8EC
--text:         #0F0F0F
--text2:        #6B6B80
--text3:        #A0A0B0
--grad:         linear-gradient(135deg, #E8448A 0%, #9B5DE5 100%)
```

### Tipografia
- Fonte principal: `DM Sans` (body, UI)
- Fonte display: `Playfair Display` (títulos decorativos)
- Variável: `--font: 'DM Sans', sans-serif`

### Bordas e sombras
```
--r-sm: 10px  |  --r-md: 14px  |  --r-lg: 18px  |  --r-xl: 24px
--shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.05)
--shadow-md: 0 4px 16px rgba(0,0,0,.1), 0 1px 4px rgba(0,0,0,.06)
```

---

## Arquitetura de telas

### Sistema de navegação
- Telas usam classe `.screen` + `.active` para exibição
- Troca de tela via `goTab(id)` — nunca manipular `.active` diretamente
- Sub-painéis usam `.sub-pane` + `.active`
- Sub-sub-abas (ex: Agenda) usam `display:none/block` controlados por JS

### Três perfis de usuário
Controlado por `currentUser.role` → roteado por `routeUser()`

| Perfil | Painel | Tab bar |
|--------|--------|---------|
| `cliente` | `#s-home` e demais | `.tab-bar` (não `#prof-tab-bar`, não `#admin-tab-bar`) |
| `profissional` | `#s-prof-panel` | `#prof-tab-bar` |
| `admin` | `#s-admin` | `#admin-tab-bar` |

### goTab() gerencia as 3 tab bars
```javascript
// As três barras são mutuamente exclusivas.
// Nunca esconder/mostrar tab bars fora de goTab().
```

### Logout (doLogout)
- `onboard`, `login-screen`, `register-screen` usam `display:none/flex` (não classe `.screen`)
- `doLogout()` deve explicitamente setar `onboard.style.display='flex'`
- Limpar `currentUser = null` e ocultar todas as tab bars

---

## Painel do Profissional (`#s-prof-panel`)
Sub-painéis: `pt-agenda`, `pt-financeiro`, `pt-servicos`, `pt-perfil`

### Agenda — 3 sub-abas
Controladas por `switchAgendaTab(name, btn)`:
- `ag-proximos` — Próximos agendamentos
- `ag-realizados` — Serviços realizados
- `ag-disponibilidade` — Definição de disponibilidade

### Disponibilidade (`ag-disponibilidade`)
Grade de horários pré-fixados (06:00–22:30, intervalo 30 min).
- `onAvailDateChange()` — chamado ao mudar a data, exibe a grade e pré-seleciona slots já salvos
- `toggleTimeChip(time)` — seleciona/deseleciona um horário
- `selectAllSlots()` / `clearSlotSelection()` — seleção em massa
- `saveAvailDate()` — salva todos os selecionados em `_availData[date]`
- `_availData` — objeto `{ 'YYYY-MM-DD': ['HH:MM', ...] }`

---

## Painel Admin (`#s-admin`)
Sub-painéis: `at-painel`, `at-profissionais`, `at-clientes`, `at-financeiro`, `at-config`, `at-perfil`

### Dados
- `_adminProfs[]` — lista de profissionais com name, spec, city, status, rating, agend
- `_adminClients[]` — lista de clientes com name, email, agend, status
- Declarados **antes** do bloco `/* ── INIT ── */`
- `renderAdminProfs()` e `renderAdminClients()` — chamados em `switchAdminTab()`

---

## Padrão de perfil (cliente, profissional, admin)
Todas as telas de perfil seguem o mesmo layout:
1. **Hero** — avatar circular (iniciais), nome, cargo/badge, ícones de ação
2. **3 cards de stats** — métricas relevantes ao perfil
3. **Menu-rows** — lista de opções com ícone, label, seta `›`
4. **Botão "Sair da conta"** — chama `doLogout()` (vermelho, ao final)

---

## Convenções de código

- Sem comentários óbvios — só quando o "porquê" é não-óbvio
- Sem frameworks, sem `import/export`, tudo em escopo global
- Funções utilitárias: `toast(msg)`, `goTab(id)`, `openOv(id)`, `closeOv(id)`
- IDs de telas: prefixo `s-` (ex: `s-home`, `s-search`, `s-profile`)
- IDs de sub-painéis profissional: prefixo `pt-`
- IDs de sub-painéis admin: prefixo `at-`
- IDs de overlays: prefixo `ov-`

---

## O que NÃO fazer
- Não criar arquivos separados sem solicitação explícita
- Não instalar dependências ou npm
- Não usar `document.write()`
- Não quebrar o sistema de tab bars (`.tab-bar`, `#prof-tab-bar`, `#admin-tab-bar`)
- Não duplicar declarações de `_adminProfs` / `_adminClients` / `_availData`
- Não adicionar headers/banners nos painéis de profissional e admin (foram removidos intencionalmente)
- Não usar emojis a menos que o usuário peça

---

## Contexto de negócio
- MVP para validação com investidores e primeiros usuários
- Foco em BH e região metropolitana (Betim, Contagem, Sabará)
- Profissionais são majoritariamente mulheres autônomas
- Clientes buscam conveniência e confiança (avaliações, fotos)
- Modelo de negócio: comissão por agendamento + plano de assinatura para profissionais
