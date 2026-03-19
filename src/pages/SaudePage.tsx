/**
 * SaudePage — Ninho Health Care Hub
 *
 * IA: vertical sections — zero horizontal tab dependency.
 *
 * Structure:
 *   1. Header: child context + age phase
 *   2. Health overview: 4 status stats (vaccines, consultations, symptoms, growth)
 *   3. Attention / priority layer: what needs follow-up now
 *   4. Vertical expandable sections: Vacinas, Consultas, Sintomas, Medicamentos, Crescimento, Relatório
 *
 * Vaccine logic:
 *   - Age-based: applied = vaccines for ages ≤ child age
 *   - Upcoming: vaccines scheduled within next 3 months
 *   - Pending / overdue: due now or recently
 *   - Optional guidance: mention complementary vaccines
 *
 * Tone: calm, supportive, practical. Never alarmist.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { InlineStatusPill, SectionLabel } from '@/components/ds';
import { getAgeContext } from '@/lib/eventSystem';
import { vaccineSchedule, type VaccineEntry } from '@/data/vaccineSchedule';
import { Skeleton } from '@/components/ui/skeleton';

const SAGE  = 'hsl(152,15%,50%)';
const AMBER = 'hsl(37,90%,55%)';
const MAUVE = 'hsl(270,12%,52%)';

// ─── Private / complementary vaccines (not in SUS) ────────────────────────

const OPTIONAL_VACCINES: { name: string; description: string; ageHint: string }[] = [
  {
    name: 'Meningocócica B (Men B)',
    description: 'Proteção contra meningite B, não disponível no SUS.',
    ageHint: 'A partir de 2 meses',
  },
  {
    name: 'Varicela 2ª dose antecipada',
    description: 'Reforço antecipado disponível na rede particular.',
    ageHint: '15 meses',
  },
  {
    name: 'Hepatite A 2ª dose',
    description: 'Complementar ao calendário SUS, conforme indicação pediátrica.',
    ageHint: '18–24 meses',
  },
  {
    name: 'Influenza anual',
    description: 'Disponível no SUS em campanha. Particular disponível fora do período.',
    ageHint: 'Anual a partir de 6 meses',
  },
];

// ─── Vaccine state helper (age-based, truthful) ───────────────────────────
//
// IMPORTANT: No vaccine is auto-marked as "applied".
// Vaccines are never pre-populated as confirmed doses — that contradicts reality.
// The caregiver must manually confirm application.
//
// What we CAN infer by age:
//   - "due now or recently" (ageMonths within window): "upcoming/due"
//   - "scheduled for later": "future"
//   - Vaccines from past age windows appear as "due" until manually confirmed
//
// "applied" list is ALWAYS empty until real DB records exist.
function computeVaccineState(ageMonths: number) {
  // Vaccines that are due now (scheduled age ≤ child age) — need confirmation
  const due = vaccineSchedule.filter(v => (v.ageMonths ?? 0) <= ageMonths);
  // Vaccines coming up in the next 3 months
  const upcoming = vaccineSchedule.filter(v => {
    const vm = v.ageMonths ?? 0;
    return vm > ageMonths && vm <= ageMonths + 3;
  });
  // Vaccines scheduled further ahead
  const future = vaccineSchedule.filter(v => (v.ageMonths ?? 0) > ageMonths + 3);
  // applied = empty until user marks them
  const applied: typeof due = [];
  return { applied, due, upcoming, future };
}

// ─── Helper: symptom quick-log ────────────────────────────────────────────

const SYMPTOM_CHIPS = [
  { emoji: '🌡️', label: 'Febre' },
  { emoji: '😮‍💨', label: 'Tosse' },
  { emoji: '🤧', label: 'Coriza' },
  { emoji: '🤢', label: 'Vômito' },
  { emoji: '💩', label: 'Diarreia' },
  { emoji: '😭', label: 'Choro intenso' },
  { emoji: '😴', label: 'Sonolência' },
  { emoji: '🍽️', label: 'Sem apetite' },
  { emoji: '🔴', label: 'Assadura' },
  { emoji: '😤', label: 'Irritabilidade' },
];

// ─── Sub-components ────────────────────────────────────────────────────────

function OverviewStat({
  emoji, label, value, sub, color, onTap, urgent,
}: {
  emoji: string; label: string; value: string;
  sub: string; color: string; onTap?: () => void; urgent?: boolean;
}) {
  return (
    <button
      onClick={onTap}
      className="rounded-2xl p-3 text-left w-full transition-all active:scale-[0.98]"
      style={{
        backgroundColor: urgent
          ? `color-mix(in srgb, ${AMBER} 7%, hsl(var(--card)))`
          : 'hsl(var(--card))',
        border: urgent
          ? `1px solid color-mix(in srgb, ${AMBER} 22%, transparent)`
          : '1px solid hsl(var(--border))',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[15px]">{emoji}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-nunito leading-none">
          {label}
        </p>
      </div>
      <p className="text-[22px] font-bold font-quicksand leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground font-nunito mt-1 leading-tight">{sub}</p>
    </button>
  );
}

function PriorityCard({
  emoji, title, body, ctaLabel, onCta,
}: {
  emoji: string; title: string; body: string;
  ctaLabel?: string; onCta?: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
      style={{
        backgroundColor: `color-mix(in srgb, ${AMBER} 8%, hsl(var(--card)))`,
        border: `1px solid color-mix(in srgb, ${AMBER} 22%, transparent)`,
      }}
    >
      <span className="text-[18px] mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand text-foreground leading-snug">{title}</p>
        <p className="text-[12px] text-muted-foreground font-nunito mt-0.5 leading-snug">{body}</p>
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="text-[11px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 self-center transition-all active:scale-95"
          style={{ backgroundColor: AMBER }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

function ExpandableSection({
  id, emoji, title, statusPill, summary, open, onToggle, children,
}: {
  id: string; emoji: string; title: string;
  statusPill?: React.ReactNode; summary?: string;
  open: boolean; onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4 text-left transition-colors"
        style={{ backgroundColor: open ? 'hsl(var(--muted) / 0.5)' : 'transparent' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[17px] flex-shrink-0"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold font-quicksand text-foreground">{title}</p>
            {statusPill}
          </div>
          {summary && (
            <p className="text-[11px] text-muted-foreground font-nunito mt-0.5 line-clamp-1">{summary}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {open ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`${id}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
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

// ─── Vaccine row ──────────────────────────────────────────────────────────

function VaccineRow({
  vaccine, state,
}: {
  vaccine: VaccineEntry;
  state: 'applied' | 'upcoming' | 'future';
}) {
  const stateConfig = {
    applied:  { color: SAGE,  label: 'Aplicada', opacity: 'opacity-70' },
    upcoming: { color: AMBER, label: 'Próxima',  opacity: '' },
    future:   { color: MAUVE, label: 'Futura',   opacity: 'opacity-60' },
  }[state];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border ${stateConfig.opacity}`}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] flex-shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${stateConfig.color} 14%, transparent)` }}
      >
        {state === 'applied' ? '✓' : '💉'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand text-foreground leading-tight">
          {vaccine.shortName}
          {vaccine.doses && (
            <span className="font-normal text-muted-foreground"> · {vaccine.doses}</span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground font-nunito mt-0.5">{vaccine.ageLabel}</p>
      </div>
      <InlineStatusPill label={stateConfig.label} variant={state === 'applied' ? 'active' : 'paused'} color={stateConfig.color} />
    </div>
  );
}

// ─── Growth log modal state ────────────────────────────────────────────────

interface GrowthMeasurement {
  weight?: string;
  height?: string;
  note?: string;
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function SaudePage() {
  const navigate = useNavigate();
  const { activeChild } = useActiveChild();
  const childName = activeChild?.name ?? 'seu filho';
  const ageCtx    = activeChild ? getAgeContext(activeChild.birth_date) : null;
  const ageMonths = ageCtx?.months ?? 0;

  const vaccineState = computeVaccineState(ageMonths);

  const [openSection, setOpenSection] = useState<string | null>(null);
  function toggle(id: string) {
    setOpenSection(prev => prev === id ? null : id);
  }

  const [showApplied, setShowApplied]   = useState(false);
  const [showFuture, setShowFuture]     = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  // Growth form
  const [growthForm, setGrowthForm] = useState<GrowthMeasurement>({});
  const [growthSaving, setGrowthSaving] = useState(false);

  // Symptom quick-log
  const [loggedSymptoms, setLoggedSymptoms] = useState<string[]>([]);
  const [symptomNote, setSymptomNote] = useState('');

  // Quick note / report note
  const [quickNote, setQuickNote]   = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [savedNotes, setSavedNotes] = useState<{ text: string; date: Date }[]>([]);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);

  async function saveQuickNote() {
    if (!quickNote.trim() || !activeChild) return;
    setSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const now = new Date();
      await supabase.from('health_logs').insert({
        child_id: activeChild.id,
        author_id: user.id,
        type: 'note',
        occurred_at: now.toISOString(),
        details: { note: quickNote.trim(), source: 'report' },
      });
      // Add to local list immediately for instant feedback
      setSavedNotes(prev => [{ text: quickNote.trim(), date: now }, ...prev]);
      setQuickNote('');
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 2500);
    } catch { /* silent */ } finally {
      setSavingNote(false);
    }
  }

  async function saveGrowthMeasurement() {
    if (!activeChild || (!growthForm.weight && !growthForm.height)) return;
    setGrowthSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('health_logs').insert({
        child_id: activeChild.id,
        author_id: user.id,
        type: 'note',
        occurred_at: new Date().toISOString(),
        details: {
          type: 'growth',
          weight_kg: growthForm.weight ? parseFloat(growthForm.weight) : null,
          height_cm: growthForm.height ? parseFloat(growthForm.height) : null,
          note: growthForm.note ?? null,
        },
      });
      setGrowthForm({});
    } catch { /* silent */ } finally {
      setGrowthSaving(false);
    }
  }

  // Priority items (health-specific)
  const priorityItems: { emoji: string; title: string; body: string; cta: string; sectionId: string }[] = [];

  if (vaccineState.upcoming.length > 0) {
    const next = vaccineState.upcoming[0];
    priorityItems.push({
      emoji: '💉',
      title: `${vaccineState.upcoming.length} vacina${vaccineState.upcoming.length > 1 ? 's' : ''} próxima${vaccineState.upcoming.length > 1 ? 's' : ''}`,
      body: `${next.shortName} (${next.doses}) está prevista para ${next.ageLabel}. Confirme com o pediatra.`,
      cta: 'Ver',
      sectionId: 'vaccines',
    });
  }

  priorityItems.push({
    emoji: '🩺',
    title: 'Nenhuma consulta agendada',
    body: 'Consultas regulares ajudam a acompanhar o desenvolvimento e prevenir problemas.',
    cta: 'Agendar',
    sectionId: 'appointments',
  });

  if (ageMonths >= 1) {
    priorityItems.push({
      emoji: '📏',
      title: 'Acompanhe o crescimento',
      body: `Registre peso e altura de ${childName} para facilitar o acompanhamento pediátrico.`,
      cta: 'Registrar',
      sectionId: 'growth',
    });
  }

  return (
    <div className="min-h-screen pb-28 bg-background">

      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          background: 'linear-gradient(135deg, hsl(152,20%,36%), hsl(152,15%,48%))',
        }}
      >
        <h1 className="text-[22px] font-bold text-white font-quicksand">Saúde</h1>
        <p className="text-[13px] text-white/65 mt-0.5 font-nunito">
          {activeChild ? activeChild.name : 'Acompanhamento'}
          {ageCtx && <span className="opacity-75"> · {ageCtx.phaseHint}</span>}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* ── 1. HEALTH OVERVIEW ────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
            Visão geral
          </p>
          <div className="grid grid-cols-2 gap-3">
        <OverviewStat
              emoji="💉" label="Vacinas"
              value={vaccineState.due.length > 0 ? `${vaccineState.due.length}` : '—'}
              sub={vaccineState.upcoming.length > 0
                ? `${vaccineState.upcoming.length} próxima${vaccineState.upcoming.length > 1 ? 's' : ''}`
                : 'Calendário em dia'}
              color={vaccineState.upcoming.length > 0 ? AMBER : SAGE}
              urgent={vaccineState.upcoming.length > 0}
              onTap={() => toggle('vaccines')}
            />
            <OverviewStat
              emoji="🩺" label="Consultas"
              value="0"
              sub="Nenhuma agendada"
              color={MAUVE}
              urgent
              onTap={() => toggle('appointments')}
            />
            <OverviewStat
              emoji="🌡️" label="Sintomas"
              value={loggedSymptoms.length > 0 ? `${loggedSymptoms.length}` : '—'}
              sub={loggedSymptoms.length > 0 ? 'Registrados' : 'Nenhum recente'}
              color={SAGE}
              onTap={() => toggle('symptoms')}
            />
            <OverviewStat
              emoji="📏" label="Crescimento"
              value="—"
              sub="Sem medições"
              color={MAUVE}
              onTap={() => toggle('growth')}
            />
          </div>
        </div>

        {/* ── 2. ATTENTION ──────────────────────────────────────────── */}
        {priorityItems.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
              Atenção
            </p>
            <div className="space-y-2">
              {priorityItems.slice(0, 3).map((item, i) => (
                <PriorityCard
                  key={i}
                  emoji={item.emoji}
                  title={item.title}
                  body={item.body}
                  ctaLabel={item.cta}
                  onCta={() => {
                    setOpenSection(item.sectionId);
                    setTimeout(() => {
                      document.getElementById(`section-${item.sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── 3. VACINAS ────────────────────────────────────────────── */}
        <div id="section-vaccines">
          <ExpandableSection
            id="vaccines"
            emoji="💉"
            title="Vacinas"
            statusPill={
              vaccineState.upcoming.length > 0
                ? <InlineStatusPill label={`${vaccineState.upcoming.length} próxima${vaccineState.upcoming.length > 1 ? 's' : ''}`} variant="paused" color={AMBER} />
                : <InlineStatusPill label="Em dia" variant="active" color={SAGE} />
            }
            summary={`Calendário SUS · ${vaccineState.applied.length} aplicadas`}
            open={openSection === 'vaccines'}
            onToggle={() => toggle('vaccines')}
          >
            {/* Stats */}
            <div
              className="flex gap-4 rounded-xl p-3"
              style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}
            >
              <div className="flex-1 text-center">
                <p className="text-[22px] font-bold font-quicksand" style={{ color: SAGE }}>
                  {vaccineState.applied.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground font-nunito mt-0.5">
                  Aplicadas
                </p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1 text-center">
                <p className="text-[22px] font-bold font-quicksand" style={{ color: AMBER }}>
                  {vaccineState.upcoming.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground font-nunito mt-0.5">
                  Próximas
                </p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1 text-center">
                <p className="text-[22px] font-bold font-quicksand" style={{ color: MAUVE }}>
                  {vaccineState.future.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground font-nunito mt-0.5">
                  Futuras
                </p>
              </div>
            </div>

            {/* Upcoming doses */}
            {vaccineState.upcoming.length > 0 && (
              <div>
                <SectionLabel>Próximas doses</SectionLabel>
                <div className="space-y-2">
                  {vaccineState.upcoming.map(v => (
                    <VaccineRow key={v.id} vaccine={v} state="upcoming" />
                  ))}
                </div>
              </div>
            )}

            {/* Applied toggle */}
            <button
              onClick={() => setShowApplied(v => !v)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground font-nunito"
            >
              <span>{showApplied ? '▾' : '▸'}</span>
              Aplicadas ({vaccineState.applied.length})
            </button>
            {showApplied && (
              <div className="space-y-2">
                {vaccineState.applied.map(v => (
                  <VaccineRow key={v.id} vaccine={v} state="applied" />
                ))}
              </div>
            )}

            {/* Future toggle */}
            {vaccineState.future.length > 0 && (
              <>
                <button
                  onClick={() => setShowFuture(v => !v)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground font-nunito"
                >
                  <span>{showFuture ? '▾' : '▸'}</span>
                  Futuras ({vaccineState.future.length})
                </button>
                {showFuture && (
                  <div className="space-y-2">
                    {vaccineState.future.map(v => (
                      <VaccineRow key={v.id} vaccine={v} state="future" />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Optional vaccines guidance */}
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{
                backgroundColor: `color-mix(in srgb, ${MAUVE} 7%, hsl(var(--card)))`,
                border: `1px solid color-mix(in srgb, ${MAUVE} 18%, transparent)`,
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold font-quicksand text-foreground">
                  Vacinas complementares
                </p>
                <button
                  onClick={() => setShowOptional(v => !v)}
                  className="text-[11px] font-bold text-muted-foreground font-nunito"
                >
                  {showOptional ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground font-nunito leading-relaxed">
                Além do calendário SUS, existem vacinas complementares recomendadas por pediatras. Converse com o profissional de saúde sobre o que pode ser indicado para {childName}.
              </p>
              {showOptional && (
                <div className="space-y-2 mt-1">
                  {OPTIONAL_VACCINES.map(v => (
                    <div key={v.name} className="flex gap-2 py-2 border-t border-border/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold font-quicksand text-foreground">{v.name}</p>
                        <p className="text-[11px] text-muted-foreground font-nunito mt-0.5 leading-snug">{v.description}</p>
                        <p className="text-[10px] font-bold font-nunito mt-1" style={{ color: MAUVE }}>{v.ageHint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ExpandableSection>
        </div>

        {/* ── 4. CONSULTAS ──────────────────────────────────────────── */}
        <div id="section-appointments">
          <ExpandableSection
            id="appointments"
            emoji="🩺"
            title="Consultas"
            statusPill={<InlineStatusPill label="Nenhuma agendada" variant="paused" color={MAUVE} />}
            summary="Registre e acompanhe as consultas"
            open={openSection === 'appointments'}
            onToggle={() => toggle('appointments')}
          >
            <button
              className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
              style={{ backgroundColor: SAGE }}
            >
              Registrar consulta
            </button>
            <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
              <p className="text-3xl mb-2">🩺</p>
              <p className="text-[14px] font-bold font-quicksand text-foreground">
                Nenhuma consulta registrada
              </p>
              <p className="text-[12px] mt-1.5 text-muted-foreground font-nunito leading-snug max-w-[220px] mx-auto">
                Acompanhar as consultas facilita o histórico e prepara melhor as conversas com o pediatra.
              </p>
            </div>
          </ExpandableSection>
        </div>

        {/* ── 5. SINTOMAS ───────────────────────────────────────────── */}
        <div id="section-symptoms">
          <ExpandableSection
            id="symptoms"
            emoji="🌡️"
            title="Sintomas"
            statusPill={
              loggedSymptoms.length > 0
                ? <InlineStatusPill label={`${loggedSymptoms.length} registrado${loggedSymptoms.length > 1 ? 's' : ''}`} variant="paused" color={AMBER} />
                : <InlineStatusPill label="Nenhum recente" variant="active" color={SAGE} />
            }
            summary="Registre sintomas para facilitar a consulta"
            open={openSection === 'symptoms'}
            onToggle={() => toggle('symptoms')}
          >
            <div>
              <SectionLabel>Registrar sintoma</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_CHIPS.map(s => {
                  const isLogged = loggedSymptoms.includes(s.label);
                  return (
                    <button
                      key={s.label}
                      onClick={() => setLoggedSymptoms(prev =>
                        isLogged ? prev.filter(l => l !== s.label) : [...prev, s.label]
                      )}
                      className="py-2 px-3.5 rounded-2xl text-[12px] font-bold font-nunito transition-all active:scale-95"
                      style={{
                        backgroundColor: isLogged
                          ? `color-mix(in srgb, ${AMBER} 18%, transparent)`
                          : 'hsl(var(--muted))',
                        color: isLogged ? AMBER : 'hsl(var(--foreground))',
                        border: `1.5px solid ${isLogged ? `color-mix(in srgb, ${AMBER} 35%, transparent)` : 'transparent'}`,
                      }}
                    >
                      {s.emoji} {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loggedSymptoms.length > 0 && (
              <div className="space-y-2.5">
                <textarea
                  value={symptomNote}
                  onChange={e => setSymptomNote(e.target.value)}
                  placeholder="Observações adicionais (opcional)..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito bg-muted text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary transition-colors"
                />
                <button
                  className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
                  style={{ backgroundColor: SAGE }}
                >
                  Salvar sintomas — {loggedSymptoms.join(', ')}
                </button>
              </div>
            )}

            <div>
              <SectionLabel>Histórico</SectionLabel>
              <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
                <p className="text-3xl mb-2">🌡️</p>
                <p className="text-[14px] font-bold font-quicksand text-foreground">
                  Nenhum sintoma registrado
                </p>
                <p className="text-[12px] mt-1 text-muted-foreground font-nunito leading-snug max-w-[200px] mx-auto">
                  Registrar sintomas facilita a conversa com o pediatra e cria um histórico útil.
                </p>
              </div>
            </div>
          </ExpandableSection>
        </div>

        {/* ── 6. MEDICAMENTOS ───────────────────────────────────────── */}
        <ExpandableSection
          id="medications"
          emoji="💊"
          title="Medicamentos"
          statusPill={<InlineStatusPill label="Nenhum ativo" variant="active" color={SAGE} />}
          summary="Medicamentos em uso e histórico"
          open={openSection === 'medications'}
          onToggle={() => toggle('medications')}
        >
          <button
            className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
            style={{ backgroundColor: SAGE }}
          >
            Adicionar medicamento
          </button>
          <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
            <p className="text-3xl mb-2">💊</p>
            <p className="text-[14px] font-bold font-quicksand text-foreground">
              Nenhum medicamento ativo
            </p>
            <p className="text-[12px] mt-1.5 text-muted-foreground font-nunito leading-snug max-w-[200px] mx-auto">
              Adicione medicamentos recorrentes ou pontuais para acompanhar horários e posologias.
            </p>
          </div>
        </ExpandableSection>

        {/* ── 7. CRESCIMENTO ────────────────────────────────────────── */}
        <div id="section-growth">
          <ExpandableSection
            id="growth"
            emoji="📏"
            title="Crescimento"
            statusPill={<InlineStatusPill label="Sem medições" variant="paused" color={MAUVE} />}
            summary={`Peso e altura de ${childName}`}
            open={openSection === 'growth'}
            onToggle={() => toggle('growth')}
          >
            {/* Quick measurement form */}
            <div>
              <SectionLabel>Registrar medição</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-bold font-nunito text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Peso (kg)
                  </p>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 5.2"
                    value={growthForm.weight ?? ''}
                    onChange={e => setGrowthForm(f => ({ ...f, weight: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito bg-muted text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-bold font-nunito text-muted-foreground mb-1.5 uppercase tracking-wide">
                    Altura (cm)
                  </p>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 58.5"
                    value={growthForm.height ?? ''}
                    onChange={e => setGrowthForm(f => ({ ...f, height: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito bg-muted text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Observação (opcional)"
                value={growthForm.note ?? ''}
                onChange={e => setGrowthForm(f => ({ ...f, note: e.target.value }))}
                className="mt-3 w-full px-4 py-3 rounded-2xl text-[13px] font-nunito bg-muted text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors"
              />
              <button
                onClick={saveGrowthMeasurement}
                disabled={growthSaving || (!growthForm.weight && !growthForm.height)}
                className="mt-3 w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: SAGE }}
              >
                {growthSaving ? 'Salvando…' : 'Salvar medição'}
              </button>
            </div>

            {/* History */}
            <div>
              <SectionLabel>Histórico</SectionLabel>
              <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
                <p className="text-3xl mb-2">📏</p>
                <p className="text-[14px] font-bold font-quicksand text-foreground">
                  Nenhuma medição registrada
                </p>
                <p className="text-[12px] mt-1 text-muted-foreground font-nunito leading-snug max-w-[200px] mx-auto">
                  Acompanhe o crescimento registrando peso e altura regularmente.
                </p>
              </div>
            </div>
          </ExpandableSection>
        </div>

        {/* ── 8. RELATÓRIO MÉDICO ───────────────────────────────────── */}
        <ExpandableSection
          id="report"
          emoji="📋"
          title="Relatório médico"
          statusPill={<InlineStatusPill label="Vazio" variant="paused" color={MAUVE} />}
          summary="Notas e eventos para compartilhar com o pediatra"
          open={openSection === 'report'}
          onToggle={() => toggle('report')}
        >
          {/* Quick note */}
          <div>
            <SectionLabel>Adicionar nota livre</SectionLabel>
            <textarea
              value={quickNote}
              onChange={e => setQuickNote(e.target.value)}
              placeholder="Ex: mamou menos hoje, irritado após vacina, assadura piorou..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito bg-muted text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary transition-colors"
            />
            <button
              onClick={saveQuickNote}
              disabled={savingNote || !quickNote.trim()}
              className="mt-2 w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE }}
            >
              {savingNote ? 'Salvando…' : 'Salvar nota'}
            </button>
          </div>

          {/* How-to guidance */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}
          >
            <p className="text-[12px] font-bold font-nunito text-foreground">Como usar o relatório</p>
            <p className="text-[11px] text-muted-foreground font-nunito leading-relaxed">
              Ative <strong>"Incluir no relatório"</strong> em registros de amamentação, fralda, sono ou sintoma para montar um histórico estruturado para a consulta.
            </p>
          </div>

          {/* Marked events */}
          <div>
            <SectionLabel>Eventos marcados</SectionLabel>
            <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
              <p className="text-4xl mb-3">📄</p>
              <p className="text-[15px] font-bold font-quicksand text-foreground">Relatório vazio</p>
              <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug max-w-[220px] mx-auto">
                Marque eventos relevantes durante os registros para montar o relatório da próxima consulta.
              </p>
            </div>
          </div>

          {/* What to include guidance */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold font-nunito text-muted-foreground uppercase tracking-wide">
              O que vale incluir
            </p>
            {[
              '🤱 Mamadas com dificuldade ou comportamento diferente',
              '💩 Fraldas com cor ou consistência incomum',
              '🌡️ Febre ou sintomas que persistem',
              '💊 Medicamentos e possíveis reações',
              '😴 Sono muito longo ou muitos despertares noturnos',
              '📏 Medições de peso e altura recentes',
            ].map(item => (
              <p key={item} className="text-[11px] text-muted-foreground font-nunito">{item}</p>
            ))}
          </div>
        </ExpandableSection>

      </div>
    </div>
  );
}
