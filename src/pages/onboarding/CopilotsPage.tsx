/**
 * NINHO — CopilotsPage v5 · Rede de Apoio + Freemium
 *
 * Fases:
 *   'select'       → Escolhe quem cuida junto (visual + valor)
 *   'premium_wall' → Paywall de cuidadores (ao clicar em "Convidar")
 *   'done'         → Tela final — logo + entrada no app
 *
 * Sell points (product marketing):
 *   Convidar cuidadores é o momento certo para o pitch Premium.
 *   O usuário acabou de definir QUEM cuida — o desejo de compartilhar está ativo.
 *   Não bloqueamos o onboarding: dismiss → segue normalmente.
 *
 * Features Premium destacadas:
 *   - Rede de cuidadores ilimitada (parceiro, avó, babá, pediatra)
 *   - Compartilhar relatório médico
 *   - Múltiplas crianças
 *   - Lembretes de vacina e consulta
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNinhoStore } from '@/store/useNinhoStore';
import { NinhoWordmark, NinhoIcon } from '@/components/NinhoLogo';

// ─── tokens ──────────────────────────────────────────────────────────────────

const T = {
  mauve50:  '#faf3fc',
  mauve100: '#f4e8f7',
  mauve200: '#e8d4ed',
  mauve300: '#d8b9df',
  mauve500: '#8b5e96',
  mauve700: '#6e2880',
  sage50:   '#f4fbf8',
  sage100:  '#e6f4ef',
  sage300:  '#b8dbcd',
  sage500:  '#4a9e7e',
  sage700:  '#1c5941',
  earth100: '#f5ede4',
  earth400: '#c4895a',
  sun100:   '#fef9e7',
  sun400:   '#d4a820',
  water100: '#e8f4fd',
  water500: '#3a86c8',
  amber50:  '#fffbf0',
  amber200: '#fde68a',
  amber500: '#f59e0b',
  stone50:  '#f8f7f7',
  stone100: '#eeedec',
  stone200: '#e2e0df',
  stone300: '#ceccca',
  stone400: '#c8c4c1',
  stone500: '#a9a5a2',
  stone700: '#6b6865',
  stone900: '#3a3836',
  white:    '#ffffff',
} as const;

const Font = {
  h: "'Quicksand', -apple-system, system-ui, sans-serif",
  b: "'Nunito', -apple-system, system-ui, sans-serif",
} as const;

type Phase = 'select' | 'premium_wall' | 'done';

// ─── roles ────────────────────────────────────────────────────────────────────

interface Role {
  id: string; label: string; emoji: string;
  color: string; bg: string; activeBg: string;
}

const ROLES: Role[] = [
  { id: 'partner',     label: 'Parceiro(a)',   emoji: '💑', color: T.mauve700, bg: T.mauve50,  activeBg: T.mauve100 },
  { id: 'grandparent', label: 'Avó / Avô',    emoji: '👴', color: T.earth400, bg: '#fdf6f0',  activeBg: T.earth100 },
  { id: 'sibling',     label: 'Irmão / Irmã', emoji: '🧑‍🤝‍🧑', color: T.water500, bg: T.water100, activeBg: '#d4ecf7' },
  { id: 'nanny',       label: 'Babá',          emoji: '🧸', color: T.sage700,  bg: T.sage50,  activeBg: T.sage100  },
  { id: 'doctor',      label: 'Pediatra',      emoji: '👩‍⚕️', color: T.stone700, bg: T.stone50, activeBg: T.stone100},
  { id: 'friend',      label: 'Amigo(a)',      emoji: '💚', color: T.sun400,   bg: T.sun100,  activeBg: '#fdf3c0'  },
];

// ─── network viz ─────────────────────────────────────────────────────────────

function NetworkViz({ selectedRoles }: { selectedRoles: Set<string> }) {
  const cx = 110, cy = 110, radius = 70;
  const satellites = ROLES.map((role, i) => {
    const angle = (i / ROLES.length) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, role, active: selectedRoles.has(role.id) };
  });

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" aria-hidden="true" style={{ overflow: 'visible' }}>
      {satellites.map((s, i) => (
        <motion.line key={`l${i}`} x1={cx} y1={cy} x2={s.x} y2={s.y}
          stroke={s.active ? T.mauve300 : T.stone200}
          strokeWidth={s.active ? 2 : 1}
          strokeDasharray={s.active ? '0' : '4 4'}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.08 + i * 0.05 }}
        />
      ))}
      {satellites.map((s, i) => (
        <motion.g key={`n${i}`}
          initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.12 + i * 0.05, ease: [0.34, 1.4, 0.64, 1] }}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}
        >
          <circle cx={s.x} cy={s.y} r={22}
            fill={s.active ? s.role.activeBg : T.stone50}
            stroke={s.active ? s.role.color : T.stone200}
            strokeWidth={s.active ? 2 : 1}
          />
          <text x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={13} style={{ userSelect: 'none' }}>
            {s.role.emoji}
          </text>
        </motion.g>
      ))}
      {/* center — logo icon */}
      <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <motion.circle cx={cx} cy={cy} r={36} fill="none" stroke={T.mauve200} strokeWidth={2}
          animate={{ r: [36, 46], opacity: [0.5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
        <circle cx={cx} cy={cy} r={30} fill={T.mauve100} stroke={T.mauve300} strokeWidth={2} />
        {/* NinhoIcon inline como SVG aninhado */}
        <image
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 500'%3E%3Cpath d='M420.076 57.7168C437.994 54.5374 454.252 57.7231 467.622 66.2773C480.976 74.8212 491.307 88.6276 497.577 106.46C506.778 132.626 507.017 159.529 504.924 186.484C502.547 217.102 495.618 246.65 484.295 275.071C455.461 347.444 407.365 401.537 333.195 429.956C311.695 438.194 289.299 442.561 266.255 443.328C176.46 446.317 107.967 407.436 57.0527 335.627C26.1223 292.003 9.77698 242.734 3.79785 189.954C0.632538 162.013 0.855696 134.107 11.0117 107.021C19.6151 84.0772 34.2711 66.95 59.4434 60.8809C77.4437 56.541 94.191 60.4282 110.104 68.2939C125.549 75.9277 137.966 87.3189 149.619 99.3164C160.103 110.11 169.827 121.537 179.386 133.032C188.959 144.544 198.349 156.104 208.231 167.253C228.993 190.676 250.475 212.832 277.811 228.443C329.115 257.744 396.208 251.673 438.812 212.725C459.152 194.13 471.981 171.565 470.524 143.172C469.925 131.484 467.244 120.102 462.021 109.55C457.394 100.204 450.938 94.1793 443.428 91.4648C435.917 88.7502 427.079 89.2476 417.503 93.4658C404.725 99.0941 394.913 108.731 385.29 119.002C376.389 128.502 368.127 138.564 359.889 148.732C351.664 158.884 343.455 169.152 334.719 178.975C323.858 191.185 312.152 202.703 297.81 211.281C291.479 215.068 284.789 215.148 278.533 211.196C272.91 207.644 270.794 202.08 271.271 195.747C271.622 191.096 273.642 186.854 277.629 184.263C301.23 168.922 317.417 146.472 335.392 124.885C348.756 108.834 362.282 92.6944 378.442 78.9434C390.456 68.7209 403.876 61.2004 420.005 57.7314L420.04 57.7236L420.076 57.7168ZM84.0273 93.6328C71.1835 89.8565 58.2371 94.1543 50.293 104.914C45.9013 110.862 43.033 117.636 41 124.853C34.4001 148.281 35.4886 172.059 39.1543 195.995C47.5681 250.937 67.7826 300.623 105.31 342.143C142.035 382.775 187.377 406.867 242.433 410.254C288.615 413.095 330.856 400.854 368.489 373.713C408.506 344.852 435.651 306.229 452.977 260.297C455.581 253.391 458.183 246.658 459.714 239.55C453.695 244.302 447.602 249.412 440.472 253.853L440.456 253.862C406.838 274.368 370.425 282.892 331.162 279.241C299.325 276.281 270.517 265.201 244.552 246.873C213.714 225.106 189.016 197.07 164.968 168.75C149.206 150.188 134.663 131.031 117.148 114.396C107.389 105.128 96.8859 97.4135 84.0273 93.6328Z' fill='%236e2880'/%3E%3C/svg%3E"
          x={cx - 20} y={cy - 20} width={40} height={40}
        />
      </motion.g>
    </svg>
  );
}

// ─── role chip ────────────────────────────────────────────────────────────────

function RoleChip({ role, selected, onToggle }: { role: Role; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button type="button" onClick={onToggle} aria-pressed={selected} whileTap={{ scale: 0.93 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        paddingInline: 16, paddingBlock: 10, borderRadius: 100,
        border: `1.5px solid ${selected ? role.color : T.stone200}`,
        background: selected ? role.activeBg : T.white,
        cursor: 'pointer', outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        boxShadow: selected ? `0 2px 8px ${role.color}30` : 'none',
      }}
    >
      <span style={{ fontSize: '1.1rem', lineHeight: 1 }} aria-hidden="true">{role.emoji}</span>
      <span style={{ fontFamily: Font.b, fontWeight: selected ? 700 : 500, fontSize: '0.9rem', color: selected ? role.color : T.stone700, transition: 'color 0.2s' }}>
        {role.label}
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span key="chk" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
            style={{ width: 18, height: 18, borderRadius: '50%', background: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6.5l2.5 2.5L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── premium wall (convidar cuidadores) ──────────────────────────────────────

const PREMIUM_FEATURES = [
  { emoji: '👥', title: 'Rede de cuidadores', desc: 'Parceiro(a), avó, babá e pediatra — todos acompanham juntos.' },
  { emoji: '📋', title: 'Relatório médico', desc: 'Compartilhe o diário de saúde com o pediatra em um toque.' },
  { emoji: '👶', title: 'Múltiplas crianças', desc: 'Acompanhe cada filho com rotina e histórico separados.' },
  { emoji: '🔔', title: 'Lembretes inteligentes', desc: 'Vacinas, consultas e marcos no momento certo — sem esquecer.' },
];

function PremiumWallScreen({
  selectedRoles, babyName, onUpgrade, onDismiss,
}: {
  selectedRoles: Set<string>; babyName: string; onUpgrade: () => void; onDismiss: () => void;
}) {
  const names = ROLES.filter(r => selectedRoles.has(r.id)).map(r => r.label);
  const firstName = babyName?.split(' ')[0] ?? 'seu bebê';

  return (
    <motion.div
      key="premium_wall"
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        minHeight: '100svh',
        background: `radial-gradient(ellipse 130% 60% at 50% -5%, ${T.mauve200}, ${T.white})`,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        overflowY: 'auto',
      }}
    >
      {/* header */}
      <header style={{ paddingInline: 24, paddingBottom: 16 }}>
        <NinhoWordmark height={20} color={T.mauve700} />
      </header>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        paddingInline: 24, gap: 24, maxWidth: 460, width: '100%', alignSelf: 'center',
      }}>
        {/* icon + badge */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.amber200}, #fbbf24)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 8px 32px rgba(245,158,11,0.3)',
          }}>
            👑
          </div>
          <span style={{
            display: 'inline-flex', paddingInline: 14, paddingBlock: 5, borderRadius: 100,
            background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve200})`,
            fontFamily: Font.b, fontWeight: 700, fontSize: '0.75rem',
            color: T.mauve700, letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Ninho Premium
          </span>
        </motion.div>

        {/* headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <h2 style={{
            fontFamily: Font.h, fontWeight: 700,
            fontSize: 'clamp(1.45rem, 6vw, 1.8rem)',
            letterSpacing: '-0.025em', lineHeight: 1.2,
            color: T.stone900, margin: '0 0 10px',
          }}>
            {names.length > 0
              ? `Convide ${names.slice(0, 2).join(', ')}${names.length > 2 ? ' e mais' : ''} para cuidar de ${firstName} juntos.`
              : `Compartilhe o cuidado de ${firstName} com quem você ama.`}
          </h2>
          <p style={{ fontFamily: Font.b, fontSize: '0.9rem', lineHeight: 1.6, color: T.stone500, margin: 0 }}>
            Quando todos sabem o que está acontecendo, ninguém se sente sobrecarregado.
          </p>
        </motion.div>

        {/* features */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          style={{
            borderRadius: 20, border: `1.5px solid ${T.mauve200}`,
            background: T.white, padding: '20px 20px 16px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          {PREMIUM_FEATURES.map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: 2, flexShrink: 0 }} aria-hidden="true">{f.emoji}</span>
              <div>
                <p style={{ fontFamily: Font.b, fontWeight: 700, fontSize: '0.875rem', color: T.stone900, margin: '0 0 2px' }}>{f.title}</p>
                <p style={{ fontFamily: Font.b, fontSize: '0.8rem', color: T.stone500, margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <button type="button" onClick={onUpgrade} style={{
            height: 56, borderRadius: 100, border: 'none',
            background: `linear-gradient(135deg, ${T.amber500}, #d97706)`,
            cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
            color: T.white, letterSpacing: '-0.01em',
            boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
            WebkitTapHighlightColor: 'transparent',
          }}>
            Experimentar grátis por 7 dias
          </button>
          <p style={{ fontFamily: Font.b, fontSize: '0.78rem', color: T.stone400, textAlign: 'center', margin: 0 }}>
            R$19,90/mês ou R$149/ano · cancela a qualquer hora
          </p>
          <button type="button" onClick={onDismiss} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: Font.b, fontSize: '0.85rem', color: T.stone400,
            textAlign: 'center', padding: '4px 0', WebkitTapHighlightColor: 'transparent',
          }}>
            Continuar com o plano gratuito →
          </button>
        </motion.div>
      </main>
    </motion.div>
  );
}

