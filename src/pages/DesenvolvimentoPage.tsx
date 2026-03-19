/**
 * DesenvolvimentoPage — Crescer v3
 *
 * Rebuilt as a vertical age-aware journey — no tab rail dependency.
 *
 * Structure:
 *  1. Header: age phase + quick context
 *  2. Phase overview: what matters now
 *  3. Growth summary (linked from Saúde)
 *  4. Milestone follow-up (Observe) — domain-filterable
 *  5. Stimulation activities (Estimular) — tied to age + purpose
 *  6. Watchpoints (Atenção) — not diagnosis, observe + mention to pediatrician
 *
 * Data sources: src/lib/ageJourneys.ts — all milestone/stimulation data is age-scoped.
 * Milestone achievements persist in Supabase (health_logs type=note, details.type=milestone).
 * Fallback: localStorage per child if no user context.
 *
 * Rules:
 *  - No horizontal tab rail
 *  - No fake milestones — only age-appropriate data shown
 *  - No diagnosis language in watchpoints
 *  - All data is scoped to active child
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { SectionLabel } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  getJourneyPhase, getPhaseLabel, DOMAIN_COLORS, DOMAIN_LABELS,
  type Milestone, type MilestoneDomain, type StimulationActivity,
} from '@/lib/ageJourneys';

// ─── Constants ────────────────────────────────────────────────────────────

const GOLD = 'hsl(40,80%,52%)';

function getAgeMonths(birthDate: string): number {
  const diffMs = Date.now() - new Date(birthDate + 'T00:00:00').getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

// ─── Domain filter chip ───────────────────────────────────────────────────

const DOMAIN_OPTIONS: { value: MilestoneDomain | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'motor',     label: '💪 Motor' },
  { value: 'linguagem', label: '🗣️ Linguagem' },
  { value: 'social',    label: '🤝 Social' },
  { value: 'cognitivo', label: '🧠 Cognitivo' },
];

function DomainChips({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {DOMAIN_OPTIONS.map(opt => {
        const active = value === opt.value;
        const color = opt.value === 'all' ? GOLD : DOMAIN_COLORS[opt.value as MilestoneDomain];
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold font-nunito transition-all"
            style={{
              backgroundColor: active
                ? `color-mix(in srgb, ${color} 18%, transparent)`
                : 'hsl(var(--muted))',
              color: active ? color : 'hsl(var(--muted-foreground))',
              border: `1.5px solid ${active ? `color-mix(in srgb, ${color} 35%, transparent)` : 'transparent'}`,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Expandable section ───────────────────────────────────────────────────

function Section({
  id, emoji, title, count, accent, open, onToggle, children,
}: {
  id: string; emoji: string; title: string; count?: string;
  accent?: string; open: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  const color = accent ?? GOLD;
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? 'hsl(var(--muted) / 0.5)' : 'transparent' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, hsl(var(--muted)))` }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold font-quicksand text-foreground">{title}</p>
          {count && (
            <p className="text-[11px] font-nunito mt-0.5" style={{ color }}>{count}</p>
          )}
        </div>
        {open
          ? <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`${id}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-5 pt-3 space-y-4"
              style={{ borderTop: '1px solid hsl(var(--border))' }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Milestone card ───────────────────────────────────────────────────────

function MilestoneCard({
  milestone, achieved, onToggle,
}: { milestone: Milestone; achieved: boolean; onToggle: () => void }) {
  const color = DOMAIN_COLORS[milestone.domain];
  return (
    <motion.button
      onClick={onToggle}
      className="w-full flex items-start gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: achieved
          ? `color-mix(in srgb, ${color} 7%, hsl(var(--card)))`
          : 'hsl(var(--card))',
        border: `1px solid ${achieved
          ? `color-mix(in srgb, ${color} 30%, transparent)`
          : 'hsl(var(--border))'}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        {achieved ? '✅' : milestone.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className="text-[14px] font-bold font-quicksand leading-tight"
            style={{ color: achieved ? color : 'hsl(var(--foreground))' }}
          >
            {milestone.label}
          </p>
          <span
            className="text-[9px] font-bold font-nunito px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
              color,
            }}
          >
            {milestone.ageHint}
          </span>
        </div>
        <p className="text-[12px] mt-0.5 text-muted-foreground font-nunito leading-snug">
          {milestone.description}
        </p>
      </div>
      <div
        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          borderColor: achieved ? color : 'hsl(var(--border))',
          backgroundColor: achieved ? color : 'transparent',
        }}
      >
        {achieved && <span className="text-white text-[10px] font-bold">✓</span>}
      </div>
    </motion.button>
  );
}

// ─── Activity card ────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: StimulationActivity }) {
  const [expanded, setExpanded] = useState(false);
  const color = DOMAIN_COLORS[activity.domain];
  return (
    <motion.div
      className="rounded-2xl bg-card border border-border overflow-hidden"
      layout
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
        >
          {activity.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
            {activity.title}
          </p>
          <p className="text-[11px] text-muted-foreground font-nunito mt-0.5 leading-snug">
            {activity.why}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1 text-muted-foreground">
          {expanded
            ? <ChevronDownIcon className="w-4 h-4" />
            : <ChevronRightIcon className="w-4 h-4" />
          }
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-2"
              style={{ borderTop: '1px solid hsl(var(--border))' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground font-nunito mb-1.5">
                Como fazer
              </p>
              <p className="text-[13px] text-foreground font-nunito leading-relaxed">
                {activity.how}
              </p>
              <span
                className="mt-2 inline-block text-[10px] font-bold font-nunito px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
                  color,
                }}
              >
                {DOMAIN_LABELS[activity.domain]}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── localStorage fallback for milestones ─────────────────────────────────

function getMilestoneKey(childId: string) { return `ninho_milestones_v2_${childId}`; }
function loadAchievedLocal(childId: string): string[] {
  try { return JSON.parse(localStorage.getItem(getMilestoneKey(childId)) ?? '[]'); }
  catch { return []; }
}
function saveAchievedLocal(childId: string, ids: string[]) {
  try { localStorage.setItem(getMilestoneKey(childId), JSON.stringify(ids)); } catch { /* noop */ }
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function DesenvolvimentoPage() {
  const { user } = useAuth();
  const { activeChild, getAgeLabel } = useActiveChild();
  const navigate = useNavigate();

  const [openSection, setOpenSection] = useState<string | null>('milestones');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [actDomainFilter, setActDomainFilter] = useState<string>('all');
  const [achieved, setAchieved] = useState<string[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  function toggleSection(id: string) {
    setOpenSection(prev => prev === id ? null : id);
  }

  // ── Compute phase data ────────────────────────────────────────────────
  const ageMonths = activeChild ? getAgeMonths(activeChild.birth_date) : 0;
  const phase = activeChild ? getJourneyPhase(ageMonths) : null;
  const phaseLabel = activeChild ? getPhaseLabel(ageMonths) : '';
  const allMilestones = phase?.milestones ?? [];
  const filteredMilestones = domainFilter === 'all'
    ? allMilestones
    : allMilestones.filter(m => m.domain === domainFilter);
  const filteredActivities = actDomainFilter === 'all'
    ? (phase?.stimulation ?? [])
    : (phase?.stimulation ?? []).filter(a => a.domain === actDomainFilter);

  const achievedCount = achieved.filter(id => allMilestones.some(m => m.id === id)).length;
  const total = allMilestones.length;
  const progressPct = total > 0 ? Math.round(achievedCount / total * 100) : 0;

  // ── Load milestone achievements ────────────────────────────────────────
  const loadAchieved = useCallback(async () => {
    if (!activeChild) return;
    setLoadingMilestones(true);
    try {
      if (user) {
        const { data } = await supabase
          .from('health_logs')
          .select('id, details')
          .eq('child_id', activeChild.id)
          .eq('type', 'note')
          .order('occurred_at', { ascending: false });

        const ids: string[] = [];
        for (const row of data ?? []) {
          const d = (row.details ?? {}) as Record<string, unknown>;
          if (d.type === 'milestone' && typeof d.milestone_id === 'string') {
            if (!ids.includes(d.milestone_id)) ids.push(d.milestone_id);
          }
        }
        if (ids.length > 0) {
          setAchieved(ids);
          return;
        }
      }
      // Fallback to localStorage
      setAchieved(loadAchievedLocal(activeChild.id));
    } catch {
      setAchieved(loadAchievedLocal(activeChild.id));
    } finally {
      setLoadingMilestones(false);
    }
  }, [activeChild, user]);

  useEffect(() => { loadAchieved(); }, [loadAchieved]);

  async function toggleMilestone(milestoneId: string) {
    if (!activeChild) return;
    const isAchieved = achieved.includes(milestoneId);

    if (isAchieved) {
      // Remove from local state
      const next = achieved.filter(id => id !== milestoneId);
      setAchieved(next);
      saveAchievedLocal(activeChild.id, next);
    } else {
      // Mark achieved
      const next = [...achieved, milestoneId];
      setAchieved(next);
      saveAchievedLocal(activeChild.id, next);

      if (user) {
        try {
          await supabase.from('health_logs').insert({
            child_id:    activeChild.id,
            author_id:   user.id,
            type:        'note',
            occurred_at: new Date().toISOString(),
            details: {
              type:         'milestone',
              milestone_id: milestoneId,
              phase:        phase?.label,
            },
          });
        } catch {
          // Non-critical — localStorage is the fallback
        }
      }
    }
  }

  // ── No child state ─────────────────────────────────────────────────────
  if (!activeChild) {
    return (
      <div className="min-h-screen pb-28 bg-background">
        <div
          className="px-5 pb-5"
          style={{ paddingTop: 'max(56px, env(safe-area-inset-top))', backgroundColor: 'hsl(40,65%,45%)' }}
        >
          <h1 className="text-[22px] font-bold text-white font-quicksand">Crescer</h1>
          <p className="text-[13px] text-white/70 mt-0.5 font-nunito">Desenvolvimento e estímulos</p>
        </div>
        <div className="flex flex-col items-center text-center px-8 pt-16 gap-3">
          <span className="text-5xl">👶</span>
          <p className="text-[17px] font-bold font-quicksand text-foreground">Nenhuma criança ativa</p>
          <p className="text-[13px] text-muted-foreground font-nunito">
            Selecione ou adicione uma criança para acompanhar o desenvolvimento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-background">

      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          background: 'linear-gradient(135deg, hsl(40,65%,42%), hsl(38,75%,55%))',
        }}
      >
        <h1 className="text-[22px] font-bold text-white font-quicksand">Crescer</h1>
        <p className="text-[13px] text-white/70 mt-0.5 font-nunito">
          {activeChild.name} · {getAgeLabel(activeChild.birth_date)} · {phaseLabel}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* ─── Phase context card ────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: `color-mix(in srgb, ${GOLD} 7%, hsl(var(--card)))`, border: `1px solid color-mix(in srgb, ${GOLD} 20%, transparent)` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${GOLD} 16%, transparent)` }}
            >
              ✨
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold font-quicksand text-foreground">
                {phaseLabel}
              </p>
              <p className="text-[12px] text-muted-foreground font-nunito mt-0.5 leading-relaxed">
                {phase?.phaseSummary}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-bold font-nunito text-muted-foreground uppercase tracking-wide">
                  Marcos desta fase
                </p>
                <p className="text-[12px] font-bold font-quicksand" style={{ color: GOLD }}>
                  {achievedCount}/{total} · {progressPct}%
                </p>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: GOLD }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── Milestones (Observe) ──────────────────────────────────── */}
        <Section
          id="milestones"
          emoji="⭐"
          title="Marcos esperados"
          count={`${achievedCount} de ${total} observados · ${phase?.label}`}
          accent={GOLD}
          open={openSection === 'milestones'}
          onToggle={() => toggleSection('milestones')}
        >
          <div>
            <SectionLabel>Filtrar por área</SectionLabel>
            <DomainChips value={domainFilter} onChange={setDomainFilter} />
          </div>

          <div className="space-y-2">
            {loadingMilestones ? (
              [0,1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)
            ) : (
              filteredMilestones.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <MilestoneCard
                    milestone={m}
                    achieved={achieved.includes(m.id)}
                    onToggle={() => toggleMilestone(m.id)}
                  />
                </motion.div>
              ))
            )}
          </div>

          <p className="text-[11px] text-center text-muted-foreground font-nunito pb-1">
            Baseado na escala Denver II e WHO. Cada criança tem seu próprio ritmo.
          </p>
        </Section>

        {/* ─── Stimulation (Estimular) ───────────────────────────────── */}
        <Section
          id="stimulation"
          emoji="🌱"
          title="Como estimular agora"
          count={`${phase?.stimulation.length ?? 0} sugestões para esta fase`}
          accent="hsl(152,15%,55%)"
          open={openSection === 'stimulation'}
          onToggle={() => toggleSection('stimulation')}
        >
          <div>
            <SectionLabel>Filtrar por área</SectionLabel>
            <DomainChips value={actDomainFilter} onChange={setActDomainFilter} />
          </div>

          <div className="space-y-2">
            {filteredActivities.length === 0 ? (
              <p className="text-[13px] text-muted-foreground font-nunito text-center py-4">
                Nenhuma sugestão nesta área para esta fase.
              </p>
            ) : (
              filteredActivities.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ActivityCard activity={a} />
                </motion.div>
              ))
            )}
          </div>

          <div
            className="rounded-xl px-3 py-2.5 flex gap-2"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}
          >
            <span className="text-[12px]">ℹ️</span>
            <p className="text-[11px] text-muted-foreground font-nunito leading-snug">
              Sugestões baseadas no Nurturing Care Framework (OMS/UNICEF) e Caderneta da Criança.
            </p>
          </div>
        </Section>

        {/* ─── Watchpoints (Atenção) ─────────────────────────────────── */}
        {(phase?.watchpoints.length ?? 0) > 0 && (
          <Section
            id="watchpoints"
            emoji="👁️"
            title="O que observar"
            count="Sinais para acompanhar com o pediatra"
            accent="hsl(37,90%,55%)"
            open={openSection === 'watchpoints'}
            onToggle={() => toggleSection('watchpoints')}
          >
            <div
              className="rounded-xl px-3 py-2.5 flex gap-2 mb-2"
              style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}
            >
              <span className="text-[12px] mt-0.5">⚠️</span>
              <p className="text-[11px] text-muted-foreground font-nunito leading-snug">
                Estes são pontos de observação — não diagnósticos. Cada criança se desenvolve
                no seu ritmo. Se algo persistir ou causar preocupação, leve para a consulta.
              </p>
            </div>

            <div className="space-y-2">
              {phase?.watchpoints.map(wp => {
                const color = DOMAIN_COLORS[wp.domain];
                return (
                  <div
                    key={wp.id}
                    className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                    style={{ backgroundColor: `color-mix(in srgb, hsl(37,90%,55%) 6%, hsl(var(--card)))`, border: `1px solid color-mix(in srgb, hsl(37,90%,55%) 18%, transparent)` }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
                    >
                      {wp.domain === 'motor' ? '💪' : wp.domain === 'linguagem' ? '🗣️' : wp.domain === 'social' ? '🤝' : '🧠'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground font-nunito leading-snug">
                        {wp.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate('/health')}
              className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
              style={{ backgroundColor: 'hsl(152,15%,50%)' }}
            >
              Agendar ou ver consultas
            </button>
          </Section>
        )}

        {/* ─── Domain summary ────────────────────────────────────────── */}
        <div>
          <SectionLabel>Áreas de desenvolvimento</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            {(['motor', 'linguagem', 'social', 'cognitivo'] as MilestoneDomain[]).map(domain => {
              const color = DOMAIN_COLORS[domain];
              const domainMilestones = allMilestones.filter(m => m.domain === domain);
              const domainAchieved = achieved.filter(id => domainMilestones.some(m => m.id === id)).length;
              return (
                <button
                  key={domain}
                  onClick={() => {
                    setDomainFilter(domain);
                    setOpenSection('milestones');
                    setTimeout(() => {
                      document.getElementById('milestones-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }}
                  className="rounded-2xl px-3 pt-3 pb-2.5 flex flex-col gap-1 text-left transition-all active:scale-[0.97] border border-border bg-card"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px]"
                    style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
                  >
                    {domain === 'motor' ? '💪' : domain === 'linguagem' ? '🗣️' : domain === 'social' ? '🤝' : '🧠'}
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground font-nunito leading-none mt-0.5">
                    {domain}
                  </p>
                  <p className="text-[20px] font-bold font-quicksand leading-none" style={{ color }}>
                    {domainAchieved}/{domainMilestones.length}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
