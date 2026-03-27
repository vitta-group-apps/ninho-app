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
import { PaywallGate } from '@/components/PaywallGate';
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
const MAUVE = '#806e84';
const MAUVE_BG = '#f4f0f3';
const MAUVE_BORDER = '#e3d9e2';
const SAGE = '#789687';
const SAGE_BG = '#ebf0ed';
const SAGE_BORDER = '#ccd9d3';
const AMBER = '#C8894A';
const AMBER_BG = '#FDF3E9';
const AMBER_BORDER = '#f0d5b0';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const MUTED_BG = '#E8E8E2';
const PAGE_BG = '#F8F5F0';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';

type DevelopmentMilestoneRow = {
  id: string;
  child_id: string;
  author_id: string;
  milestone_id: string;
  milestone_label: string;
  domain: string;
  age_hint: string | null;
  achieved_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

interface AchievedMilestone {
  id: string;
  milestoneId: string;
  milestoneLabel: string;
  domain: MilestoneDomain;
  ageHint?: string;
  achievedAt: Date;
  achievedOn: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

function isMilestoneDomain(value: unknown): value is MilestoneDomain {
  return (
    value === 'motor' ||
    value === 'linguagem' ||
    value === 'social' ||
    value === 'cognitivo'
  );
}

function toAchievedMilestone(row: DevelopmentMilestoneRow): AchievedMilestone {
  return {
    id: row.id,
    milestoneId: row.milestone_id,
    milestoneLabel: row.milestone_label,
    domain: isMilestoneDomain(row.domain) ? row.domain : 'motor',
    ageHint: row.age_hint ?? undefined,
    achievedAt: new Date(`${row.achieved_on}T12:00:00`),
    achievedOn: row.achieved_on,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Mapeia domain → bg claro para badges e cards
function domainBg(domain: MilestoneDomain): string {
  const map: Record<MilestoneDomain, string> = {
    motor: SAGE_BG,
    linguagem: '#e8f4f8',
    social: MAUVE_BG,
    cognitivo: AMBER_BG,
  };
  return map[domain];
}

function domainBorder(domain: MilestoneDomain): string {
  const map: Record<MilestoneDomain, string> = {
    motor: SAGE_BORDER,
    linguagem: '#b8dae6',
    social: MAUVE_BORDER,
    cognitivo: AMBER_BORDER,
  };
  return map[domain];
}

// ── Modal de registro de marco ──
function MilestoneModal({
  milestone,
  childId,
  userId,
  existingAchievement,
  onClose,
  onSaved,
}: {
  milestone: Milestone;
  childId: string;
  userId: string;
  existingAchievement?: AchievedMilestone;
  onClose: () => void;
  onSaved: (achieved: AchievedMilestone) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(existingAchievement?.achievedOn ?? today);
  const [notes, setNotes] = useState(existingAchievement?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const color = DOMAIN_COLORS[milestone.domain];
  const bg = domainBg(milestone.domain);
  const border = domainBorder(milestone.domain);

  async function confirm() {
    setSaving(true);

    try {
      const payload = {
        child_id: childId,
        author_id: userId,
        milestone_id: milestone.id,
        milestone_label: milestone.label,
        domain: milestone.domain,
        age_hint: milestone.ageHint ?? null,
        achieved_on: date,
        notes: notes.trim() || null,
      };

      const { data, error } = await supabase
        .from('child_development_milestones')
        .upsert(payload, {
          onConflict: 'child_id,milestone_id',
        })
        .select('*')
        .single();

      if (error) throw error;

      onSaved(toAchievedMilestone(data as DevelopmentMilestoneRow));

      toast({
        title: existingAchievement ? '✨ Marco atualizado!' : '🎉 Marco registrado!',
        description: milestone.label,
      });

      onClose();
    } catch {
      toast({
        title: 'Erro ao registrar marco',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: CARD_BG }}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mt-3 mb-4"
          style={{ backgroundColor: CARD_BORDER }}
        />

        <div className="px-5 pb-8 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className="text-[16px] font-bold font-quicksand"
                style={{ color: TXT }}
              >
                {existingAchievement ? 'Atualizar marco' : 'Registrar marco'} 🎉
              </p>
              <p
                className="text-[12px] font-nunito mt-0.5"
                style={{ color: TXT_MUTED }}
              >
                {milestone.label}
              </p>
            </div>

            <button onClick={onClose} style={{ color: TXT_MUTED }}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div
            className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{ backgroundColor: bg, border: `1px solid ${border}` }}
          >
            <span className="text-[20px] flex-shrink-0 mt-0.5">
              {milestone.emoji}
            </span>

            <div>
              <p
                className="text-[11px] font-bold font-nunito uppercase tracking-wide mb-0.5"
                style={{ color }}
              >
                {DOMAIN_LABELS[milestone.domain]}
              </p>

              <p
                className="text-[13px] font-nunito leading-snug"
                style={{ color: TXT }}
              >
                {milestone.description}
              </p>

              <p
                className="text-[10px] font-nunito mt-1"
                style={{ color: TXT_MUTED }}
              >
                Esperado: {milestone.ageHint}
              </p>
            </div>
          </div>

          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-2"
              style={{ color: TXT_MUTED }}
            >
              Quando aconteceu?
            </p>

            <input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito outline-none"
              style={{
                backgroundColor: MUTED_BG,
                border: `1.5px solid ${CARD_BORDER}`,
                color: TXT,
              }}
            />
          </div>

          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-wide font-nunito mb-2"
              style={{ color: TXT_MUTED }}
            >
              Como foi? (opcional)
            </p>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: começou a levantar a cabeça durante o tummy time..."
              rows={2}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito resize-none outline-none"
              style={{
                backgroundColor: MUTED_BG,
                border: `1.5px solid ${CARD_BORDER}`,
                color: TXT,
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{
                backgroundColor: MUTED_BG,
                color: TXT_MUTED,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>

            <button
              onClick={confirm}
              disabled={saving}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{
                backgroundColor: SAGE,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {saving
                ? 'Salvando…'
                : existingAchievement
                ? 'Salvar atualização'
                : '🎉 Confirmar marco'}
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
  const color = DOMAIN_COLORS[milestone.domain];
  const bg = domainBg(milestone.domain);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
      style={{
        backgroundColor: achieved ? bg : CARD_BG,
        border: `1px solid ${CARD_BORDER}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0 mt-0.5"
        style={{ backgroundColor: achieved ? color : MUTED_BG }}
      >
        <span style={{ filter: achieved ? 'brightness(10)' : 'none' }}>
          {achieved ? '✓' : milestone.emoji}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-bold font-quicksand leading-tight"
          style={{ color: TXT }}
        >
          {milestone.label}
        </p>

        <p
          className="text-[11px] font-nunito mt-0.5 leading-snug"
          style={{ color: TXT_MUTED }}
        >
          {milestone.description}
        </p>

        {achieved ? (
          <p
            className="text-[10px] font-bold font-nunito mt-1"
            style={{ color }}
          >
            ✓{' '}
            {achieved.achievedAt.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}
            {achieved.notes ? ` · ${achieved.notes}` : ''}
          </p>
        ) : (
          <p
            className="text-[9px] font-nunito mt-0.5"
            style={{ color: '#CBCBC8' }}
          >
            Esperado: {milestone.ageHint}
          </p>
        )}
      </div>

      <button
        onClick={() => onRegister(milestone)}
        className="text-[10px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 self-center transition-all active:scale-95"
        style={{
          backgroundColor: achieved ? MAUVE : SAGE,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {achieved ? 'Editar' : 'Atingido'}
      </button>
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
  const color = DOMAIN_COLORS[activity.domain];
  const bg = domainBg(activity.domain);
  const border = domainBorder(activity.domain);

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{
        backgroundColor: done ? SAGE_BG : bg,
        border: `1px solid ${done ? SAGE_BORDER : border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
          style={{
            backgroundColor: done ? SAGE_BG : CARD_BG,
            border: `1px solid ${done ? SAGE_BORDER : border}`,
          }}
        >
          {activity.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p
              className="text-[14px] font-bold font-quicksand"
              style={{ color: TXT }}
            >
              {activity.title}
            </p>

            <span
              className="text-[9px] font-bold font-nunito px-1.5 py-0.5 rounded-full uppercase tracking-wide"
              style={{
                backgroundColor: done ? SAGE_BG : bg,
                color: done ? SAGE : color,
                border: `1px solid ${done ? SAGE_BORDER : border}`,
              }}
            >
              {DOMAIN_LABELS[activity.domain]}
            </span>
          </div>

          <p
            className="text-[12px] font-bold font-nunito mb-1"
            style={{ color: done ? SAGE : color }}
          >
            Por quê:{' '}
            <span className="font-normal" style={{ color: TXT_MUTED }}>
              {activity.why}
            </span>
          </p>

          <p
            className="text-[12px] font-nunito leading-relaxed"
            style={{ color: TXT_MUTED }}
          >
            {activity.how}
          </p>
        </div>
      </div>

      <button
        onClick={onToggle}
        className="w-full py-2.5 rounded-xl text-[12px] font-bold font-nunito transition-all active:scale-95"
        style={{
          backgroundColor: done ? SAGE : CARD_BG,
          color: done ? 'white' : color,
          border: `1.5px solid ${done ? SAGE : border}`,
          cursor: 'pointer',
        }}
      >
        {done ? '✓ Feito hoje!' : 'Marcar como feita hoje'}
      </button>
    </div>
  );
}

export default function DesenvolvimentoPage() {
  const { user } = useAuth();
  const { activeChild } = useActiveChild();

  const ageCtx = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const ageMonths = ageCtx?.months ?? 0;
  const phase = getJourneyPhase(ageMonths);
  const childName = activeChild?.name ?? 'seu filho';
  const phaseLabel = getPhaseLabel(ageMonths);

  const [achieved, setAchieved] = useState<AchievedMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmMilestone, setConfirmMilestone] = useState<Milestone | null>(null);
  const [doneActivities, setDoneActivities] = useState<Set<string>>(new Set());
  const [expandedDomains, setExpandedDomains] = useState<Set<MilestoneDomain>>(
    new Set(['motor', 'linguagem'])
  );
  const [showWatchpoints, setShowWatchpoints] = useState(false);

  function toggleDomain(domain: MilestoneDomain) {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  }

  const loadAchieved = useCallback(async () => {
    if (!activeChild) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('child_development_milestones')
        .select('*')
        .eq('child_id', activeChild.id)
        .order('achieved_on', { ascending: false })
        .limit(200);

      if (error) throw error;

      const rows = (data ?? []) as DevelopmentMilestoneRow[];
      setAchieved(rows.map(toAchievedMilestone));
    } catch {
      toast({
        title: 'Erro ao carregar marcos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [activeChild]);

  useEffect(() => {
    loadAchieved();
  }, [loadAchieved]);

  const domains = Array.from(
    new Set(phase.milestones.map(m => m.domain))
  ) as MilestoneDomain[];

  const milestonesByDomain = domains.reduce((acc, domain) => {
    acc[domain] = phase.milestones.filter(m => m.domain === domain);
    return acc;
  }, {} as Record<MilestoneDomain, Milestone[]>);

  const achievedIds = new Set(achieved.map(a => a.milestoneId));
  const achievedCount = phase.milestones.filter(m => achievedIds.has(m.id)).length;
  const totalCount = phase.milestones.length;
  const progressPct = totalCount > 0 ? Math.round((achievedCount / totalCount) * 100) : 0;

  const featuredActivity =
    phase.stimulation.find(a => !doneActivities.has(a.id)) ?? phase.stimulation[0];

  const achievementMap = new Map(achieved.map(item => [item.milestoneId, item] as const));

  function handleSavedMilestone(saved: AchievedMilestone) {
    setAchieved(prev => {
      const withoutOld = prev.filter(item => item.milestoneId !== saved.milestoneId);
      return [saved, ...withoutOld].sort(
        (a, b) => b.achievedAt.getTime() - a.achievedAt.getTime()
      );
    });
  }

  const editingAchievement = confirmMilestone
    ? achievementMap.get(confirmMilestone.id)
    : undefined;

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: PAGE_BG }}>
      <div
        className="px-5 pb-5 flex-shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
          backgroundColor: MAUVE,
          borderRadius: '0 0 24px 24px',
        }}
      >
        <h1
          className="text-[22px] font-bold font-quicksand"
          style={{ color: 'white' }}
        >
          Crescer
        </h1>

        <p
          className="text-[13px] mt-0.5 font-nunito"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {activeChild ? childName : 'Desenvolvimento'}
          {ageCtx && <span style={{ opacity: 0.75 }}> · {phaseLabel}</span>}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-5">
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            backgroundColor: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] flex-shrink-0"
              style={{ backgroundColor: MAUVE_BG }}
            >
              🌱
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-[16px] font-bold font-quicksand"
                style={{ color: TXT }}
              >
                {phase.label}
              </p>
              <p
                className="text-[11px] font-nunito mt-0.5"
                style={{ color: TXT_MUTED }}
              >
                {phaseLabel}
              </p>
            </div>
          </div>

          <p
            className="text-[13px] font-nunito leading-relaxed"
            style={{ color: '#4b4b47' }}
          >
            {phase.phaseSummary}
          </p>

          {!loading && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p
                  className="text-[11px] font-bold font-nunito uppercase tracking-wide"
                  style={{ color: TXT_MUTED }}
                >
                  Marcos desta fase
                </p>
                <p
                  className="text-[11px] font-bold font-nunito"
                  style={{ color: achievedCount > 0 ? SAGE : TXT_MUTED }}
                >
                  {achievedCount}/{totalCount}
                </p>
              </div>

              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: MUTED_BG }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: progressPct === 100 ? SAGE : MAUVE }}
                />
              </div>

              {progressPct === 100 && (
                <p
                  className="text-[11px] font-bold font-nunito mt-1.5"
                  style={{ color: SAGE }}
                >
                  🎉 Todos os marcos desta fase registrados!
                </p>
              )}
            </div>
          )}
        </div>

        <PaywallGate feature="marcos_premium">
          {featuredActivity && (
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
                style={{ color: TXT_MUTED }}
              >
                Atividade sugerida hoje
              </p>

              <ActivityCard
                activity={featuredActivity}
                done={doneActivities.has(featuredActivity.id)}
                onToggle={() =>
                  setDoneActivities(prev => {
                    const next = new Set(prev);
                    if (next.has(featuredActivity.id)) next.delete(featuredActivity.id);
                    else next.add(featuredActivity.id);
                    return next;
                  })
                }
              />

              {phase.stimulation.length > 1 && (
                <div className="mt-2 space-y-2">
                  {phase.stimulation
                    .filter(activity => activity.id !== featuredActivity.id)
                    .map(activity => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        done={doneActivities.has(activity.id)}
                        onToggle={() =>
                          setDoneActivities(prev => {
                            const next = new Set(prev);
                            if (next.has(activity.id)) next.delete(activity.id);
                            else next.add(activity.id);
                            return next;
                          })
                        }
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
              style={{ color: TXT_MUTED }}
            >
              Marcos de desenvolvimento
            </p>

            <div
              className="rounded-xl px-3 py-2.5 flex items-start gap-2 mb-3"
              style={{ backgroundColor: MUTED_BG }}
            >
              <span className="text-[13px] mt-0.5 flex-shrink-0">ℹ️</span>
              <p
                className="text-[11px] font-nunito leading-snug"
                style={{ color: TXT_MUTED }}
              >
                Marcos são referências, não obrigações. Cada criança se desenvolve
                no seu ritmo. Consulte o pediatra se tiver dúvidas.
              </p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {domains.map(domain => {
                  const color = DOMAIN_COLORS[domain];
                  const bg = domainBg(domain);
                  const domainMilestones = milestonesByDomain[domain] ?? [];
                  const domainAchieved = domainMilestones.filter(m =>
                    achievedIds.has(m.id)
                  ).length;
                  const isExpanded = expandedDomains.has(domain);

                  return (
                    <div
                      key={domain}
                      className="rounded-2xl overflow-hidden"
                      style={{
                        backgroundColor: CARD_BG,
                        border: `1px solid ${CARD_BORDER}`,
                      }}
                    >
                      <button
                        onClick={() => toggleDomain(domain)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
                        style={{ backgroundColor: isExpanded ? MAUVE_BG : 'transparent' }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] flex-shrink-0"
                          style={{ backgroundColor: bg }}
                        >
                          {DOMAIN_LABELS[domain].split(' ')[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] font-bold font-quicksand"
                            style={{ color: TXT }}
                          >
                            {DOMAIN_LABELS[domain].split(' ').slice(1).join(' ')}
                          </p>
                          <p
                            className="text-[11px] font-nunito"
                            style={{ color: TXT_MUTED }}
                          >
                            {domainAchieved}/{domainMilestones.length} registrados
                          </p>
                        </div>

                        {domainAchieved === domainMilestones.length &&
                          domainMilestones.length > 0 && (
                            <InlineStatusPill
                              label="Completo"
                              variant="active"
                              color={SAGE}
                            />
                          )}

                        <span
                          className="text-[11px] font-nunito"
                          style={{ color: TXT_MUTED }}
                        >
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
                            <div
                              className="px-3 pb-3 pt-2 space-y-2"
                              style={{ borderTop: `1px solid ${CARD_BORDER}` }}
                            >
                              {domainMilestones.map(milestone => (
                                <MilestoneRow
                                  key={milestone.id}
                                  milestone={milestone}
                                  achieved={achievementMap.get(milestone.id)}
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

          {phase.watchpoints.length > 0 && (
            <div>
              <button
                onClick={() => setShowWatchpoints(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                style={{
                  backgroundColor: showWatchpoints ? '#FCEAEA' : CARD_BG,
                  border: `1px solid ${showWatchpoints ? '#f5caca' : CARD_BORDER}`,
                }}
              >
                <span className="text-[18px] flex-shrink-0">⚠️</span>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] font-bold font-quicksand"
                    style={{ color: TXT }}
                  >
                    Sinais para observar
                  </p>
                  <p
                    className="text-[11px] font-nunito"
                    style={{ color: TXT_MUTED }}
                  >
                    Converse com o pediatra se notar algo
                  </p>
                </div>

                <span
                  className="text-[11px] font-nunito"
                  style={{ color: TXT_MUTED }}
                >
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
                      {phase.watchpoints.map(watchpoint => (
                        <div
                          key={watchpoint.id}
                          className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                          style={{
                            backgroundColor: '#FCEAEA',
                            border: '1px solid #f5caca',
                          }}
                        >
                          <span className="text-[14px] flex-shrink-0 mt-0.5">
                            {DOMAIN_LABELS[watchpoint.domain].split(' ')[0]}
                          </span>
                          <p
                            className="text-[12px] font-nunito leading-snug"
                            style={{ color: '#7a3030' }}
                          >
                            {watchpoint.description}
                          </p>
                        </div>
                      ))}

                      <div
                        className="px-3 py-2.5 rounded-xl"
                        style={{ backgroundColor: MUTED_BG }}
                      >
                        <p
                          className="text-[11px] font-nunito leading-snug"
                          style={{ color: TXT_MUTED }}
                        >
                          Esses sinais são referências para conversar com o pediatra
                          — não diagnósticos.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {achieved.length > 0 && (
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
                style={{ color: TXT_MUTED }}
              >
                Conquistas de {childName}
              </p>

              <div className="space-y-2">
                {achieved.slice(0, 6).map(item => {
                  const milestone =
                    phase.milestones.find(m => m.id === item.milestoneId) ??
                    ({
                      id: item.milestoneId,
                      label: item.milestoneLabel,
                      description: item.notes ?? 'Marco registrado',
                      ageHint: item.ageHint ?? 'Registrado',
                      emoji: '🎉',
                      domain: item.domain,
                    } as Milestone);

                  const color = DOMAIN_COLORS[milestone.domain];
                  const bg = domainBg(milestone.domain);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{
                        backgroundColor: bg,
                        border: `1px solid ${CARD_BORDER}`,
                      }}
                    >
                      <span className="text-[18px] flex-shrink-0">🎉</span>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-bold font-quicksand"
                          style={{ color: TXT }}
                        >
                          {milestone.label}
                        </p>
                        <p
                          className="text-[11px] font-nunito mt-0.5"
                          style={{ color: TXT_MUTED }}
                        >
                          {item.achievedAt.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                          })}
                          {item.notes ? ` · ${item.notes}` : ''}
                        </p>
                      </div>

                      <span
                        className="text-[9px] font-bold font-nunito px-2 py-1 rounded-full uppercase"
                        style={{ backgroundColor: CARD_BG, color }}
                      >
                        {DOMAIN_LABELS[milestone.domain].split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && achieved.length === 0 && (
            <div
              className="rounded-2xl px-5 py-8 text-center"
              style={{
                backgroundColor: CARD_BG,
                border: `1px solid ${CARD_BORDER}`,
              }}
            >
              <p className="text-3xl mb-2">⭐</p>
              <p
                className="text-[14px] font-bold font-quicksand"
                style={{ color: TXT }}
              >
                Nenhum marco registrado ainda
              </p>
              <p
                className="text-[12px] mt-1.5 font-nunito leading-snug max-w-[220px] mx-auto"
                style={{ color: TXT_MUTED }}
              >
                Quando {childName} atingir um marco, toque em &quot;Atingido&quot;
                para registrar e guardar a memória.
              </p>
            </div>
          )}
        </PaywallGate>
      </div>

      <AnimatePresence>
        {confirmMilestone && activeChild && user && (
          <MilestoneModal
            milestone={confirmMilestone}
            childId={activeChild.id}
            userId={user.id}
            existingAchievement={editingAchievement}
            onClose={() => setConfirmMilestone(null)}
            onSaved={saved => {
              handleSavedMilestone(saved);
              setConfirmMilestone(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