// ─── done screen ──────────────────────────────────────────────────────────────

function DoneScreen({ babyName, isPremium, onContinue }: { babyName: string; isPremium: boolean; onContinue: () => void }) {
  const firstName = babyName?.split(' ')[0] ?? '';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
      style={{
        minHeight: '100svh',
        background: `radial-gradient(ellipse 130% 60% at 50% -5%, ${T.mauve200}, ${T.white})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingTop: 'calc(env(safe-area-inset-top) + 32px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)',
        paddingInline: 28, gap: 32, textAlign: 'center',
      }}
    >
      {/* logo mark animado */}
      <motion.div
        initial={{ scale: 0, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          width: 96, height: 96, borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve300})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 12px 40px ${T.mauve300}80`,
        }}
      >
        <NinhoIcon size={52} color={T.mauve700} />
      </motion.div>

      {/* headline */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}
      >
        {isPremium && (
          <span style={{
            display: 'inline-flex', alignSelf: 'center',
            paddingInline: 14, paddingBlock: 5, borderRadius: 100,
            background: `linear-gradient(135deg, #fde68a, #fbbf24)`,
            fontFamily: Font.b, fontWeight: 700, fontSize: '0.75rem',
            color: '#92400e', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            Premium ativo ✨
          </span>
        )}
        <h2 style={{
          fontFamily: Font.h, fontWeight: 700,
          fontSize: 'clamp(1.55rem, 6vw, 1.9rem)',
          letterSpacing: '-0.025em', lineHeight: 1.2,
          color: T.stone900, margin: 0,
        }}>
          {isPremium
            ? `O ninho do ${firstName || 'bebê'} tem toda a rede de apoio. ✨`
            : `O ninho do ${firstName || 'bebê'} está pronto.`}
        </h2>
        <p style={{ fontFamily: Font.b, fontSize: '0.975rem', lineHeight: 1.6, color: T.stone500, margin: 0 }}>
          {isPremium
            ? 'Você pode convidar os cuidadores pelo app a qualquer momento.'
            : 'Você pode adicionar cuidadores quando quiser, no menu do perfil.'}
        </p>
      </motion.div>

      {/* cta */}
      <motion.button
        type="button" onClick={onContinue}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        whileTap={{ scale: 0.97 }}
        style={{
          height: 56, borderRadius: 100, border: 'none', width: '100%', maxWidth: 360,
          background: `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`,
          cursor: 'pointer', fontFamily: Font.h, fontWeight: 700,
          fontSize: '1.05rem', color: T.white, letterSpacing: '-0.01em',
          boxShadow: `0 8px 24px ${T.mauve500}60`,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Entrar no ninho
      </motion.button>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CopilotsPage() {
  const store = useNinhoStore();
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>('select');
  const [upgradedToPremium, setUpgradedToPremium] = useState(false);

  const babyName = store.currentChild?.preferred_name ?? '';

  function toggleRole(id: string) {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleInviteCTA() {
    // Clicar em "Convidar" abre o paywall — momento ideal de venda
    setPhase('premium_wall');
  }

  function handleSkip() {
    setPhase('done');
  }

  function handleUpgrade() {
    store.setSubscription('premium');
    setUpgradedToPremium(true);
    setPhase('done');
  }

  function handleDismissPremium() {
    setPhase('done');
  }

  function goToDashboard() {
    store.setAppState('dashboard');
  }

  // ── phases ──────────────────────────────────────────────────────────────

  if (phase === 'premium_wall') {
    return (
      <AnimatePresence mode="wait">
        <PremiumWallScreen
          key="pw"
          selectedRoles={selectedRoles}
          babyName={babyName}
          onUpgrade={handleUpgrade}
          onDismiss={handleDismissPremium}
        />
      </AnimatePresence>
    );
  }

  if (phase === 'done') {
    return (
      <AnimatePresence mode="wait">
        <DoneScreen key="done" babyName={babyName} isPremium={upgradedToPremium} onContinue={goToDashboard} />
      </AnimatePresence>
    );
  }

  // ── select ───────────────────────────────────────────────────────────────

  const firstName = babyName?.split(' ')[0] ?? '';

  return (
    <div style={{
      minHeight: '100svh', background: T.white,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
    }}>

      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 24, paddingBottom: 8 }}>
        <NinhoWordmark height={20} color={T.mauve700} />
        <button type="button" onClick={handleSkip}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: Font.b, fontWeight: 600, fontSize: '0.9rem', color: T.stone500, padding: '4px 8px' }}
        >
          Pular
        </button>
      </header>

      {/* content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingInline: 24, overflowY: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* headline */}
          <div style={{ paddingTop: 20 }}>
            <h1 style={{
              fontFamily: Font.h, fontWeight: 700,
              fontSize: 'clamp(1.6rem, 7vw, 2rem)',
              letterSpacing: '-0.025em', lineHeight: 1.2, color: T.stone900, margin: 0,
            }}>
              Quem cuida junto{firstName ? ` de ${firstName}` : ''}?
            </h1>
            <p style={{ fontFamily: Font.b, fontSize: '0.95rem', lineHeight: 1.6, color: T.stone500, margin: '10px 0 0' }}>
              Cuidar em equipe é mais leve — quando todos sabem o que está acontecendo, ninguém carrega tudo sozinho.
            </p>
          </div>

          {/* network viz */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <NetworkViz selectedRoles={selectedRoles} />
          </div>

          {/* roles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {ROLES.map(role => (
              <RoleChip key={role.id} role={role} selected={selectedRoles.has(role.id)} onToggle={() => toggleRole(role.id)} />
            ))}
          </div>

          {/* value hint when roles selected */}
          <AnimatePresence>
            {selectedRoles.size > 0 && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  borderRadius: 14, padding: '12px 16px',
                  background: T.mauve50, border: `1px solid ${T.mauve200}`,
                }}
              >
                <p style={{ fontFamily: Font.b, fontSize: '0.875rem', color: T.mauve700, margin: 0, lineHeight: 1.5 }}>
                  ✨ Convidar cuidadores e compartilhar relatórios médicos faz parte do Ninho Premium.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {selectedRoles.size > 0 ? (
              <button type="button" onClick={handleInviteCTA}
                style={{
                  height: 56, borderRadius: 100, border: 'none',
                  background: `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`,
                  cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
                  color: T.white, letterSpacing: '-0.01em',
                  boxShadow: `0 6px 20px ${T.mauve500}50`,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Convidar {selectedRoles.size} pessoa{selectedRoles.size > 1 ? 's' : ''} para o ninho →
              </button>
            ) : (
              <button type="button" onClick={handleSkip}
                style={{
                  height: 56, borderRadius: 100, border: `1.5px solid ${T.stone200}`, background: T.white,
                  cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
                  color: T.stone700, letterSpacing: '-0.01em',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Só eu por agora →
              </button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
