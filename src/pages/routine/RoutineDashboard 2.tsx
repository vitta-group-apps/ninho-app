/**
 * NINHO — RoutineDashboard (Phase 3)
 * /routine — histórico diário, gestão de logs, animações.
 */

import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast }           from 'sonner';
import { Text }            from '@/design-system/components/ui/Text';
import { Card }            from '@/design-system/components/ui/Card';
import { Badge }           from '@/design-system/components/ui/Badge';
import { Button }          from '@/design-system/components/ui/Button';
import { LinkButton }      from '@/design-system/components/ui/LinkButton';
import { IconButton }      from '@/design-system/components/ui/IconButton';
import { EmptyState }      from '@/design-system/components/ui/EmptyState';
import { SkeletonTimeline } from '@/design-system/components/ui/Skeleton';
import { SleepLogCard, DiaperLogCard, FeedingLogCard } from '@/features/routine/components';
import { DaySelector }       from '@/features/routine/components/DaySelector';
import { EditLogModal }      from '@/features/routine/components/EditLogModal';
import { InsightsSummary }   from '@/features/insights/InsightsSummary';
import { useDailyRoutine } from '@/features/routine/hooks/useDailyRoutine';
import { useRoutineLog }   from '@/features/routine/hooks/useRoutineLog';
import { useNinhoStore }   from '@/store/useNinhoStore';
import type { Child }      from '@/store/useNinhoStore';
import type { AnyRoutineLog } from '@/features/routine/types/routine';
import { cn }              from '@/design-system/lib/utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── log descriptor ──────────────────────────────────────────────────────────

