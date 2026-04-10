/**
 * NINHO — CopilotsPage v4 · Rede de Apoio + Freemium
 *
 * Fluxo:
 *   1. select  → escolhe papéis dos copilotos
 *   2. invite  → convida via e-mail ou compartilha link
 *   3. done    → tela final com premiun awareness (plano gratuito ativo + teaser)
 *
 * Freemium (doc: "o paywall não deve aparecer cedo demais"):
 *   Done screen mostra o plano ativo (Gratuito) e 3 features Premium como teaser suave.
 *   Sem bloqueio, sem pressão — só awareness.
 *
 * Conexão de estado:
 *   store.currentChild?.preferred_name → personaliza o headline
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNinhoStore } from '@/store/useNinhoStore';

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
  clay50:   '#fcf4f3',
  clay200:  '#ecd3d0',
  clay800:  '#671d14',
  white:    '#ffffff',
} as const;

const Font = {
  h: "'Quicksand', -apple-system, system-ui, sans-serif",
  b: "'Nunito', -apple-system, system-ui, sans-serif",
} as const;

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

// ─── network SVG ─────────────────────────────────────────────────────────────

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
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
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
      {/* center */}
      <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      >
        <motion.circle cx={cx} cy={cy} r={36} fill="none" stroke={T.mauve200} strokeWidth={2}
          animate={{ r: [36, 46], opacity: [0.5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
        <circle cx={cx} cy={cy} r={30} fill={T.mauve100} stroke={T.mauve300} strokeWidth={2} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={20} style={{ userSelect: 'none' }}>🪺</text>
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
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6.5l2.5 2.5L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─── invite section ───────────────────────────────────────────────────────────

function InviteSection({ selectedRoles, babyName }: { selectedRoles: Set<string>; babyName: string }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    const e = email.trim();
    if (!e || !/\S+@\S+\.\S+/.test(e)) { toast.error('Coloque um e-mail válido'); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    setEmail('');
    toast.success(`Convite enviado para ${e}!`);
  }

  async function share() {
    const roles = ROLES.filter(r => selectedRoles.has(r.id)).map(r => r.label).join(', ');
    const text  = `Estou usando o Ninho para organizar os cuidados${babyName ? ` do ${babyName}` : ''}. Te adicionei como ${roles || 'copiloto'}. Baixa o app!`;
    if (navigator.share) { try { await navigator.share({ title: 'Ninho', text }); } catch {} }
    else { await navigator.clipboard.writeText(text); toast.success('Link copiado!'); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        display: 'flex', height: 52, borderRadius: 100,
        border: `1.5px solid ${T.stone200}`, background: T.stone50,
        overflow: 'hidden', alignItems: 'center', paddingLeft: 20,
      }}>
        <input type="email" placeholder="e-mail do copiloto" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: Font.b, fontSize: '0.95rem', color: T.stone900 }}
        />
        <button type="button" onClick={send} disabled={sending}
          style={{
            height: '100%', paddingInline: 22,
            background: sending ? T.mauve300 : T.mauve500,
            border: 'none', borderRadius: '0 100px 100px 0',
            cursor: sending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
        >
          {sending ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}
            />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      <button type="button" onClick={share}
        style={{
          height: 44, borderRadius: 100, border: `1.5px solid ${T.stone200}`, background: T.white,
          cursor: 'pointer', fontFamily: Font.b, fontWeight: 600, fontSize: '0.9rem', color: T.stone700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke={T.stone500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Compartilhar link de convite
      </button>
    </div>
  );
}

// ─── premium features (freemium awareness) ───────────────────────────────────

const PREMIUM_FEATURES = [
  { emoji: '🧠', title: 'Assistente Inteligente', desc: 'Prioridades do dia, próxima ação e alertas baseados na fase da criança.' },
  { emoji: '🔔', title: 'Lembretes Inteligentes', desc: 'Vacinas, consultas e mamadas no momento certo — sem esquecer nada.' },
  { emoji: '📄', title: 'Relatório Médico', desc: 'Resumo bonito, exportável e compartilhável com o pediatra.' },
];

function PremiumTeaser({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        borderRadius: 20,
        border: `1.5px solid ${T.amber200}`,
        background: T.amber50,
        padding: '20px 20px 16px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              paddingInline: 10, paddingBlock: 3, borderRadius: 100,
              background: T.stone100,
              fontFamily: Font.b, fontWeight: 700, fontSize: '0.7rem',
              color: T.stone500, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              Plano Gratuito ativo
            </span>
          </div>
          <p style={{ fontFamily: Font.h, fontWeight: 700, fontSize: '1rem', color: T.stone900, margin: 0 }}>
            Descubra o Ninho Premium
          </p>
        </div>
      </div>

      {/* features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PREMIUM_FEATURES.map(f => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: '1.25rem', lineHeight: 1, marginTop: 2, flexShrink: 0 }} aria-hidden="true">{f.emoji}</span>
            <div>
              <p style={{ fontFamily: Font.b, fontWeight: 700, fontSize: '0.875rem', color: T.stone900, margin: '0 0 2px' }}>{f.title}</p>
              <p style={{ fontFamily: Font.b, fontSize: '0.8rem', color: T.stone500, margin: 0, lineHeight: 1.4 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* price + cta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          style={{
            height: 46, borderRadius: 100, border: 'none',
            background: `linear-gradient(135deg, ${T.amber500}, #d97706)`,
            cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '0.95rem',
            color: T.white, letterSpacing: '-0.01em',
            boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Experimentar grátis por 7 dias
        </button>
        <p style={{ fontFamily: Font.b, fontSize: '0.78rem', color: T.stone400, textAlign: 'center', margin: 0 }}>
          R$19,90/mês ou R$149/ano — cancela a qualquer hora.
        </p>
        <button type="button" onClick={onDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: Font.b, fontSize: '0.82rem', color: T.stone400,
            textAlign: 'center', padding: '2px 0',
          }}
        >
          Continuar com o plano gratuito →
        </button>
      </div>
    </motion.div>
  );
}

// ─── done screen ──────────────────────────────────────────────────────────────

function DoneScreen({ count, babyName, onContinue }: { count: number; babyName: string; onContinue: () => void }) {
  const [showPremium, setShowPremium] = useState(true);
  const firstName = babyName?.split(' ')[0] ?? '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      style={{
        minHeight: '100svh',
        background: `radial-gradient(ellipse 130% 60% at 50% -5%, ${T.mauve200}, ${T.white})`,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top) + 40px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        overflowY: 'auto',
      }}
    >
      {/* nest icon */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
        <motion.div
          initial={{ scale: 0, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: 88, height: 88, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.mauve100}, ${T.mauve300})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.75rem',
            boxShadow: `0 12px 40px ${T.mauve300}80`,
          }}
        >
          🪺
        </motion.div>
      </div>

      {/* headline */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{ textAlign: 'center', padding: '20px 28px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <h2 style={{
          fontFamily: Font.h, fontWeight: 700,
          fontSize: 'clamp(1.55rem, 6vw, 1.9rem)',
          letterSpacing: '-0.025em', lineHeight: 1.2,
          color: T.stone900, margin: 0,
        }}>
          {firstName
            ? `O ninho do ${firstName} está pronto! ✨`
            : count > 0
              ? `Ninho com ${count} copiloto${count > 1 ? 's' : ''}. ✨`
              : 'Ninho pronto para voar. ✨'}
        </h2>
        <p style={{ fontFamily: Font.b, fontSize: '0.975rem', lineHeight: 1.6, color: T.stone500, margin: 0 }}>
          {count > 0
            ? 'Os convites estão a caminho. Você pode adicionar mais a qualquer momento.'
            : 'Tudo configurado. Comece registrando a rotina do bebê.'}
        </p>
      </motion.div>

      {/* freemium teaser ou botão entrar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 24px', gap: 12, maxWidth: 460, width: '100%', alignSelf: 'center' }}>
        <AnimatePresence>
          {showPremium && (
            <PremiumTeaser key="premium" onDismiss={() => { setShowPremium(false); }} />
          )}
        </AnimatePresence>

        {!showPremium && (
          <motion.button
            type="button"
            onClick={onContinue}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            style={{
              height: 56, borderRadius: 100, border: 'none',
              background: `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})`,
              cursor: 'pointer', fontFamily: Font.h, fontWeight: 700,
              fontSize: '1.05rem', color: T.white, letterSpacing: '-0.01em',
              boxShadow: `0 8px 24px ${T.mauve500}60`,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Entrar no ninho 🪺
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CopilotsPage() {
  const store = useNinhoStore();
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<'select' | 'invite' | 'done'>('select');

  const babyName  = store.currentChild?.preferred_name ?? '';

  function toggleRole(id: string) {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleContinue() {
    if (phase === 'select') {
      setPhase(selectedRoles.size > 0 ? 'invite' : 'done');
    } else {
      setPhase('done');
    }
  }

  function goToDashboard() {
    store.setAppState('dashboard');
  }

  if (phase === 'done') {
    return <DoneScreen count={selectedRoles.size} babyName={babyName} onContinue={goToDashboard} />;
  }

  return (
    <div style={{
      minHeight: '100svh', background: T.white,
      display: 'flex', flexDirection: 'column',
      paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
    }}>

      {/* header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 24, paddingBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ borderRadius: 100, background: T.mauve500, width: n === 3 ? 24 : 8, height: 8 }} />
          ))}
        </div>
        <button type="button" onClick={goToDashboard}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: Font.b, fontWeight: 600, fontSize: '0.9rem', color: T.stone500, padding: '4px 8px' }}
        >
          Pular
        </button>
      </header>

      {/* content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingInline: 24, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">

          {/* ── select roles ─────────────────────────────────────────────────── */}
          {phase === 'select' && (
            <motion.div key="select"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
            >
              <div style={{ paddingTop: 20 }}>
                <h1 style={{
                  fontFamily: Font.h, fontWeight: 700,
                  fontSize: 'clamp(1.6rem, 7vw, 2rem)',
                  letterSpacing: '-0.025em', lineHeight: 1.2, color: T.stone900, margin: 0,
                }}>
                  Quem cuida junto{babyName ? ` do ${babyName.split(' ')[0]}` : ''}?
                </h1>
                <p style={{ fontFamily: Font.b, fontSize: '0.95rem', lineHeight: 1.6, color: T.stone500, margin: '10px 0 0' }}>
                  Adicione pessoas ao ninho para compartilhar o cuidado.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <NetworkViz selectedRoles={selectedRoles} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {ROLES.map(role => (
                  <RoleChip key={role.id} role={role} selected={selectedRoles.has(role.id)} onToggle={() => toggleRole(role.id)} />
                ))}
              </div>

              <button type="button" onClick={handleContinue}
                style={{
                  height: 56, borderRadius: 100, border: 'none',
                  background: selectedRoles.size > 0 ? `linear-gradient(135deg, ${T.mauve500}, ${T.mauve700})` : T.stone100,
                  cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
                  color: selectedRoles.size > 0 ? T.white : T.stone500,
                  letterSpacing: '-0.01em',
                  boxShadow: selectedRoles.size > 0 ? `0 6px 20px ${T.mauve500}50` : 'none',
                  transition: 'background 0.25s, color 0.25s, box-shadow 0.25s',
                  WebkitTapHighlightColor: 'transparent', marginBottom: 16,
                }}
              >
                {selectedRoles.size > 0
                  ? `Convidar ${selectedRoles.size} pessoa${selectedRoles.size > 1 ? 's' : ''} →`
                  : 'Continuar sem copilotos →'}
              </button>
            </motion.div>
          )}

          {/* ── invite ───────────────────────────────────────────────────────── */}
          {phase === 'invite' && (
            <motion.div key="invite"
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 20 }}
            >
              <div>
                <h1 style={{ fontFamily: Font.h, fontWeight: 700, fontSize: 'clamp(1.5rem, 7vw, 1.9rem)', letterSpacing: '-0.025em', lineHeight: 1.2, color: T.stone900, margin: 0 }}>
                  Como prefere convidar?
                </h1>
                <p style={{ fontFamily: Font.b, fontSize: '0.95rem', lineHeight: 1.6, color: T.stone500, margin: '10px 0 0' }}>
                  Pode pular e fazer isso depois, sem pressa.
                </p>
              </div>

              {/* selected role pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ROLES.filter(r => selectedRoles.has(r.id)).map(role => (
                  <span key={role.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    paddingInline: 12, paddingBlock: 6, borderRadius: 100,
                    background: role.activeBg, fontFamily: Font.b, fontWeight: 600,
                    fontSize: '0.85rem', color: role.color,
                  }}>
                    <span aria-hidden="true">{role.emoji}</span>
                    {role.label}
                  </span>
                ))}
              </div>

              <InviteSection selectedRoles={selectedRoles} babyName={babyName} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: T.stone200 }} />
                <span style={{ fontFamily: Font.b, fontSize: '0.8rem', color: T.stone400 }}>ou</span>
                <div style={{ flex: 1, height: 1, background: T.stone200 }} />
              </div>

              <button type="button" onClick={handleContinue}
                style={{
                  height: 56, borderRadius: 100, border: `1.5px solid ${T.stone200}`, background: T.white,
                  cursor: 'pointer', fontFamily: Font.h, fontWeight: 700, fontSize: '1rem',
                  color: T.stone700, letterSpacing: '-0.01em',
                  WebkitTapHighlightColor: 'transparent', marginBottom: 16,
                }}
              >
                Fazer isso depois →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
