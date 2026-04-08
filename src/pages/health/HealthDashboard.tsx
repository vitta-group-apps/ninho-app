/**
 * NINHO — HealthDashboard (Phase 4)
 * /health — febre, sintomas e crescimento.
 */

import React, { useState } from 'react';
import { useNavigate }   from 'react-router-dom';
import { Text }          from '@/design-system/components/ui/Text';
import { Badge }         from '@/design-system/components/ui/Badge';
import { LinkButton }    from '@/design-system/components/ui/LinkButton';
import { FeverLogCard }       from '@/features/health/components/FeverLogCard';
import { SymptomsLogCard }    from '@/features/health/components/SymptomsLogCard';
import { GrowthLogCard }      from '@/features/health/components/GrowthLogCard';
import { useNinhoStore }      from '@/store/useNinhoStore';
import { cn }                 from '@/design-system/lib/utils';

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--gap-md)]">
      <Text variant="caption-medium" color="secondary" as="span" className="uppercase tracking-wider whitespace-nowrap">
        {children}
      </Text>
      <div className="flex-1 h-px bg-ds-neutral-border" />
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--gap-md)] py-16 px-8 text-center">
      <span className="text-5xl" aria-hidden="true">🪺</span>
      <Text variant="h3">Nenhuma criança selecionada</Text>
      <Text variant="body-md-regular" color="secondary">
        Seleciona uma criança no painel de rotina para acompanhar a saúde.
      </Text>
      <LinkButton
        label="Ir para Rotina →"
        linkType="interactive"
        className="mt-2"
        onClick={() => navigate('/routine')}
      />
    </div>
  );
}

type HealthTab = 'illness' | 'growth';

export function HealthDashboard() {
  const { currentChild } = useNinhoStore();
  const [tab, setTab]    = useState<HealthTab>('illness');

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ── header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-ds-pure-white border-b border-ds-neutral-border px-4 py-3">
        <div className="flex items-center gap-[var(--gap-sm)]">
          <div className="flex-1 min-w-0">
            <Text variant="body-lg-semibold" as="h1">Saúde</Text>
            {currentChild && (
              <Text variant="caption-regular" color="secondary" as="p" className="truncate">
                {currentChild.preferred_name ?? currentChild.name}
              </Text>
            )}
          </div>

          {currentChild && (
            <span className="flex items-center gap-[var(--gap-xs)] px-[var(--padding-sm)] py-[var(--padding-xxs)] rounded-ds-pill bg-ds-success-subtle border border-ds-success-border">
              <span className="w-2 h-2 rounded-full bg-ds-success-tint shrink-0" />
              <Text variant="caption-medium" color="success" as="span">
                {currentChild.preferred_name ?? currentChild.name}
              </Text>
            </span>
          )}
        </div>

        {/* tab strip */}
        {currentChild && (
          <div className="flex gap-[var(--gap-xs)] mt-3">
            {([
              { key: 'illness', label: '🤒 Doença' },
              { key: 'growth',  label: '📏 Crescimento' },
            ] as { key: HealthTab; label: string }[]).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex-1 py-[var(--padding-xs)] rounded-[var(--radius-sm)]',
                  'font-body text-text-sm font-medium transition-colors duration-150',
                  tab === t.key
                    ? 'bg-ds-accent-subtle-2 text-ds-accent-fg'
                    : 'bg-ds-neutral-subtle text-ds-neutral-fg hover:bg-ds-neutral-bg-hover',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── body ────────────────────────────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {!currentChild ? (
          <EmptyState />
        ) : tab === 'illness' ? (
          <>
            <SectionLabel>Registar agora</SectionLabel>
            <FeverLogCard    childId={currentChild.id} />
            <SymptomsLogCard childId={currentChild.id} />
          </>
        ) : (
          <>
            <SectionLabel>Medição antropométrica</SectionLabel>
            <GrowthLogCard childId={currentChild.id} />
          </>
        )}
      </main>
    </div>
  );
}