function describeLog(log: AnyRoutineLog): { emoji: string; label: string; detail: string } {
  switch (log.routine_type) {
    case 'sleep': {
      const p = log.payload as Extract<AnyRoutineLog, { routine_type: 'sleep' }>['payload'];
      const parts: string[] = [];
      if (p.location) parts.push({ crib: 'berço', bed: 'cama', stroller: 'carrinho', carrier: 'canguru', arms: 'no colo' }[p.location] ?? p.location);
      if (p.quality)  parts.push({ deep: 'profundo', light: 'leve', restless: 'agitado' }[p.quality] ?? p.quality);
      return { emoji: '🌙', label: 'Sono', detail: parts.join(' · ') || '–' };
    }
    case 'diaper': {
      const p = log.payload as Extract<AnyRoutineLog, { routine_type: 'diaper' }>['payload'];
      const typeLabel = p.type ? { wet: 'xixi', dirty: 'cocô', both: 'xixi + cocô' }[p.type] ?? p.type : '–';
      return { emoji: '🧷', label: 'Fralda', detail: typeLabel };
    }
    case 'feeding': {
      const p = log.payload as Extract<AnyRoutineLog, { routine_type: 'feeding' }>['payload'];
      const methodLabel = p.method ? { breast: '🤱 seio', bottle: '🍼 mamadeira' }[p.method] ?? p.method : '–';
      const extra = p.duration_min ? `${p.duration_min} min` : p.volume_ml ? `${p.volume_ml} ml` : '';
      return { emoji: '🍼', label: 'Alimentação', detail: [methodLabel, extra].filter(Boolean).join(' · ') };
    }
    default:
      return { emoji: '📋', label: log.routine_type, detail: '–' };
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

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l.8 9.2A1 1 0 004.8 14h6.4a1 1 0 001-.8L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11 2l3 3-8 8H3v-3L11 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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

function ChildChip({ child, active, onClick }: { child: Child; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-[var(--gap-xs)] shrink-0',
        'px-[var(--padding-md)] py-[var(--padding-xs)]',
        'rounded-ds-pill border font-body text-text-sm font-medium transition-colors duration-150',
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

// ─── no-child empty state (local wrapper) ────────────────────────────────────

function NoChildEmptyState() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon="🪺"
      title="Nenhuma criança selecionada"
      description="Regista primeiro uma criança para acompanhar a rotina diária."
      cta={{ label: 'Adicionar criança →', onClick: () => navigate('/onboarding/child') }}
    />
  );
}

// ─── timeline + delete/edit ───────────────────────────────────────────────────

function DailyTimeline({
  childId,
  date,
  onEdit,
  refetchKey,
}: {
  childId:    string;
  date:       string;
  onEdit:     (log: AnyRoutineLog) => void;
  refetchKey: number;
}) {
  const sleep   = useDailyRoutine(childId, 'sleep',   date);
  const diaper  = useDailyRoutine(childId, 'diaper',  date);
  const feeding = useDailyRoutine(childId, 'feeding', date);

  const { removeLog } = useRoutineLog();

  const loading = sleep.loading || diaper.loading || feeding.loading;
  const hasMore = sleep.hasMore || diaper.hasMore || feeding.hasMore;

  const merged = useMemo<AnyRoutineLog[]>(() => {
    const all = [
      ...(sleep.logs   as AnyRoutineLog[]),
      ...(diaper.logs  as AnyRoutineLog[]),
      ...(feeding.logs as AnyRoutineLog[]),
    ];
    return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sleep.logs, diaper.logs, feeding.logs, refetchKey]);  // eslint-disable-line

  async function handleDelete(log: AnyRoutineLog) {
    try {
      await removeLog(log.id);
      sleep.refetch();
      diaper.refetch();
      feeding.refetch();
      toast.success('Registo eliminado.');
    } catch {
      toast.error('Erro ao eliminar registo.');
    }
  }

  if (loading && merged.length === 0) {
    return <SkeletonTimeline rows={4} />;
  }

  if (!loading && merged.length === 0) {
    return (
      <Card variant="outlined" padding="none">
        <EmptyState
          icon="📋"
          title="Sem registos"
          description="Nenhum evento registado neste dia."
          compact
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--gap-sm)]">
      <AnimatePresence initial={false}>
        {merged.map((log, i) => {
          const { emoji, label, detail } = describeLog(log);
          const isLast = i === merged.length - 1;

          return (
            <motion.div
              key={log.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex gap-[var(--gap-md)]"
            >
              {/* rail */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-9 h-9 rounded-full bg-ds-neutral-subtle border border-ds-neutral-border flex items-center justify-center text-base">
                  {emoji}
                </div>
                {!isLast && <div className="w-px flex-1 min-h-[16px] bg-ds-neutral-border mt-1" />}
              </div>

              {/* content */}
              <div className={cn('pb-4 flex-1 min-w-0', isLast && 'pb-0')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-[var(--gap-xs)] flex-wrap">
                    <Text variant="body-md-semibold">{label}</Text>
                    <Badge label={formatTime(log.created_at)} variant="neutral" size="sm" />
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton
                      variant="tertiary"
                      size="xs"
                      icon={<EditIcon />}
                      aria-label="Editar registo"
                      onClick={() => onEdit(log)}
                    />
                    <IconButton
                      variant="tertiary"
                      size="xs"
                      icon={<TrashIcon />}
                      aria-label="Eliminar registo"
                      onClick={() => handleDelete(log)}
                    />
                  </div>
                </div>

                <Text variant="caption-regular" color="secondary">{detail}</Text>

                {log.notes && (
                  <Text variant="caption-regular" color="secondary" className="mt-1 italic">
                    "{log.notes}"
                  </Text>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* load more */}
      {hasMore && (
        <div className="pt-2">
          <Button
            label={loading ? '' : 'Carregar mais'}
            variant="tertiary"
            size="sm"
            fullWidth
            loading={loading}
            onClick={() => { sleep.loadMore(); diaper.loadMore(); feeding.loadMore(); }}
          />
        </div>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function RoutineDashboard() {
  const { currentChild, children, setCurrentChild } = useNinhoStore();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [refetchKey,   setRefetchKey]   = useState(0);
  const [editingLog,   setEditingLog]   = useState<AnyRoutineLog | null>(null);

  const isToday           = selectedDate === todayISO();
  const hasMultipleChildren = children.length > 1;

  function onSaved() {
    setRefetchKey(k => k + 1);
  }

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ── sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-ds-pure-white border-b border-ds-neutral-border px-4 py-3">
        <div className="flex items-center gap-[var(--gap-sm)]">
          <Link
            to="/dashboard"
            className="flex items-center justify-center w-8 h-8 rounded-ds-sm text-ds-neutral-fg-strong hover:bg-ds-neutral-subtle transition-colors"
            aria-label="Voltar ao dashboard"
          >
            <BackArrow />
          </Link>

          <div className="flex-1 min-w-0">
            <Text variant="body-lg-semibold" as="h1">Rotina diária</Text>
            <Text variant="caption-regular" color="secondary" as="p" className="truncate">
              {capitalize(formatDate(new Date(selectedDate + 'T12:00:00')))}
            </Text>
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
        </div>
      </header>

      {/* ── body ──────────────────────────────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 py-6 pb-16 space-y-6">

        {/* child switcher */}
        {hasMultipleChildren && (
          <div className="flex gap-[var(--gap-sm)] overflow-x-auto -mx-4 px-4 scrollbar-none">
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

        {/* day selector */}
        <DaySelector value={selectedDate} onChange={setSelectedDate} />

        {!currentChild ? (
          <NoChildEmptyState />
        ) : (
          <>
            {/* insights — só hoje */}
            {isToday && (
              <section>
                <SectionLabel>Resumo do dia</SectionLabel>
                <InsightsSummary childId={currentChild.id} />
              </section>
            )}

            {/* log entry cards — só no dia de hoje */}
            {isToday && (
              <section>
                <SectionLabel>Registar agora</SectionLabel>
                <div className="flex flex-col gap-[var(--gap-md)]">
                  <SleepLogCard   childId={currentChild.id} onSaved={onSaved} />
                  <DiaperLogCard  childId={currentChild.id} onSaved={onSaved} />
                  <FeedingLogCard childId={currentChild.id} onSaved={onSaved} />
                </div>
              </section>
            )}

            {/* timeline do dia */}
            <section>
              <SectionLabel>
                {isToday ? 'Registos de hoje' : `Registos de ${capitalize(formatDate(new Date(selectedDate + 'T12:00:00')))}`}
              </SectionLabel>
              <DailyTimeline
                childId={currentChild.id}
                date={selectedDate}
                onEdit={setEditingLog}
                refetchKey={refetchKey}
              />
            </section>
          </>
        )}
      </main>

      {/* ── edit modal ────────────────────────────────────────────────────── */}
      <EditLogModal
        log={editingLog}
        open={!!editingLog}
        onClose={() => setEditingLog(null)}
        onSaved={onSaved}
      />
    </div>
  );
}
