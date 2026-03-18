/**
 * SaudePage — Real MVP health section.
 *
 * 6 sections: Vacinas · Consultas · Sintomas · Medicamentos · Crescimento · Relatório
 * Uses DS components only: InlineStatusPill, SectionLabel, StickyFooterCTA, ChipGroup
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { InlineStatusPill, SectionLabel } from '@/components/ds';

type HealthTab = 'vaccines' | 'appointments' | 'symptoms' | 'medications' | 'growth' | 'report';

const TABS: { id: HealthTab; label: string; Icon: React.ElementType }[] = [
  { id: 'vaccines',     label: 'Vacinas',     Icon: ShieldCheckIcon },
  { id: 'appointments', label: 'Consultas',   Icon: CalendarDaysIcon },
  { id: 'symptoms',     label: 'Sintomas',    Icon: ExclamationTriangleIcon },
  { id: 'medications',  label: 'Medicamentos',Icon: BeakerIcon },
  { id: 'growth',       label: 'Crescimento', Icon: ChartBarIcon },
  { id: 'report',       label: 'Relatório',   Icon: DocumentTextIcon },
];

const SAGE = 'hsl(152,15%,50%)';

// ─── Vaccine statuses ────────────────────────────────────────────────────────

const UPCOMING_VACCINES = [
  { id: 'penta-3', name: 'Pentavalente', dose: '3ª dose', age: '6 meses', status: 'upcoming' as const },
  { id: 'vip-3',   name: 'VIP',          dose: '3ª dose', age: '6 meses', status: 'upcoming' as const },
  { id: 'pneumo3', name: 'Pneumo 10',    dose: '3ª dose', age: '6 meses', status: 'upcoming' as const },
];

const COMPLETED_VACCINES = [
  { id: 'bcg',      name: 'BCG',          dose: 'Dose única',  age: 'Ao nascer', status: 'done' as const },
  { id: 'hepb-0',   name: 'Hepatite B',   dose: '1ª dose',     age: 'Ao nascer', status: 'done' as const },
  { id: 'penta-1',  name: 'Pentavalente', dose: '1ª dose',     age: '2 meses',   status: 'done' as const },
  { id: 'vip-1',    name: 'VIP',          dose: '1ª dose',     age: '2 meses',   status: 'done' as const },
  { id: 'pneumo-1', name: 'Pneumo 10',    dose: '1ª dose',     age: '2 meses',   status: 'done' as const },
  { id: 'rota-1',   name: 'Rotavírus',    dose: '1ª dose',     age: '2 meses',   status: 'done' as const },
  { id: 'penta-2',  name: 'Pentavalente', dose: '2ª dose',     age: '4 meses',   status: 'done' as const },
  { id: 'vip-2',    name: 'VIP',          dose: '2ª dose',     age: '4 meses',   status: 'done' as const },
  { id: 'pneumo-2', name: 'Pneumo 10',    dose: '2ª dose',     age: '4 meses',   status: 'done' as const },
  { id: 'rota-2',   name: 'Rotavírus',    dose: '2ª dose',     age: '4 meses',   status: 'done' as const },
];

function VaccinesSection({ childName }: { childName: string }) {
  const [showCompleted, setShowCompleted] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">
      <div className="rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-bold font-quicksand text-foreground">Calendário SUS 2026</p>
          <InlineStatusPill label="Atualizado" variant="active" color={SAGE} />
        </div>
        <p className="text-[12px] text-muted-foreground font-nunito">Acompanhe as doses de {childName}</p>
        <div className="flex gap-3 mt-3">
          <div className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: `color-mix(in srgb, ${SAGE} 10%, transparent)` }}>
            <p className="text-[22px] font-bold font-quicksand" style={{ color: SAGE }}>{COMPLETED_VACCINES.length}</p>
            <p className="text-[10px] font-nunito text-muted-foreground font-bold uppercase tracking-wide mt-0.5">Aplicadas</p>
          </div>
          <div className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <p className="text-[22px] font-bold font-quicksand text-foreground">{UPCOMING_VACCINES.length}</p>
            <p className="text-[10px] font-nunito text-muted-foreground font-bold uppercase tracking-wide mt-0.5">Próximas</p>
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Próximas vacinas</SectionLabel>
        <div className="space-y-2">
          {UPCOMING_VACCINES.map(v => (
            <div key={v.id} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-card border border-border">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, hsl(37,90%,55%) 14%, transparent)` }}>💉</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold font-quicksand text-foreground">{v.name}</p>
                <p className="text-[11px] text-muted-foreground font-nunito">{v.dose} · {v.age}</p>
              </div>
              <InlineStatusPill label="Pendente" variant="paused" color="hsl(37,90%,55%)" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowCompleted(v => !v)}
          className="flex items-center gap-2 mb-3"
        >
          <SectionLabel>{showCompleted ? '▾' : '▸'} Aplicadas ({COMPLETED_VACCINES.length})</SectionLabel>
        </button>
        {showCompleted && (
          <div className="space-y-2">
            {COMPLETED_VACCINES.map(v => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border opacity-80">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px] flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${SAGE} 12%, transparent)` }}>✓</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold font-quicksand text-foreground">{v.name}</p>
                  <p className="text-[11px] text-muted-foreground font-nunito">{v.dose} · {v.age}</p>
                </div>
                <InlineStatusPill label="Feita" variant="active" color={SAGE} />
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Appointments ─────────────────────────────────────────────────────────────

function AppointmentsSection({ childName }: { childName: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">
      <div className="rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]" style={{ backgroundColor: 'hsl(var(--muted))' }}>🩺</div>
          <div>
            <p className="text-[14px] font-bold font-quicksand text-foreground">Consultas de {childName}</p>
            <p className="text-[12px] text-muted-foreground font-nunito">Agendadas e realizadas</p>
          </div>
        </div>
        <button
          className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
          style={{ backgroundColor: SAGE }}
        >
          + Agendar consulta
        </button>
      </div>

      <div>
        <SectionLabel>Próximas</SectionLabel>
        <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-[14px] font-bold font-quicksand text-foreground">Nenhuma consulta agendada</p>
          <p className="text-[12px] mt-1 text-muted-foreground font-nunito">Adicione a próxima consulta do pediatra.</p>
        </div>
      </div>

      <div>
        <SectionLabel>Histórico</SectionLabel>
        <div className="rounded-2xl px-5 py-6 text-center bg-muted/50 border border-border">
          <p className="text-[12px] text-muted-foreground font-nunito">Consultas realizadas aparecerão aqui.</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Symptoms ────────────────────────────────────────────────────────────────

function SymptomsSection() {
  const SYMPTOM_OPTIONS = [
    { label: '🌡️ Febre', color: 'hsl(0,70%,55%)' },
    { label: '😮‍💨 Tosse', color: 'hsl(200,50%,50%)' },
    { label: '🤧 Coriza', color: 'hsl(200,50%,50%)' },
    { label: '🤢 Vômito', color: 'hsl(120,40%,45%)' },
    { label: '💩 Diarreia', color: 'hsl(32,70%,50%)' },
    { label: '😭 Choro excessivo', color: 'hsl(270,30%,50%)' },
    { label: '😴 Sonolência', color: 'hsl(270,12%,42%)' },
    { label: '🍽️ Sem apetite', color: 'hsl(32,60%,50%)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">
      <div className="rounded-2xl p-4 bg-card border border-border">
        <p className="text-[14px] font-bold font-quicksand text-foreground mb-1">Registro rápido</p>
        <p className="text-[12px] text-muted-foreground font-nunito mb-4">Toque para registrar um sintoma agora</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map(s => (
            <button
              key={s.label}
              className="py-2.5 px-4 rounded-2xl text-[12px] font-bold font-nunito transition-all active:scale-95 bg-muted text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Histórico de sintomas</SectionLabel>
        <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
          <p className="text-3xl mb-2">🌡️</p>
          <p className="text-[14px] font-bold font-quicksand text-foreground">Nenhum sintoma registrado</p>
          <p className="text-[12px] mt-1 text-muted-foreground font-nunito">Registre sintomas para compartilhar com o pediatra.</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Medications ─────────────────────────────────────────────────────────────

function MedicationsSection() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">
      <div className="rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]" style={{ backgroundColor: 'hsl(var(--muted))' }}>💊</div>
          <div>
            <p className="text-[14px] font-bold font-quicksand text-foreground">Medicamentos</p>
            <p className="text-[12px] text-muted-foreground font-nunito">Recorrentes e pontuais</p>
          </div>
        </div>
        <button
          className="w-full py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95"
          style={{ backgroundColor: SAGE }}
        >
          + Adicionar medicamento
        </button>
      </div>

      <div>
        <SectionLabel>Em uso</SectionLabel>
        <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
          <p className="text-3xl mb-2">💊</p>
          <p className="text-[14px] font-bold font-quicksand text-foreground">Nenhum medicamento ativo</p>
          <p className="text-[12px] mt-1 text-muted-foreground font-nunito">Adicione medicamentos recorrentes ou pontuais.</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Growth ──────────────────────────────────────────────────────────────────

function GrowthSection({ childName }: { childName: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">
      <div className="grid grid-cols-2 gap-3">
        {[
          { emoji: '⚖️', label: 'Último peso', value: '—', unit: 'kg' },
          { emoji: '📏', label: 'Última altura', value: '—', unit: 'cm' },
        ].map(m => (
          <div key={m.label} className="rounded-2xl p-4 bg-card border border-border">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[16px] mb-3" style={{ backgroundColor: 'hsl(var(--muted))' }}>{m.emoji}</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-nunito">{m.label}</p>
            <p className="text-[20px] font-bold font-quicksand text-foreground opacity-35 mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Medições de {childName}</SectionLabel>
          <button
            className="text-[12px] font-bold font-nunito px-3 py-1.5 rounded-xl text-white transition-all active:scale-95"
            style={{ backgroundColor: SAGE }}
          >
            + Medir
          </button>
        </div>
        <div className="rounded-2xl px-5 py-8 text-center bg-card border border-border">
          <p className="text-3xl mb-2">📏</p>
          <p className="text-[14px] font-bold font-quicksand text-foreground">Nenhuma medição registrada</p>
          <p className="text-[12px] mt-1 text-muted-foreground font-nunito">Registre peso e altura para acompanhar o crescimento.</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Report ──────────────────────────────────────────────────────────────────

function ReportSection() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pt-5 space-y-5 pb-6">
      <div className="rounded-2xl p-4 bg-card border border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]" style={{ backgroundColor: 'hsl(var(--muted))' }}>📋</div>
          <div>
            <p className="text-[14px] font-bold font-quicksand text-foreground">Relatório médico</p>
            <p className="text-[12px] text-muted-foreground font-nunito">Eventos marcados para o pediatra</p>
          </div>
        </div>
        <p className="text-[12px] text-muted-foreground font-nunito leading-relaxed">
          Ative <strong>"Incluir no relatório"</strong> em qualquer registro de amamentação, fralda, sono, sintoma ou consulta para que ele apareça aqui.
        </p>
      </div>

      <div>
        <SectionLabel>Eventos marcados</SectionLabel>
        <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-[15px] font-bold font-quicksand text-foreground">Relatório vazio</p>
          <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug max-w-[220px] mx-auto">
            Marque eventos como relevantes durante os registros para montar o relatório.
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-4 bg-muted/60 border border-border space-y-2">
        <p className="text-[12px] font-bold font-nunito text-foreground">O que incluir no relatório?</p>
        {[
          '🤱 Mamadas com dificuldade ou observação',
          '💩 Fraldas com cor ou consistência incomum',
          '🌡️ Febre ou sintomas registrados',
          '💊 Medicamentos e reações',
          '😴 Sono muito longo ou com muitos despertares',
        ].map(item => (
          <p key={item} className="text-[11px] text-muted-foreground font-nunito">{item}</p>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SaudePage() {
  const [activeTab, setActiveTab] = useState<HealthTab>('vaccines');
  const { activeChild } = useActiveChild();
  const childName = activeChild?.name ?? 'seu filho';

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
          {activeChild ? activeChild.name : 'Acompanhamento médico'}
        </p>
      </div>

      {/* Tabs — horizontal scroll */}
      <div
        className="flex border-b overflow-x-auto"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5 text-[11px] font-bold transition-colors relative font-nunito"
              style={{ color: isActive ? SAGE : 'hsl(var(--muted-foreground))' }}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="health-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: SAGE }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'vaccines'     && <VaccinesSection childName={childName} />}
          {activeTab === 'appointments' && <AppointmentsSection childName={childName} />}
          {activeTab === 'symptoms'     && <SymptomsSection />}
          {activeTab === 'medications'  && <MedicationsSection />}
          {activeTab === 'growth'       && <GrowthSection childName={childName} />}
          {activeTab === 'report'       && <ReportSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
