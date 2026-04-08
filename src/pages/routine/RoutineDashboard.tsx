/**
 * NINHO — RoutineDashboard (Phase 2)
 * /routine — visão do dia: registar sono, fralda e alimentação.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Text }    from '@/design-system/components/ui/Text';
import { Card }    from '@/design-system/components/ui/Card';
import { Badge }   from '@/design-system/components/ui/Badge';
import { SpinnerRound } from '@/design-system/components/ui/Spinner';
import { SleepLogCard, DiaperLogCard, FeedingLogCard } from '@/features/routine/components';
import { useTodayRoutine } from '@/features/routine/hooks/useTodayRoutine';
import { useNinhoStore }   from '@/store/useNinhoStore';
import type { Child } from '@/store/useNinhoStore';
import type { TypedRoutineLog } from '@/features/routine/types/routine';
import { cn } from '@/design-system/lib/utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-PT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── timeline entry descriptor ───────────────────────────────────────────────

type AnyLog = TypedRoutineLog<'sleep'> | TypedRoutineLog<'diaper'> | TypedRoutineLog<'feeding'>;

function describeLog(log: AnyLog): { emoji: string; label: string; detail: string } {
  switch (log.routine_type) {
    case 'sleep': {
      const p = log.payload as TypedRoutineLog<'sleep'>['payload'];
      const parts: string[] = [];
      if (p.location) parts.push({ crib: 'berço', bed: 'cama', stroller: 'carrinho', carrier: 'canguru', arms: 'no colo' }[p.location] ?? p.location);
      if (p.quality)  parts.push({ deep: 'profundo', light: 'leve', restless: 'agitado' }[p.quality] ?? p.quality);
      return { emoji: '🌙', label: 'Sono', detail: parts.join(' · ') || '–' };
    }
    case 'diaper': {
      const p = log.payload as TypedRoutineLog<'diaper'>['payload'];
      const typeLabel = p.type ? { wet: 'xixi', dirty: 'cocô', both: 'xixi + cocô' }[p.type] ?? p.type : '–';
      return { emoji: '🧷', label: 'Fralda', detail: typeLabel };
    }
    case 'feeding': {
      const p = log.payload as TypedRoutineLog<'feeding'>['payload'];
      const methodLabel = p.method ? { breast: '🤱 seio', bottle: '🍼 mamadeira' }[p.method] ?? p.method : '–';
      const extra = p.duration_min ? `${p.duration_min} min` : p.volume_ml ? `${p.volume_ml} ml` : '';
      return { emoji: '🍼', label: 'Alimentação', detail: [methodLabel, extra].filter(Boolean).join(' · ') };
    }
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChildChip({ child, active, onClick }: { child: Child; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-[var(--gap-xs)] shrink-0',
        'px-[var(--padding-md)] py-[var(--padding-xs)]',
        'rounded-ds-pill border font-body text-text-sm font-medium',
        'transition-colors duration-150',
        active
          ? 'bg-ds-accent-subtle-2 border-ds-accent-tint text-ds-accent-fg'
          : 'bg-ds-pure-white border-ds-neutral-border text-ds-neutral-fg-strong hover:bg-ds-neutral-subtle',
      )}
    >
      <span className="w-5 h-5 rounded-full bg-ds-accent-subtle flex items-center justify-center text-text-xs font-semibold text-ds-accent-fg shrink-0">
        {(child.preferred_name ?? child.name).charAt(0).toUpperCase()}
      </span>
      {child.preferred_name ?? child.name}
    </button>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--gap-md)] py-16 px-8 text-center">
      <span className="text-5xl" aria-hidden="true">🪺</span>
      <Text variant="h3" color="default">Nenhuma criança selecionada</Text>
      <Text variant="body-md-regular" color="secondary">
        Regista primeiro uma criança no teu perfil para começares a acompanhar a rotina diária.
      </Text>
      <Link
        to="/onboarding/child"
        className="mt-2 text-ds-accent-fg font-body font-semibold text-text-md underline-offset-2 hover:underline"
      >
        Adicionar criança →
      </Link>
    </div>
  );
}

// ─── today's timeline ─────────────────────────────────────────────────────────

function TodayTimeline({ childId, refetchKey }: { childId: string; refetchKey: number }) {
  const { logs: sleepLogs,   loading: l1 } = useTodayRoutine(childId, 'sleep');
  const { logs: diaperLogs,  loading: l2 } = useTodayRoutine(childId, 'diaper');
  const { logs: feedingLogs, loading: l3 } = useTodayRoutine(childId, 'feeding');

  const loading = l1 || l2 || l3;

  const merged = useMemo(() => {
    const all = [
      ...sleepLogs   as AnyLog[],
      ...diaperLogs  as AnyLog[],
      ...feedingLogs as AnyLog[],
    ];
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sleepLogs, diaperLogs, feedingLogs]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <SpinnerRound size="md" />
      </div>
    );
  }

  if (merged.length === 0) {
    return (
      <Card variant="outlined" padding="md">
        <div className="flex flex-col items-center gap-[var(--gap-sm)] py-4 text-center">
          <span className="text-3xl" aria-hidden="true">📋</span>
          <Text variant="body-md-regular" color="secondary">
            Nenhum registo hoje. Usa os cards acima para começar.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--gap-sm)]">
      {merged.map((log, i) => {
        const { emoji, label, detail } = describeLog(log);
        const isLast = i === merged.length - 1;
        return (
          <div key={log.id} className="flex gap-[var(--gap-md)]">
            {/* timeline rail */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-ds-neutral-subtle border border-ds-neutral-border flex items-center justify-center text-base shrink-0">
                {emoji}
              </div>
              {!isLast && <div className="w-px flex-1 bg-ds-neutral-border mt-1" />}
            </div>

            {/* content */}
            <div className={cn('pb-4 flex-1', isLast && 'pb-0')}>
              <div className="flex items-center gap-[var(--gap-xs)] mb-[var(--gap-xxs)]">
                <Text variant="body-md-semibold">{label}</Text>
                <Badge label={formatTime(log.created_at)} variant="neutral" size="sm" />
              </div>
              <Text variant="caption-regular" color="secondary">{detail}</Text>
              {log.notes && (
                <Text variant="caption-regular" color="secondary" className="mt-1 italic">
                  "{log.notes}"
                </Text>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[var(--gap-sm)] mb-[var(--gap-md)]">
      <Text variant="caption-medium" color="secondary" as="span" className="uppercase tracking-wider">
        {children}
      </Text>
      <div className="flex-1 h-px bg-ds-neutral-border" />
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function RoutineDashboard() {
  const { currentChild, children, setCurrentChild } = useNinhoStore();

  // refetch timeline after a log is saved
  const [refetchKey, setRefetchKey] = useState(0);
  const onSaved = () => setRefetchKey(k => k + 1);

  const hasMultipleChildren = children.length > 1;
  const today = capitalize(formatDate(new Date()));

  return (
    <div className="min-h-screen bg-background">

      {/* ── sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-ds-pure-white border-b border-ds-neutral-border px-4 py-3 flex items-center gap-[var(--gap-sm)]">
        <Link
          to="/dashboard"
          className="flex items-center justify-center w-8 h-8 rounded-ds-sm text-ds-neutral-fg-strong hover:bg-ds-neutral-subtle transition-colors"
          aria-label="Voltar ao dashboard"
        >
          <BackArrow />
        </Link>

        <div className="flex-1 min-w-0">
          <Text variant="body-lg-semibold" as="h1">Rotina do dia</Text>
          <Text variant="caption-regular" color="secondary" as="p" className="truncate">{today}</Text>
        </div>

        {currentChild && (
          <span className="flex items-center gap-[var(--gap-xs)] px-[var(--padding-sm)] py-[var(--padding-xxs)] rounded-ds-pill bg-ds-accent-subtle border border-ds-accent-border">
            <span className="w-4 h-4 rounded-full bg-ds-accent-tint flex items-center justify-center text-[10px] font-bold text-ds-on-tint-white shrink-0">
              {(currentChild.preferred_name ?? currentChild.name).charAt(0).toUpperCase()}
            </span>
            <Text variant="caption-medium" color="accent" as="span">
              {currentChild.preferred_name ?? currentChild.name}
            </Text>
          </span>
        )}
      </header>

      {/* ── page body ─────────────────────────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-8 pb-16">

        {/* child selector — only if family has > 1 child */}
        {hasMultipleChildren && (
          <div className="flex gap-[var(--gap-sm)] overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {children.map(child => (
              <ChildChip
                key={child.id}
                child={child}
                active={child.id === currentChild?.id}
                onClick={() => setCurrentChild(child)}
              />
            ))}
          </div>
        )}

        {/* ── no child ──────────────────────────────────────────────────── */}
        {!currentChild ? (
          <EmptyState />
        ) : (
          <>
            {/* ── log entry cards ─────────────────────────────────────── */}
            <section>
              <SectionLabel>Registar agora</SectionLabel>
              <div className="flex flex-col gap-[var(--gap-md)]">
                <SleepLogCard   childId={currentChild.id} onSaved={onSaved} />
                <DiaperLogCard  childId={currentChild.id} onSaved={onSaved} />
                <FeedingLogCard childId={currentChild.id} onSaved={onSaved} />
              </div>
            </section>

            {/* ── today's timeline ────────────────────────────────────── */}
            <section>
              <SectionLabel>Registos de hoje</SectionLabel>
              <TodayTimeline childId={currentChild.id} refetchKey={refetchKey} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
