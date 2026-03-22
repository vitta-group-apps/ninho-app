/**
 * DesenvolvimentoPage — Crescer
 *
 * Usa ageJourneys.ts como fonte única de dados de desenvolvimento.
 * Conquistas salvas em health_logs type='note' details.type='milestone'
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { getAgeContext } from '@/lib/eventSystem';
import { SectionLabel, InlineStatusPill } from '@/components/ds';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  getJourneyPhase,
  getPhaseLabel,
  DOMAIN_COLORS,
  DOMAIN_LABELS,
  type Milestone,
  type MilestoneDomain,
  type StimulationActivity,
} from '@/lib/ageJourneys';

// ── Cores fixas ──
const MAUVE        = '#806e84';
const MAUVE_BG     = '#f4f0f3';
const MAUVE_BORDER = '#e3d9e2';
const SAGE         = '#789687';
const SAGE_BG      = '#ebf0ed';
const SAGE_BORDER  = '#ccd9d3';
const AMBER        = '#C8894A';
const AMBER_BG     = '#FDF3E9';
const AMBER_BORDER = '#f0d5b0';
const CARD_BG      = '#ffffff';
const CARD_BORDER  = '#E5E0D8';
const MUTED_BG     = '#E8E8E2';
const PAGE_BG      = '#F8F5F0';
const TXT          = '#2C2C2C';
const TXT_MUTED    = '#7A7A7A';

// Mapeia domain → bg claro para badges e cards
function domainBg(domain: MilestoneDomain): string {
  const map: Record<MilestoneDomain, string> = {
    motor:     SAGE_BG,
    linguagem: '#e8f4f8',
    social:    MAUVE_BG,
    cognitivo: AMBER_BG,
  };
  return map[domain];
}

function domainBorder(domain: MilestoneDomain): string {
  const map: Record<MilestoneDomain, string> = {
    motor:     SAGE_BORDER,
    linguagem: '#b8dae6',
    social:    MAUVE_BORDER,
    cognitivo: AMBER_BORDER,
  };
  return map[domain];
}

// ── Interfaces ──
interface AchievedMilestone {
  id: string;
  milestoneId: string;
  achievedAt: Date;
  notes?: string;
}

// ── Modal de registro de marco ──
function MilestoneModal({
  milestone,
  childId,
  userId,
  onClose,
  onSaved,
}: {
  milestone: Milestone;
  childId: string;
  userId: string;
  onClose: () => void;
  onSaved: (achieved: AchievedMilestone) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]     = useState(today);
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  const color  = DOMAIN_COLORS[milestone.domain];
  const bg     = domainBg(milestone.domain);
  const border = domainBorder(milestone.domain);

  async function confirm() {
    setSaving(true);
    try {
      const { data, error } = await supabase.from('health_logs').insert({
        child_id:    childId,
        author_id:   userId,
        type:        'note',
        occurred_at: new Date(date + 'T12:00:00').toISOString(),
        details: {
          type:            'milestone',
          milestone_id:    milestone.id,
          milestone_title: milestone.label,
          domain:          milestone.domain,
          notes:           notes.trim() || null,
          achieved_on:     date,
        },
      }).select('id').single();
      if (error) throw error;
      onSaved({
        id: data.id,
        milestoneId: milestone.id,
        achievedAt: new Date(date + 'T12:00:00'),
        notes: notes.trim() || undefined,
      });
      toast({ title: '🎉 Marco registrado!', description: milestone.label });
      onClose();
    } catch {
      toast({ title: 'Erro ao registrar marco', variant: 'destructive' });
    } finally { setSaving(false); }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: CARD_BG }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ backgroundColor: CARD_BORDER }} />
        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>
                Registrar marco 🎉
              </p>
              <p className="text-[12px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                {milestone.label}
              </p>
            </div>
            <button onClick={onClose} style={{ color: TXT_MUTED }}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Info do marco */}
          <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ backgroundColor: bg, border: `1px solid ${border}` }}>
            <span className="text-[20px] flex-shrink-0 mt-0.5">{milestone.emoji}</span>
            <div>
              <p className="text-[11px] font-bold font-nunito uppercase tracking-wide mb-0.5"
                style={{ color }}>
                {DOMAIN_LABELS[milestone.domain]}
              </p>
              <p className="text-[13px] font-nunito leading-snug" style={{ color: TXT }}>
                {milestone.description}
              </p>
              <p className="text-[10px] font-nunito mt-1" style={{ color: TXT_MUTED }}>
                Esperado: {milestone.ageHint}
              </p>
            </div>
          </div>

          {/* Data */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-2"
              style={{ color: TXT_MUTED }}>
              Quando aconteceu?
            </p>
            <input type="date" value={date} max={today}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito outline-none"
              style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
            />
          </div>

          {/* Notas */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-2"
              style={{ color: TXT_MUTED }}>
              Como foi? (opcional)
            </p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ex: começou a levantar a cabeça durante o tummy time..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito resize-none outline-none"
              style={{ backgroundColor: MUTED_BG, border: `1.5px solid ${CARD_BORDER}`, color: TXT }}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{ backgroundColor: MUTED_BG, color: TXT_MUTED, border: 'none', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={confirm} disabled={saving}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
              {saving ? 'Salvando…' : '🎉 Confirmar marco'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ── Milestone row ──
function MilestoneRow({
  milestone,
  achieved,
  onRegister,
}: {
  milestone: Milestone;
  achieved?: AchievedMilestone;
  onRegister: (m: Milestone) => void;
}) {
  const color  = DOMAIN_COLORS[milestone.domain];
  const bg     = domainBg(milestone.domain);

  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
      style={{
        backgroundColor: achieved ? bg : CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
      }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0 mt-0.5"
        style={{ backgroundColor: achieved ? color : MUTED_BG }}>
        <span style={{ filter: achieved ? 'brightness(10)' : 'none' }}>
          {achieved ? '✓' : milestone.emoji}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand leading-tight" style={{ color: TXT }}>
          {milestone.label}
        </p>
        <p className="text-[11px] font-nunito mt-0.5 leading-snug" style={{ color: TXT_MUTED }}>
          {milestone.description}
        </p>
        {achieved ? (
          <p className="text-[10px] font-bold font-nunito mt-1" style={{ color }}>
            ✓ {achieved.achievedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            {achieved.notes && ` · ${achieved.notes}`}
          </p>
        ) : (
          <p className="text-[9px] font-nunito mt-0.5" style={{ color: '#CBCBC8' }}>
            Esperado: {milestone.ageHint}
          </p>
        )}
      </div>
      {!achieved && (
        <button onClick={() => onRegister(milestone)}
          className="text-[10px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 self-center transition-all active:scale-95"
          style={{ backgroundColor: SAGE, border: 'none', cursor: 'pointer' }}>
          Atingido
        </button>
      )}
    </div>
  );
}

// ── Atividade card ──
function ActivityCard({
  activity,
  done,
  onToggle,
}: {
  activity: StimulationActivity;
  done: boolean;
  onToggle: () => void;
}) {
  const color  = DOMAIN_COLORS[activity.domain];
  const bg     = domainBg(activity.domain);
  const border = domainBorder(activity.domain);

  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: done ? SAGE_BG : bg,
        border: `1px solid ${done ? SAGE_BORDER : border}`,
      }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
          style={{ backgroundColor: done ? SAGE_BG : CARD_BG, border: `1px solid ${done ? SAGE_BORDER : border}` }}>
          {activity.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>
              {activity.title}
            </p>
            <span className="text-[9px] font-bold font-nunito px-1.5 py-0.5 rounded-full uppercase tracking-wide"
              style={{ backgroundColor: done ? SAGE_BG : bg, color: done ? SAGE : color, border: `1px solid ${done ? SAGE_BORDER : border}` }}>
              {DOMAIN_LABELS[activity.domain]}
            </span>
          </div>
          <p className="text-[12px] font-bold font-nunito mb-1" style={{ color: done ? SAGE : color }}>
            Por quê: <span className="font-normal" style={{ color: TXT_MUTED }}>{activity.why}</span>
          </p>
          <p className="text-[12px] font-nunito leading-relaxed" style={{ color: TXT_MUTED }}>
            {activity.how}
          </p>
        </div>
      </div>

      <button onClick={onToggle}
        className="w-full py-2.5 rounded-xl text-[12px] font-bold font-nunito transition-all active:scale-95"
        style={{
          backgroundColor: done ? SAGE : CARD_BG,
          color: done ? 'white' : color,
          border: `1.5px solid ${done ? SAGE : border}`,
          cursor: 'pointer',
        }}>
        {done ? '✓ Feito hoje!' : 'Marcar como feita hoje'}
      </button>
    </div>
  );
}

// ── Main Page ──
export default function DesenvolvimentoPage() {
  const { user }        = useAuth();
  const { activeChild } = useActiveChild();

  const ageCtx    = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const ageMonths = ageCtx?.months ?? 0;
  const phase     = getJourneyPhase(ageMonths);
  const childName = activeChild?.name ?? 'seu filho';
  const phaseLabel = getPhaseLabel(ageMonths);

  const [achieved, setAchieved]           = useState<AchievedMilestone[]>([]);
  const [loading, setLoading]             = useState(true);
  const [confirmMilestone, setConfirmMilestone] = useState<Milestone | null>(null);
  const [doneActivities, setDoneActivities] = useState<Set<string>>(new Set());
  const [expandedDomains, setExpandedDomains] = useState<Set<MilestoneDomain>>(
    new Set(['motor', 'linguagem'])
  );
  const [showWatchpoints, setShowWatchpoints] = useState(false);

  function toggleDomain(d: MilestoneDomain) {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(d)) { next.delete(d); } else { next.add(d); }
      return next;
    });
  }

  const loadAchieved = useCallback(async () => {
    if (!activeChild) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase.from('health_logs')
        .select('*').eq('child_id', activeChild.id)
        .eq('type', 'note').order('occurred_at', { ascending: false }).limit(200);

      const list: AchievedMilestone[] = [];
      for (const row of (data ?? [])) {
        const d = (row.details ?? {}) as Record<string, unknown>;
        if (d.type === 'milestone' && typeof d.milestone_id === 'string') {
          list.push({
            id:          row.id,
            milestoneId: d.milestone_id,
            achievedAt:  new Date(row.occurred_at),
            notes:       typeof d.notes === 'string' ? d.notes : undefined,
          });
        }
      }
      setAchieved(list);
    } finally { setLoading(false); }
  }, [activeChild]);

  useEffect(() => { loadAchieved(); }, [loadAchieved]);

  // Agrupa marcos por domínio
  const domains = Array.from(
    new Set(phase.milestones.map(m => m.domain))
  ) as MilestoneDomain[];

  const milestonesByDomain = domains.reduce((acc, d) => {
    acc[d] = phase.milestones.filter(m => m.domain === d);
    return acc;
  }, {} as Record<MilestoneDomain, Milestone[]>);

  const achievedIds   = new Set(achieved.map(a => a.milestoneId));
  const achievedCount = phase.milestones.filter(m => achievedIds.has(m.id)).length;
  const totalCount    = phase.milestones.length;
  const progressPct   = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  // Atividade em destaque — primeira não concluída hoje
  const featuredActivity = phase.stimulation.find(a => !doneActivities.has(a.id))
    ?? phase.stimulation[0];

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: PAGE_BG }}>

      {/* HEADER */}
      <div className="px-5 pb-5 flex-shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          backgroundColor: MAUVE,
          borderRadius: '0 0 24px 24px',
        }}>
        <h1 className="text-[22px] font-bold font-quicksand" style={{ color: 'white' }}>
          Crescer
        </h1>
        <p className="text-[13px] mt-0.5 font-nunito" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {activeChild ? childName : 'Desenvolvimento'}
          {ageCtx && <span style={{ opacity: 0.75 }}> · {phaseLabel}</span>}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* FASE ATUAL */}
        <div className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] flex-shrink-0"
              style={{ backgroundColor: MAUVE_BG }}>
              🌱
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold font-quicksand" style={{ color: TXT }}>
                {phase.label}
              </p>
              <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                {phaseLabel}
              </p>
            </div>
          </div>

          <p className="text-[13px] font-nunito leading-relaxed" style={{ color: '#4b4b47' }}>
            {phase.phaseSummary}
          </p>

          {/* Barra de progresso */}
          {!loading && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-bold font-nunito uppercase tracking-wide"
                  style={{ color: TXT_MUTED }}>
                  Marcos desta fase
                </p>
                <p className="text-[11px] font-bold font-nunito"
                  style={{ color: achievedCount > 0 ? SAGE : TXT_MUTED }}>
                  {achievedCount}/{totalCount}
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: MUTED_BG }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: progressPct === 100 ? SAGE : MAUVE }}
                />
              </div>
              {progressPct === 100 && (
                <p className="text-[11px] font-bold font-nunito mt-1.5" style={{ color: SAGE }}>
                  🎉 Todos os marcos desta fase registrados!
                </p>
              )}
            </div>
          )}
        </div>

        {/* ATIVIDADE EM DESTAQUE */}
        {featuredActivity && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
              style={{ color: TXT_MUTED }}>
              Atividade sugerida hoje
            </p>
            <ActivityCard
              activity={featuredActivity}
              done={doneActivities.has(featuredActivity.id)}
              onToggle={() => setDoneActivities(prev => {
                const next = new Set(prev);
                if (next.has(featuredActivity.id)) { next.delete(featuredActivity.id); }
                else { next.add(featuredActivity.id); }
                return next;
              })}
            />

            {/* Mais atividades */}
            {phase.stimulation.length > 1 && (
              <div className="mt-2 space-y-2">
                {phase.stimulation
                  .filter(a => a.id !== featuredActivity.id)
                  .map(a => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      done={doneActivities.has(a.id)}
                      onToggle={() => setDoneActivities(prev => {
                        const next = new Set(prev);
                        if (next.has(a.id)) { next.delete(a.id); } else { next.add(a.id); }
                        return next;
                      })}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* MARCOS POR DOMÍNIO */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
            style={{ color: TXT_MUTED }}>
            Marcos de desenvolvimento
          </p>

          {/* Aviso ético */}
          <div className="rounded-xl px-3 py-2.5 flex items-start gap-2 mb-3"
            style={{ backgroundColor: MUTED_BG }}>
            <span className="text-[13px] mt-0.5 flex-shrink-0">ℹ️</span>
            <p className="text-[11px] font-nunito leading-snug" style={{ color: TXT_MUTED }}>
              Marcos são referências, não obrigações. Cada criança se desenvolve no seu ritmo.
              Consulte o pediatra se tiver dúvidas.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0,1,2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map(domain => {
                const color       = DOMAIN_COLORS[domain];
                const bg          = domainBg(domain);
                const domMilestones = milestonesByDomain[domain] ?? [];
                const domAchieved   = domMilestones.filter(m => achievedIds.has(m.id)).length;
                const isExpanded    = expandedDomains.has(domain);

                return (
                  <div key={domain} className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
                    <button onClick={() => toggleDomain(domain)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                      style={{ backgroundColor: isExpanded ? MAUVE_BG : 'transparent' }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] flex-shrink-0"
                        style={{ backgroundColor: bg }}>
                        {DOMAIN_LABELS[domain].split(' ')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                          {DOMAIN_LABELS[domain].split(' ').slice(1).join(' ')}
                        </p>
                        <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                          {domAchieved}/{domMilestones.length} registrados
                        </p>
                      </div>
                      {domAchieved === domMilestones.length && domMilestones.length > 0 && (
                        <InlineStatusPill label="Completo" variant="active" color={SAGE} />
                      )}
                      <span className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-2 space-y-2"
                            style={{ borderTop: `1px solid ${CARD_BORDER}` }}>
                            {domMilestones.map(m => (
                              <MilestoneRow
                                key={m.id}
                                milestone={m}
                                achieved={achieved.find(a => a.milestoneId === m.id)}
                                onRegister={setConfirmMilestone}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* WATCHPOINTS — colapsável */}
        {phase.watchpoints.length > 0 && (
          <div>
            <button
              onClick={() => setShowWatchpoints(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={{
                backgroundColor: showWatchpoints ? '#FCEAEA' : CARD_BG,
                border: `1px solid ${showWatchpoints ? '#f5caca' : CARD_BORDER}`,
              }}>
              <span className="text-[18px] flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                  Sinais para observar
                </p>
                <p className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                  Converse com o pediatra se notar algo
                </p>
              </div>
              <span className="text-[11px] font-nunito" style={{ color: TXT_MUTED }}>
                {showWatchpoints ? '▾' : '▸'}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {showWatchpoints && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    {phase.watchpoints.map(wp => (
                      <div key={wp.id} className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                        style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca' }}>
                        <span className="text-[14px] flex-shrink-0 mt-0.5">
                          {DOMAIN_LABELS[wp.domain].split(' ')[0]}
                        </span>
                        <p className="text-[12px] font-nunito leading-snug" style={{ color: '#7a3030' }}>
                          {wp.description}
                        </p>
                      </div>
                    ))}
                    <div className="px-3 py-2.5 rounded-xl"
                      style={{ backgroundColor: MUTED_BG }}>
                      <p className="text-[11px] font-nunito leading-snug" style={{ color: TXT_MUTED }}>
                        Esses sinais são referências para conversar com o pediatra — não diagnósticos.
                        Cada criança tem seu ritmo único.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* CONQUISTAS REGISTRADAS */}
        {achieved.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
              style={{ color: TXT_MUTED }}>
              Conquistas de {childName}
            </p>
            <div className="space-y-2">
              {achieved.slice(0, 6).map(a => {
                const milestone = phase.milestones.find(m => m.id === a.milestoneId);
                if (!milestone) return null;
                const color = DOMAIN_COLORS[milestone.domain];
                const bg    = domainBg(milestone.domain);
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ backgroundColor: bg, border: `1px solid ${CARD_BORDER}` }}>
                    <span className="text-[18px] flex-shrink-0">🎉</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold font-quicksand" style={{ color: TXT }}>
                        {milestone.label}
                      </p>
                      <p className="text-[11px] font-nunito mt-0.5" style={{ color: TXT_MUTED }}>
                        {a.achievedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                        {a.notes ? ` · ${a.notes}` : ''}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold font-nunito px-2 py-1 rounded-full uppercase"
                      style={{ backgroundColor: CARD_BG, color }}>
                      {DOMAIN_LABELS[milestone.domain].split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && achieved.length === 0 && (
          <div className="rounded-2xl px-5 py-8 text-center"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-[14px] font-bold font-quicksand" style={{ color: TXT }}>
              Nenhum marco registrado ainda
            </p>
            <p className="text-[12px] mt-1.5 font-nunito leading-snug max-w-[220px] mx-auto"
              style={{ color: TXT_MUTED }}>
              Quando {childName} atingir um marco, toque em "Atingido" para registrar e guardar a memória.
            </p>
          </div>
        )}

      </div>

      {/* Modal */}
      <AnimatePresence>
        {confirmMilestone && activeChild && user && (
          <MilestoneModal
            milestone={confirmMilestone}
            childId={activeChild.id}
            userId={user.id}
            onClose={() => setConfirmMilestone(null)}
            onSaved={a => {
              setAchieved(prev => [a, ...prev]);
              setConfirmMilestone(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}