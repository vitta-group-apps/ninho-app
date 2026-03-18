/**
 * RotinaPage — Ninho DS v2 intelligent routine timeline.
 *
 * Intelligence v2:
 * - Search input filters events by type/notes
 * - ChipGroup filters: event type + time of day
 * - Events grouped by time of day (Manhã / Tarde / Noite / Madrugada)
 * - SectionLabel used for group headers
 * - DayInsights surfaced via SummaryMetricCard
 * - Sorting: newest first (default), toggle to chronological
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { FeedDetailSheet } from '@/components/routine/FeedDetailSheet';
import { EventCard } from '@/components/events/EventCard';
import { ActiveSessionBanner } from '@/components/layout/ActiveSessionBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtTimeSince, parsePayload } from '@/lib/routineUtils';
import { SummaryMetricCard, SectionLabel } from '@/components/ds';
import { ChipGroup } from '@/components/ds/ChipGroup';
import type { RoutineLog } from '@/lib/eventSystem';
import {
  groupLogsByTimeOfDay,
  TIME_OF_DAY_EMOJI,
  analyzeDayPatterns,
  type TimeOfDay,
} from '@/lib/eventSystem';

const FEED_COLOR   = 'hsl(152,15%,55%)';
const SLEEP_COLOR  = 'hsl(270,12%,42%)';
const DIAPER_COLOR = 'hsl(32,80%,57%)';

// ─── Filter config ────────────────────────────────────────────────────────
const TYPE_FILTER_OPTIONS = [
  { value: 'all',    label: 'Todos' },
  { value: 'feed',   label: '🤱 Alimentação' },
  { value: 'sleep',  label: '😴 Sono' },
  { value: 'diaper', label: '🧷 Fralda' },
];

const PERIOD_OPTIONS = [
  { value: 'today',  label: 'Hoje' },
  { value: 'week',   label: '7 dias' },
  { value: 'month',  label: '30 dias' },
];

const TOD_OPTIONS: { value: string; label: string }[] = [
  { value: 'Manhã',     label: '🌅 Manhã' },
  { value: 'Tarde',     label: '☀️ Tarde' },
  { value: 'Noite',     label: '🌙 Noite' },
  { value: 'Madrugada', label: '🌃 Madrugada' },
];

// ─── Daily Stats row ───────────────────────────────────────────────────────
function DailyStats({ logs }: { logs: RoutineLog[] }) {
  const feeds   = logs.filter(l => l.type === 'feed').length;
  const diapers = logs.filter(l => l.type === 'diaper').length;
  const sleepSec = logs.filter(l => l.type === 'sleep' && l.end_time).reduce((acc, l) => {
    return acc + Math.floor((new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000);
  }, 0);
  const h = Math.floor(sleepSec / 3600);
  const m = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel = sleepSec > 0 ? (h > 0 ? `${h}h ${m}m` : `${m}m`) : '—';

  const insights = analyzeDayPatterns(logs);

  return (
    <div className="flex gap-2.5 mb-4">
      <SummaryMetricCard
        emoji="🤱" label="Mamadas"
        value={feeds > 0 ? `${feeds}×` : '—'}
        sub={insights.avgFeedIntervalMin ? `~${insights.avgFeedIntervalMin}min entre mamadas` : undefined}
        accentColor={FEED_COLOR}
        empty={feeds === 0}
      />
      <SummaryMetricCard
        emoji="🧷" label="Fraldas"
        value={diapers > 0 ? `${diapers}×` : '—'}
        accentColor={DIAPER_COLOR}
        empty={diapers === 0}
      />
      <SummaryMetricCard
        emoji="😴" label="Sono"
        value={sleepLabel}
        sub={insights.hasLongSleep ? 'Sono longo detectado' : undefined}
        accentColor={SLEEP_COLOR}
        empty={sleepSec === 0}
      />
    </div>
  );
}

// ─── FAB ──────────────────────────────────────────────────────────────────
function FAB({ onBreastfeed, onBottle, onSleep, onDiaper }: {
  onBreastfeed: () => void; onBottle: () => void; onSleep: () => void; onDiaper: () => void;
}) {
  const [open, setOpen] = useState(false);
  const actions = [
    { emoji: '🤱', label: 'Amamentar', onClick: onBreastfeed, color: FEED_COLOR },
    { emoji: '🍼', label: 'Mamadeira',  onClick: onBottle,     color: 'hsl(200,40%,50%)' },
    { emoji: '😴', label: 'Sono',       onClick: onSleep,      color: SLEEP_COLOR },
    { emoji: '🧷', label: 'Fralda',     onClick: onDiaper,     color: DIAPER_COLOR },
  ];

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOpen(false)} />}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {open && actions.map((a, i) => (
            <motion.div key={a.label}
              initial={{ opacity: 0, x: 12, scale: 0.88 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.9 }}
              transition={{ duration: 0.15, delay: i * 0.04 }}
              className="flex items-center gap-2.5"
            >
              <span
                className="text-[12px] font-bold px-3 py-1.5 rounded-full font-nunito"
                style={{
                  color: a.color,
                  backgroundColor: 'hsl(var(--card))',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                  border: `1px solid color-mix(in srgb, ${a.color} 20%, transparent)`,
                }}
              >
                {a.label}
              </span>
              <button
                onClick={() => { a.onClick(); setOpen(false); }}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 text-white"
                style={{
                  backgroundColor: a.color,
                  boxShadow: `0 3px 10px color-mix(in srgb, ${a.color} 40%, transparent)`,
                }}
              >
                <span className="text-xl">{a.emoji}</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        <button
          onClick={() => setOpen(v => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 text-white"
          style={{
            backgroundColor: 'hsl(270,12%,42%)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <PlusIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </motion.div>
        </button>
      </div>
    </>
  );
}

// ─── Main RotinaPage ───────────────────────────────────────────────────────
export default function RotinaPage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading } = useActiveChild();
  const [allLogs, setAllLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [detailLog, setDetailLog] = useState<RoutineLog | null>(null);
  const [detailKind, setDetailKind] = useState<'breastfeed' | null>(null);

  // ─ Filters ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [todFilter, setTodFilter] = useState('');
  const [period, setPeriod] = useState('today');
  const [showFilters, setShowFilters] = useState(false);
  const [groupByTod, setGroupByTod] = useState(true);

  const lastFeed = allLogs.find(l => l.type === 'feed');

  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true);
    try {
      const now = new Date();
      let from = new Date(now);
      if (period === 'today') { from.setHours(0, 0, 0, 0); }
      else if (period === 'week') { from.setDate(now.getDate() - 7); }
      else { from.setDate(now.getDate() - 30); }

      const { data, error } = await supabase.from('routine_logs').select('*')
        .eq('child_id', activeChild.id)
        .gte('start_time', from.toISOString())
        .order('start_time', { ascending: false });
      if (error) throw error;
      setAllLogs(data ?? []);
    } catch { /* silent */ } finally { setLogsLoading(false); }
  }, [activeChild, period]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // ─ Filter + search logic ──────────────────────────────────────────────
  const filteredLogs = allLogs.filter(log => {
    // Type filter
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    // Time of day filter
    if (todFilter) {
      const h = new Date(log.start_time).getHours();
      const tod: Record<string, [number, number]> = {
        Manhã: [5, 12], Tarde: [12, 18], Noite: [18, 22], Madrugada: [22, 29],
      };
      const [lo, hi] = tod[todFilter] ?? [0, 24];
      const hh = h < 5 ? h + 24 : h;
      if (hh < lo || hh >= hi) return false;
    }
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const p = parsePayload(log.notes);
      const notes = String(log.notes ?? '').toLowerCase();
      const typeMatch = log.type.includes(q);
      const notesMatch = notes.includes(q);
      const kindMatch = String(p.kind ?? p.diaper_type ?? '').includes(q);
      if (!typeMatch && !notesMatch && !kindMatch) return false;
    }
    return true;
  });

  function handleTap(log: RoutineLog) {
    const p = parsePayload(log.notes);
    if (log.type === 'feed' && p.session_type === 'breastfeed') {
      setDetailLog(log); setDetailKind('breastfeed');
    } else if (log.type === 'diaper') {
      navigate(`/diaper/edit/${log.id}`);
    }
  }

  const hasActiveFilters = typeFilter !== 'all' || !!todFilter || !!search || period !== 'today';

  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Header band — solid sage */}
      <div className="px-5 pt-14 pb-5" style={{ backgroundColor: 'hsl(152,15%,45%)' }}>
        <h1 className="text-[22px] font-bold text-white font-quicksand leading-tight">Rotina</h1>
        <p className="text-[13px] text-white/70 mt-0.5 font-nunito">
          {activeChild ? activeChild.name : 'Hoje'}
        </p>
        {lastFeed && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15">
            <span className="text-[13px]">🤱</span>
            <p className="text-[12px] text-white/90 font-semibold font-nunito">
              Última mamada há {fmtTimeSince(lastFeed.start_time)}
            </p>
          </div>
        )}
      </div>

      {/* Active session surface */}
      <div className="pt-3">
        <ActiveSessionBanner />
      </div>

      {/* Search + filter bar */}
      <div className="px-4 pt-3 space-y-2">
        {/* Search input */}
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-card border border-border"
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={2} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar eventos..."
            className="flex-1 text-[13px] bg-transparent text-foreground placeholder:text-muted-foreground font-nunito outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <XMarkIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(v => !v)}
            className="text-[11px] font-bold font-nunito px-2 py-1 rounded-xl transition-colors"
            style={{
              color: hasActiveFilters ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              backgroundColor: hasActiveFilters ? 'color-mix(in srgb, hsl(var(--primary)) 10%, transparent)' : 'transparent',
            }}
          >
            Filtros{hasActiveFilters ? ' ●' : ''}
          </button>
        </div>

        {/* Expandable filter area */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden space-y-3 pt-1 pb-1"
            >
              {/* Period */}
              <div>
                <SectionLabel>Período</SectionLabel>
                <ChipGroup
                  options={PERIOD_OPTIONS}
                  value={period}
                  onToggle={v => setPeriod(v)}
                  accentColor={SLEEP_COLOR}
                />
              </div>
              {/* Type */}
              <div>
                <SectionLabel>Tipo de evento</SectionLabel>
                <ChipGroup
                  options={TYPE_FILTER_OPTIONS}
                  value={typeFilter}
                  onToggle={v => setTypeFilter(v)}
                  accentColor={SLEEP_COLOR}
                />
              </div>
              {/* Time of day */}
              <div>
                <SectionLabel>Período do dia</SectionLabel>
                <ChipGroup
                  options={TOD_OPTIONS}
                  value={todFilter}
                  onToggle={v => setTodFilter(p => p === v ? '' : v)}
                  accentColor={SLEEP_COLOR}
                />
              </div>
              {/* Grouping toggle */}
              <div className="flex items-center justify-between px-1">
                <p className="text-[12px] font-semibold text-muted-foreground font-nunito">
                  Agrupar por período do dia
                </p>
                <button
                  onClick={() => setGroupByTod(v => !v)}
                  className="text-[11px] font-bold font-nunito px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    backgroundColor: groupByTod ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                    color: groupByTod ? 'white' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {groupByTod ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 pt-3">
        {childLoading ? (
          <div className="space-y-3">
            <div className="flex gap-2">{[0,1,2].map(i => <Skeleton key={i} className="flex-1 h-24 rounded-2xl" />)}</div>
            {[0,1,2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
          </div>
        ) : !activeChild ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <p className="text-4xl mb-3">👶</p>
            <p className="text-[16px] font-bold font-quicksand text-foreground">Nenhuma criança ativa</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {/* Daily stats — only show for today */}
            {allLogs.length > 0 && period === 'today' && !search && typeFilter === 'all' && (
              <DailyStats logs={allLogs} />
            )}

            {/* Results count when filtering */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito">
                  {filteredLogs.length} resultado{filteredLogs.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => { setSearch(''); setTypeFilter('all'); setTodFilter(''); setPeriod('today'); }}
                  className="text-[11px] font-semibold text-muted-foreground font-nunito underline underline-offset-2"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {!hasActiveFilters && (
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
                Eventos {period === 'today' ? 'de hoje' : period === 'week' ? 'dos últimos 7 dias' : 'dos últimos 30 dias'}
              </p>
            )}

            {logsLoading ? (
              <div className="space-y-2.5">
                {[0,1,2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
                <p className="text-4xl mb-3">{search ? '🔍' : '🌤️'}</p>
                <p className="text-[15px] font-bold font-quicksand text-foreground">
                  {search ? 'Nenhum resultado' : 'Nenhum evento'}
                </p>
                <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug">
                  {search ? `Sem resultados para "${search}"` : 'Toque no + para registrar.'}
                </p>
              </div>
            ) : groupByTod && !search ? (
              // Grouped view
              <div>
                {groupLogsByTimeOfDay(filteredLogs).map(({ group, logs: groupLogs }) => (
                  <GroupedSection
                    key={group}
                    group={group}
                    logs={groupLogs}
                    onTap={handleTap}
                  />
                ))}
              </div>
            ) : (
              // Flat list
              <div>
                {filteredLogs.map((log, idx) => (
                  <EventCard key={log.id} log={log} isLast={idx === filteredLogs.length - 1} onTap={handleTap} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {activeChild && (
        <FAB
          onBreastfeed={() => navigate('/breastfeeding')}
          onBottle={() => navigate('/bottle')}
          onSleep={() => navigate('/sleep')}
          onDiaper={() => navigate('/diaper/new')}
        />
      )}

      <FeedDetailSheet
        log={detailKind === 'breastfeed' ? detailLog : null}
        open={detailKind === 'breastfeed' && !!detailLog}
        onClose={() => { setDetailLog(null); setDetailKind(null); }}
        onUpdated={loadLogs}
      />
    </div>
  );
}

// ─── Grouped section ──────────────────────────────────────────────────────
function GroupedSection({
  group, logs, onTap,
}: {
  group: TimeOfDay;
  logs: RoutineLog[];
  onTap: (log: RoutineLog) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-4">
      {/* Group header — uses SectionLabel anatomy + collapse toggle */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 mb-2 w-full text-left py-0.5"
      >
        <span className="text-[14px]">{TIME_OF_DAY_EMOJI[group]}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito flex-1">
          {group} · {logs.length} evento{logs.length !== 1 ? 's' : ''}
        </p>
        <span className="text-[10px] text-muted-foreground font-nunito">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {logs.map((log, idx) => (
              <EventCard key={log.id} log={log} isLast={idx === logs.length - 1} onTap={onTap} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
