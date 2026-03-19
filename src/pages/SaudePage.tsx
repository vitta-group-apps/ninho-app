/**
 * SaudePage — Ninho health assistant.
 *
 * IA: sections-based (no horizontal tab rail).
 *  1. Health overview — status summary
 *  2. Priority layer — what needs attention
 *  3. Vaccines — SUS + private guidance
 *  4. Consultations
 *  5. Symptoms
 *  6. Medications
 *  7. Growth
 *  8. Report
 *
 * Each section has: short summary · status · clear CTA · empty state.
 * The user reads top-to-bottom, not left-to-right.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { InlineStatusPill, SectionLabel } from '@/components/ds';
import { getAgeContext } from '@/lib/eventSystem';

const SAGE     = 'hsl(152,15%,50%)';
const AMBER    = 'hsl(37,90%,55%)';
const MAUVE    = 'hsl(270,12%,52%)';

// ─── Mock vaccine data (will be DB-driven in future sprint) ─────────────────

const UPCOMING_VACCINES = [
  { id: 'penta-3', name: 'Pentavalente', dose: '3ª dose', age: '6 meses' },
  { id: 'vip-3',   name: 'VIP',          dose: '3ª dose', age: '6 meses' },
  { id: 'pneumo3', name: 'Pneumo 10',    dose: '3ª dose', age: '6 meses' },
];

const COMPLETED_VACCINES = [
  { id: 'bcg',      name: 'BCG',          dose: 'Dose única', age: 'Ao nascer' },
  { id: 'hepb-0',   name: 'Hepatite B',   dose: '1ª dose',    age: 'Ao nascer' },
  { id: 'penta-1',  name: 'Pentavalente', dose: '1ª dose',    age: '2 meses' },
  { id: 'vip-1',    name: 'VIP',          dose: '1ª dose',    age: '2 meses' },
  { id: 'pneumo-1', name: 'Pneumo 10',    dose: '1ª dose',    age: '2 meses' },
  { id: 'rota-1',   name: 'Rotavírus',    dose: '1ª dose',    age: '2 meses' },
  { id: 'penta-2',  name: 'Pentavalente', dose: '2ª dose',    age: '4 meses' },
  { id: 'vip-2',    name: 'VIP',          dose: '2ª dose',    age: '4 meses' },
  { id: 'pneumo-2', name: 'Pneumo 10',    dose: '2ª dose',    age: '4 meses' },
  { id: 'rota-2',   name: 'Rotavírus',    dose: '2ª dose',    age: '4 meses' },
];

// ─── Expandable section wrapper ─────────────────────────────────────────────

function ExpandableSection({
  id,
  emoji,
  title,
  statusPill,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  emoji: string;
  title: string;
  statusPill?: React.ReactNode;
  summary?: string;
  open: boolean;
  onToggle: () => void;
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
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
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
            <p className="text-[12px] text-muted-foreground font-nunito mt-0.5 truncate">{summary}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {open
            ? <ChevronDownIcon className="w-4 h-4" />
            : <ChevronRightIcon className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key={`${id}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-5 pt-2 space-y-4"
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

// ─── Priority item ───────────────────────────────────────────────────────────

function PriorityItem({
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
        border: `1px solid color-mix(in srgb, ${AMBER} 20%, transparent)`,
      }}
    >
      <span className="text-[18px] mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold font-quicksand text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground font-nunito mt-0.5 leading-snug">{body}</p>
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="text-[11px] font-bold font-nunito px-2.5 py-1.5 rounded-xl text-white flex-shrink-0 transition-all active:scale-95"
          style={{ backgroundColor: AMBER }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SaudePage() {
  const navigate = useNavigate();
  const { activeChild } = useActiveChild();
  const childName = activeChild?.name ?? 'seu filho';
  const ageCtx = activeChild ? getAgeContext(activeChild.birth_date) : null;

  // Track which section is open
  const [openSection, setOpenSection] = useState<string | null>('vaccines');
  function toggle(id: string) {
    setOpenSection(prev => prev === id ? null : id);
  }

  const [showCompletedVaccines, setShowCompletedVaccines] = useState(false);

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          background: 'linear-gradient(135deg, hsl(152,20%,38%), hsl(152,15%,50%))',
        }}
      >
        <h1 className="text-[22px] font-bold text-white font-quicksand">Saúde</h1>
        <p className="text-[13px] text-white/70 mt-0.5 font-nunito">
          {activeChild ? activeChild.name : 'Acompanhamento'}
          {ageCtx && <span className="ml-1 opacity-70">· {ageCtx.phaseHint}</span>}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-4">

        {/* ── Health overview card ──────────────────────────────────── */}
        <div className="rounded-2xl p-4 bg-card border border-border space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito">
            Visão geral
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                emoji: '💉', label: 'Vacinas',
                value: `${COMPLETED_VACCINES.length}`, unit: 'aplicadas',
                sub: `${UPCOMING_VACCINES.length} pendentes`,
                color: SAGE,
              },
              {
                emoji: '📅', label: 'Consultas',
                value: '0', unit: 'agendadas',
                sub: 'Nenhuma consulta marcada',
                color: MAUVE,
              },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-xl p-3"
                style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[16px]">{item.emoji}</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-nunito">
                    {item.label}
                  </p>
                </div>
                <p className="text-[24px] font-bold font-quicksand leading-none" style={{ color: item.color }}>
                  {item.value}
                </p>
                <p className="text-[10px] text-muted-foreground font-nunito mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Priority layer — what needs attention ─────────────────── */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito">
            Atenção
          </p>
          <PriorityItem
            emoji="💉"
            title={`${UPCOMING_VACCINES.length} vacinas pendentes`}
            body={`Próxima dose prevista para ${UPCOMING_VACCINES[0]?.age ?? 'em breve'}. Confirme com o pediatra.`}
            ctaLabel="Ver vacinas"
            onCta={() => setOpenSection('vaccines')}
          />
          <PriorityItem
            emoji="📅"
            title="Nenhuma consulta agendada"
            body="Agende a próxima consulta do pediatra para acompanhar o desenvolvimento."
            ctaLabel="Agendar"
            onCta={() => setOpenSection('appointments')}
          />
        </div>

        {/* ── Sections ──────────────────────────────────────────────── */}

        {/* Vaccines */}
        <ExpandableSection
          id="vaccines"
          emoji="💉"
          title="Vacinas"
          statusPill={
            UPCOMING_VACCINES.length > 0
              ? <InlineStatusPill label={`${UPCOMING_VACCINES.length} pendentes`} variant="paused" color={AMBER} />
              : <InlineStatusPill label="Em dia" variant="active" color={SAGE} />
          }
          summary={`Calendário SUS · ${COMPLETED_VACCINES.length} aplicadas`}
          open={openSection === 'vaccines'}
          onToggle={() => toggle('vaccines')}
        >
          {/* SUS summary */}
          <div
            className="flex gap-3 rounded-xl p-3"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}
          >
            <div className="flex-1 text-center">
              <p className="text-[22px] font-bold font-quicksand" style={{ color: SAGE }}>
                {COMPLETED_VACCINES.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground font-nunito mt-0.5">
                Aplicadas
              </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[22px] font-bold font-quicksand" style={{ color: AMBER }}>
                {UPCOMING_VACCINES.length}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground font-nunito mt-0.5">
                Pendentes
              </p>
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <SectionLabel>Próximas doses</SectionLabel>
            <div className="space-y-2">
              {UPCOMING_VACCINES.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${AMBER} 14%, transparent)` }}
                  >
                    💉
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold font-quicksand text-foreground">{v.name}</p>
                    <p className="text-[11px] text-muted-foreground font-nunito">{v.dose} · {v.age}</p>
                  </div>
                  <InlineStatusPill label="Pendente" variant="paused" color={AMBER} />
                </div>
              ))}
            </div>
          </div>

          {/* Completed toggle */}
          <button
            onClick={() => setShowCompletedVaccines(v => !v)}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground font-nunito"
          >
            <span>{showCompletedVaccines ? '▾' : '▸'}</span>
            Aplicadas ({COMPLETED_VACCINES.length})
          </button>
          {showCompletedVaccines && (
            <div className="space-y-2">
              {COMPLETED_VACCINES.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border opacity-75">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px] flex-shrink-0"
                    style={{ backgroundColor: `color-mix(in srgb, ${SAGE} 12%, transparent)` }}
                  >
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold font-quicksand text-foreground">{v.name}</p>
                    <p className="text-[11px] text-muted-foreground font-nunito">{v.dose} · {v.age}</p>
                  </div>
                  <InlineStatusPill label="Feita" variant="active" color={SAGE} />
                </div>
              ))}
            </div>
          )}

          {/* Private vaccine guidance */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{
              backgroundColor: `color-mix(in srgb, ${MAUVE} 8%, hsl(var(--card)))`,
              border: `1px solid color-mix(in srgb, ${MAUVE} 18%, transparent)`,
            }}
          >
            <p className="text-[12px] font-bold font-quicksand text-foreground">Vacinas particulares</p>
            <p className="text-[11px] text-muted-foreground font-nunito leading-relaxed">
              Além do calendário SUS, existem vacinas complementares recomendadas por pediatras em algumas fases. Converse com o profissional de saúde sobre o que pode ser indicado para {childName}.
            </p>
          </div>
        </ExpandableSection>

        {/* Consultations */}
        <ExpandableSection
          id="appointments"
          emoji="🩺"
          title="Consultas"
          statusPill={<InlineStatusPill label="Nenhuma agendada" variant="paused" color={MAUVE} />}
          summary="Adicione a próxima consulta do pediatra"
          open={openSection === 'appointments'}
          onToggle={() => toggle('appointments')}
        >
          <button
            className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
            style={{ backgroundColor: SAGE }}
          >
            Agendar consulta
          </button>

          <div>
            <SectionLabel>Próximas</SectionLabel>
            <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-[14px] font-bold font-quicksand text-foreground">
                Nenhuma consulta agendada
              </p>
              <p className="text-[12px] mt-1 text-muted-foreground font-nunito leading-snug">
                Registre a próxima consulta para acompanhar o calendário de saúde.
              </p>
            </div>
          </div>

          <div>
            <SectionLabel>Histórico</SectionLabel>
            <div className="rounded-2xl px-5 py-5 text-center bg-muted/40 border border-border">
              <p className="text-[12px] text-muted-foreground font-nunito">
                Consultas realizadas aparecerão aqui.
              </p>
            </div>
          </div>
        </ExpandableSection>

        {/* Symptoms */}
        <ExpandableSection
          id="symptoms"
          emoji="🌡️"
          title="Sintomas"
          statusPill={<InlineStatusPill label="Nenhum recente" variant="active" color={SAGE} />}
          summary="Registre e acompanhe sintomas"
          open={openSection === 'symptoms'}
          onToggle={() => toggle('symptoms')}
        >
          <div className="space-y-2">
            <SectionLabel>Registro rápido</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {[
                '🌡️ Febre', '😮‍💨 Tosse', '🤧 Coriza',
                '🤢 Vômito', '💩 Diarreia', '😭 Choro intenso',
                '😴 Sonolência', '🍽️ Sem apetite',
              ].map(s => (
                <button
                  key={s}
                  className="py-2.5 px-4 rounded-2xl text-[12px] font-bold font-nunito transition-all active:scale-95 bg-muted text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Histórico de sintomas</SectionLabel>
            <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
              <p className="text-3xl mb-2">🌡️</p>
              <p className="text-[14px] font-bold font-quicksand text-foreground">
                Nenhum sintoma registrado
              </p>
              <p className="text-[12px] mt-1 text-muted-foreground font-nunito">
                Registre sintomas para compartilhar com o pediatra.
              </p>
            </div>
          </div>
        </ExpandableSection>

        {/* Medications */}
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
            <p className="text-[12px] mt-1 text-muted-foreground font-nunito">
              Adicione medicamentos recorrentes ou pontuais para acompanhar o uso.
            </p>
          </div>
        </ExpandableSection>

        {/* Growth */}
        <ExpandableSection
          id="growth"
          emoji="📏"
          title="Crescimento"
          statusPill={<InlineStatusPill label="Sem medições" variant="paused" color={MAUVE} />}
          summary="Peso e altura de {childName}"
          open={openSection === 'growth'}
          onToggle={() => toggle('growth')}
        >
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '⚖️', label: 'Último peso', value: '—', unit: 'kg' },
              { emoji: '📏', label: 'Última altura', value: '—', unit: 'cm' },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-3 bg-card border border-border">
                <p className="text-[18px]">{m.emoji}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-nunito mt-2">
                  {m.label}
                </p>
                <p className="text-[22px] font-bold font-quicksand text-foreground opacity-35 mt-0.5">
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <SectionLabel>Medições de {childName}</SectionLabel>
            <button
              className="text-[12px] font-bold font-nunito px-3 py-1.5 rounded-xl text-white transition-all active:scale-95"
              style={{ backgroundColor: SAGE }}
            >
              Registrar medição
            </button>
          </div>
          <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
            <p className="text-3xl mb-2">📏</p>
            <p className="text-[14px] font-bold font-quicksand text-foreground">
              Nenhuma medição registrada
            </p>
            <p className="text-[12px] mt-1 text-muted-foreground font-nunito">
              Registre peso e altura regularmente para acompanhar o crescimento.
            </p>
          </div>
        </ExpandableSection>

        {/* Report */}
        <ExpandableSection
          id="report"
          emoji="📋"
          title="Relatório médico"
          statusPill={<InlineStatusPill label="Vazio" variant="paused" color={MAUVE} />}
          summary="Eventos marcados para o pediatra"
          open={openSection === 'report'}
          onToggle={() => toggle('report')}
        >
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}
          >
            <p className="text-[12px] font-bold font-nunito text-foreground">Como usar o relatório</p>
            <p className="text-[11px] text-muted-foreground font-nunito leading-relaxed">
              Ative <strong>"Incluir no relatório"</strong> em qualquer registro de amamentação, fralda, sono ou sintoma para que ele apareça aqui.
            </p>
          </div>

          <div>
            <SectionLabel>Eventos marcados</SectionLabel>
            <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
              <p className="text-4xl mb-3">📄</p>
              <p className="text-[15px] font-bold font-quicksand text-foreground">Relatório vazio</p>
              <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug max-w-[220px] mx-auto">
                Marque eventos como relevantes durante os registros para montar o relatório da consulta.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-bold font-nunito text-muted-foreground uppercase tracking-wide">
              O que vale incluir
            </p>
            {[
              '🤱 Mamadas com dificuldade ou observação',
              '💩 Fraldas com cor incomum',
              '🌡️ Febre ou sintomas registrados',
              '💊 Medicamentos e reações',
              '😴 Sono muito longo ou com muitos despertares',
            ].map(item => (
              <p key={item} className="text-[11px] text-muted-foreground font-nunito">{item}</p>
            ))}
          </div>
        </ExpandableSection>

      </div>
    </div>
  );
}
