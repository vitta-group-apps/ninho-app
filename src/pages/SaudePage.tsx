/**
 * SaudePage — Structural shell for health section.
 *
 * Architecture:
 *  - Overview header
 *  - Section tabs: Vacinas · Consultas · Sintomas · Crescimento · Relatório
 *  - Meaningful empty states per section
 *  - Scalable for future feature depth
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useActiveChild } from '@/contexts/ActiveChildContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type HealthTab = 'vaccines' | 'appointments' | 'symptoms' | 'growth' | 'report';

const TABS: { id: HealthTab; label: string; Icon: React.ElementType }[] = [
  { id: 'vaccines',      label: 'Vacinas',    Icon: ShieldCheckIcon },
  { id: 'appointments',  label: 'Consultas',  Icon: CalendarDaysIcon },
  { id: 'symptoms',      label: 'Sintomas',   Icon: ExclamationTriangleIcon },
  { id: 'growth',        label: 'Crescimento',Icon: ChartBarIcon },
  { id: 'report',        label: 'Relatório',  Icon: DocumentTextIcon },
];

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  emoji, title, description, action,
}: {
  emoji: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center px-8 pt-12 pb-6"
    >
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 text-4xl"
        style={{ backgroundColor: 'hsl(var(--muted))' }}
      >
        {emoji}
      </div>
      <p className="text-lg font-bold mb-2"
        style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
        {title}
      </p>
      <p className="text-sm leading-relaxed"
        style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
          style={{ backgroundColor: 'hsl(152,15%,55%)', color: 'white', fontFamily: 'Nunito, sans-serif' }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// ─── Section content ──────────────────────────────────────────────────────────

function VaccinesSection({ childName }: { childName: string }) {
  return (
    <>
      <div className="px-5 py-4 rounded-2xl mx-5 mt-5"
        style={{ backgroundColor: 'hsl(152,15%,55%,0.1)', border: '1px solid hsl(152,15%,55%,0.25)' }}>
        <p className="text-sm font-semibold" style={{ color: 'hsl(152,15%,40%)', fontFamily: 'Nunito, sans-serif' }}>
          📅 Calendário SUS 2026 disponível para {childName}
        </p>
        <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          Visualize e acompanhe o calendário vacinal
        </p>
      </div>
      <EmptyState
        emoji="💉"
        title="Nenhuma vacina registrada ainda"
        description={`Acompanhe o calendário vacinal de ${childName} e registre cada dose aplicada para manter o histórico completo.`}
        action={{ label: 'Ver calendário vacinal', onClick: () => {} }}
      />
    </>
  );
}

function AppointmentsSection({ childName }: { childName: string }) {
  return (
    <EmptyState
      emoji="🩺"
      title="Nenhuma consulta agendada"
      description={`Registre as consultas de ${childName} e tenha todo o histórico médico em um só lugar.`}
      action={{ label: 'Adicionar consulta', onClick: () => {} }}
    />
  );
}

function SymptomsSection() {
  return (
    <EmptyState
      emoji="🌡️"
      title="Nenhum sintoma registrado"
      description="Registre febre, tosse, ou outros sintomas para manter um histórico que pode ser compartilhado com o pediatra."
      action={{ label: 'Registrar sintoma', onClick: () => {} }}
    />
  );
}

function GrowthSection({ childName }: { childName: string }) {
  return (
    <EmptyState
      emoji="📏"
      title="Nenhuma medição registrada"
      description={`Acompanhe o crescimento de ${childName} com peso e altura para gerar curvas de desenvolvimento.`}
      action={{ label: 'Adicionar medição', onClick: () => {} }}
    />
  );
}

function ReportSection() {
  return (
    <EmptyState
      emoji="📋"
      title="Relatório médico"
      description="Quando você marcar eventos para incluir no relatório, eles aparecerão aqui prontos para compartilhar com o pediatra."
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SAGE_HEX = 'hsl(152,15%,50%)';

export default function SaudePage() {
  const [activeTab, setActiveTab] = useState<HealthTab>('vaccines');
  const { activeChild } = useActiveChild();
  const childName = activeChild?.name ?? 'seu filho';

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          background: 'linear-gradient(135deg, hsl(152,20%,42%), hsl(152,15%,55%))',
        }}
      >
        <h1 className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Quicksand, sans-serif' }}>Saúde</h1>
        <p className="text-sm text-white/70 mt-0.5"
          style={{ fontFamily: 'Nunito, sans-serif' }}>
          {activeChild ? activeChild.name : 'Acompanhamento médico'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b overflow-x-auto"
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold transition-colors relative"
              style={{
                color: isActive ? SAGE_HEX : 'hsl(var(--muted-foreground))',
                fontFamily: 'Nunito, sans-serif',
              }}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div layoutId="health-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: SAGE_HEX }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          {activeTab === 'vaccines'     && <VaccinesSection childName={childName} />}
          {activeTab === 'appointments' && <AppointmentsSection childName={childName} />}
          {activeTab === 'symptoms'     && <SymptomsSection />}
          {activeTab === 'growth'       && <GrowthSection childName={childName} />}
          {activeTab === 'report'       && <ReportSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
