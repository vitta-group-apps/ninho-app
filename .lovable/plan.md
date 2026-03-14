
## Ninho PWA — Release 1.0: Fundação Visual + Auth + DB

### Visão Geral
Shell completo do app mobile-first com splash screen animada, navegação iOS, home dashboard mockado com dados reais do Calendário SUS, autenticação Supabase e schema de banco pronto para o produto escalar.

---

### 1. Design System & Tokens
- Instalar Google Fonts: **Quicksand** (títulos) + **Nunito** (corpo)
- Instalar `framer-motion` e `@heroicons/react`
- Definir CSS variables no `index.css`:
  - Background: `#F7F5F2` (off-white/sand)
  - Primary text: `#5A4A42` (taupe brown)
  - Accent/CTA: `#7A9A8B` (sage green)
  - Splash/header: `#8A7A92` (mauve — cor do mockup)
- Configurar Tailwind com as cores customizadas e `rounded-2xl`/`rounded-3xl` como padrão
- Salvar design system em memória (`mem://index.md`)

---

### 2. Supabase: Auth + Schema
**Conexão** via Lovable Cloud (sem conta externa necessária).

**Migração SQL** criando:
- `families` — grupos familiares (id, owner_id, name)
- `children` — perfis das crianças (id, family_id, name, birth_date, blood_type, allergies jsonb, medications jsonb, avatar_url)
- `memberships` — cuidadores com roles (id, family_id, user_id, role: admin/monitor/viewer) — **tabela separada, não no perfil**
- `health_logs` — registros de vacina/febre/med (id, child_id, type, details jsonb, author_id, created_at)
- `routine_logs` — logs de rotina (id, child_id, type: sleep/feed/diaper, start_time, end_time, author_id)
- `profiles` — dados do usuário (id, user_id, full_name, avatar_url)
- `user_roles` — RBAC separado com enum `app_role` (admin/monitor/viewer)

**RLS** em todas as tabelas via função `has_role()` security definer.

**Dados seed** do Calendário SUS 2026 (hardcoded no código frontend para o card de vacinas — ao nascer, 2m, 3m, 4m, 5m, 6m, 9m, 12m, 15m, 4a, 9-14a).

---

### 3. Splash Screen
- Tela cheia cor **Mauve (#8A7A92)**
- Logo animado: SVG do símbolo "ninho" (caracol/espiral orgânica como no mockup) com `framer-motion` `pathLength` draw animation — duração 1.2s
- Nome "Ninho" fade-in com `scale` suave (delay 0.8s)
- Subtítulo "Sua rede de apoio em cada fase do bebê." (delay 1.2s)
- Após 2.5s total → transição `AnimatePresence` fade para Home ou Login

---

### 4. Auth Flow
- **Tela de Login/Cadastro**: fundo mauve → card branco `rounded-3xl` centralizado
  - Logo pequeno no topo
  - Tabs: "Entrar" / "Criar conta"
  - Campos Email + Senha com `rounded-2xl`
  - Botão primário Sage Green
  - Separador "ou" + botão Google OAuth
- **Rota protegida**: se não autenticado → redireciona para `/login`
- **Reset de senha** (`/reset-password`)

---

### 5. Layout Base (Mobile First)
**App Shell** envolvendo todas as telas autenticadas:

**Top Header (iOS style)**:
- Título grande `text-2xl font-bold` (Quicksand) alinhado à esquerda
- Shrink suave ao scroll via `IntersectionObserver`
- Slot direito para avatar/notificações

**Bottom Navigation Bar**:
- 4 tabs: **Início** (HomeIcon), **Rotina** (ClockIcon), **Saúde** (ClipboardDocumentListIcon), **Perfil** (UserCircleIcon)
- Fundo `bg-white/70 backdrop-blur-md` — glassmorphism
- `rounded-t-3xl`, `shadow-lg`
- Heroicons Outline = inativo (taupe), Solid = ativo (sage green)
- Label abaixo do ícone, `text-xs` Nunito
- Animação de tab com `framer-motion` `layoutId`

**Rotas**: `/` (Home), `/rotina`, `/saude`, `/perfil`

---

### 6. Home Dashboard (UI Estática com Dados Reais)

**Child Switcher Pill** (no header):
- Pílula `rounded-full bg-white shadow-sm` com avatar (iniciais coloridas) + nome + idade calculada (ex: "Lucas · 4m")
- Tap → abre **Bottom Sheet** animado (`framer-motion` slide-up spring) com lista de filhos mockados + botão "Adicionar filho"
- Bottom Sheet: overlay escurecido, handle drag, `rounded-t-3xl`

**Emergency Banner** (cartão horizontal vermelho-suave):
- Ícone de escudo + "Tipo Sanguíneo: O+" + "Alergia: Proteína do Leite de Vaca"
- Background `#FFF0F0`, borda esquerda sage/vermelho, `rounded-2xl`

**Card: Próxima Vacina**:
- Dados do Calendário SUS 2026 calculados a partir da data de nascimento mockada
- Ex: "Pentavalente — 2ª dose · Prevista para 15/abr/2026"
- Ícone de seringa, badge "em 12 dias", `rounded-2xl`, soft shadow

**Card: Salto de Desenvolvimento**:
- Conteúdo estático por faixa de idade (ex: 4 meses → "Controle de cabeça, sorrisos sociais, balbucio")
- Ícone de estrela/foguete, `rounded-2xl`

**FAB (Quick Add)**:
- Botão circular Sage Green `rounded-full` no canto inferior direito (acima da nav bar)
- Ícone `PlusIcon` solid
- Tap → `AnimatePresence` expande 3 mini-FABs animados em arco/coluna:
  - 📝 Anotação, 🌡️ Febre, 🍼 Rotina
- Backdrop semi-transparente fecha ao clicar fora

---

### 7. Telas Placeholder (Rotina, Saúde, Perfil)
- Header com título correto
- Conteúdo "Em breve" estilizado — não páginas em branco
- Estrutura de componente pronta para desenvolvimento futuro

---

### Arquitetura de Arquivos
```
src/
  assets/          ← fontes, imagens
  components/
    layout/        ← AppShell, BottomNav, TopHeader
    home/          ← ChildSwitcher, VaccineCard, DevCard, FAB, EmergencyBanner
    auth/          ← LoginPage, SplashScreen
    ui/            ← shadcn components
  data/
    vaccineSchedule.ts   ← dados do Calendário SUS 2026
  hooks/           ← useAuth, useChild
  pages/           ← Home, Rotina, Saude, Perfil, Login
  integrations/
    supabase/      ← client, types
```
