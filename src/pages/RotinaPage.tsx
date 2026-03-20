/**
 * RotinaPage — Ninho fast-log + trustworthy timeline.
 *
 * Goals:
 *   - Scan today in under 3 seconds
 *   - Log new events in 1 tap (FAB)
 *   - Surface active sessions prominently
 *   - Group events by time of day
 *   - Add quick note capability
 *
 * Anatomy of each event card: type → main data → time → optional hint/note
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon, MagnifyingGlassIcon, XMarkIcon, PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { useActiveChild } from '@/contexts/ActiveChildContext';
import { EventCard } from '@/components/events/EventCard';
import { ActiveSessionBanner } from '@/components/layout/ActiveSessionBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { fmtTimeSince } from '@/lib/routineUtils';
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
const SAGE         = 'hsl(152,15%,50%)';

// ─── Filter options ───────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: 'all',    label: 'Todos' },
  { value: 'feed',   label: '🤱 Alimentação' },
  { value: 'sleep',  label: '😴 Sono' },
  { value: 'diaper', label: '🧷 Fralda' },
  { value: 'note',   label: '📝 Notas' },
];

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week',  label: '7 dias' },
  { value: 'month', label: '30 dias' },
];

const TOD_OPTIONS = [
  { value: 'Manhã',     label: '🌅 Manhã' },
  { value: 'Tarde',     label: '☀️ Tarde' },
  { value: 'Noite',     label: '🌙 Noite' },
  { value: 'Madrugada', label: '🌃 Madrugada' },
];

// ─── Daily stats row ──────────────────────────────────────────────────────

function DailyStats({ logs }: { logs: RoutineLog[] }) {
  const feeds   = logs.filter(l => l.type === 'feed').length;
  const diapers = logs.filter(l => l.type === 'diaper').length;
  const sleepSec = logs.filter(l => l.type === 'sleep' && l.end_time).reduce((acc, l) => {
    return acc + Math.floor(
      (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
    );
  }, 0);
  const h = Math.floor(sleepSec / 3600);
  const m = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel = sleepSec > 0 ? (h > 0 ? `${h}h ${m}m` : `${m}m`) : '—';
  const insights = analyzeDayPatterns(logs);

  return (
    <div className="flex gap-2.5 mb-4">
      <SummaryMetricCard
        emoji="🤱" label="Mamadas"
        value={feeds > 0 ? `${feeds}` : '—'}
        sub={insights.avgFeedIntervalMin ? `~${insights.avgFeedIntervalMin}min entre mamadas` : undefined}
        accentColor={FEED_COLOR}
        empty={feeds === 0}
      />
      <SummaryMetricCard
        emoji="🧷" label="Fraldas"
        value={diapers > 0 ? `${diapers}` : '—'}
        accentColor={DIAPER_COLOR}
        empty={diapers === 0}
      />
      <SummaryMetricCard
        emoji="😴" label="Sono"
        value={sleepLabel}
        sub={insights.hasLongSleep ? 'Inclui sono longo' : undefined}
        accentColor={SLEEP_COLOR}
        empty={sleepSec === 0}
      />
    </div>
  );
}

// ─── Quick Note Sheet ────────────────────────────────────────────────────

function QuickNoteSheet({
  open,
  onClose,
  childId,
}: {
  open: boolean;
  onClose: () => void;
  childId: string;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'note',
        start_time: new Date().toISOString(),
        // Store as clean JSON payload — parsed by parsePayload in eventSystem
        notes: JSON.stringify({ _notes: note.trim() }),
      });
      if (error) throw error;
      setNote('');
      onClose();
    } catch {
      // Surface save error via toast on retry
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl overflow-hidden"
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3 mb-4" />
        <div className="px-5 pb-8 space-y-4">
          <div className="flex items-center gap-2">
            <PencilSquareIcon className="w-5 h-5 text-muted-foreground" />
            <p className="text-[16px] font-bold font-quicksand text-foreground">Nota rápida</p>
          </div>
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex: mamou menos hoje, irritado, assadura, pediatra pediu observar febre..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito bg-muted text-foreground placeholder:text-muted-foreground resize-none outline-none border border-border focus:border-primary transition-colors"
          />
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-[13px] font-bold font-nunito transition-all active:scale-95"
              style={{
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving || !note.trim()}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{ backgroundColor: SAGE }}
            >
              {saving ? 'Salvando…' : 'Salvar nota'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── FAB with quick note ─────────────────────────────────────────────────

function FAB({
  onBreastfeed, onBottle, onSleep, onDiaper, onNote,
}: {
  onBreastfeed: () => void; onBottle: () => void;
  onSleep: () => void; onDiaper: () => void;
  onNote: () => void;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    { emoji: '🤱', label: 'Amamentar',  onClick: onBreastfeed, color: FEED_COLOR },
    { emoji: '🍼', label: 'Mamadeira',   onClick: onBottle,     color: 'hsl(200,40%,50%)' },
    { emoji: '😴', label: 'Sono',        onClick: onSleep,      color: SLEEP_COLOR },
    { emoji: '🧷', label: 'Fralda',      onClick: onDiaper,     color: DIAPER_COLOR },
    { emoji: '📝', label: 'Nota',        onClick: onNote,       color: 'hsl(var(--ninho-brown))' },
  ];

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setOpen(false)} />
      )}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {open && actions.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, x: 12, scale: 0.88 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.9 }}
              transition={{ duration: 0.14, delay: i * 0.04 }}
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

// ─── Grouped section ──────────────────────────────────────────────────────

function GroupedSection({
  group, logs, onTap,
}: {
  group: TimeOfDay; logs: RoutineLog[]; onTap: (log: RoutineLog) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed(v => !v)}
        className="flex items-center gap-2 mb-2.5 w-full text-left py-0.5"
      >
        <span className="text-[13px]">{TIME_OF_DAY_EMOJI[group]}</span>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground font-nunito flex-1">
          {group} · {logs.length} evento{logs.length !== 1 ? 's' : ''}
        </p>
        <span className="text-[10px] text-muted-foreground font-nunito opacity-60">
          {collapsed ? '▲ expandir' : '▼ recolher'}
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
              <EventCard
                key={log.id}
                log={log}
                isLast={idx === logs.length - 1}
                onTap={onTap}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function RotinaPage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading } = useActiveChild();
  const [allLogs, setAllLogs] = useState<RoutineLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);

  const [search, setSearch]         = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [todFilter, setTodFilter]   = useState('');
  const [period, setPeriod]         = useState('today');
  const [showFilters, setShowFilters] = useState(false);
  const [groupByTod, setGroupByTod]   = useState(true);

  const lastFeed = allLogs.find(l => l.type === 'feed');

  const loadLogs = useCallback(async () => {
    if (!activeChild) return;
    setLogsLoading(true);
    try {
      const now = new Date();
      const from = new Date(now);
      if (period === 'today') { from.setHours(0, 0, 0, 0); }
      else if (period === 'week') { from.setDate(now.getDate() - 7); }
      else { from.setDate(now.getDate() - 30); }

      const { data, error } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('child_id', activeChild.id)
        .gte('start_time', from.toISOString())
        .order('start_time', { ascending: false });
      if (error) throw error;
      setAllLogs(data ?? []);
    } catch { /* silent */ } finally {
      setLogsLoading(false); }
  }, [activeChild, period]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Re-fetch after note is saved
  function handleNoteClose() {
    setNoteSheetOpen(false);
    loadLogs();
  }

  const filteredLogs = allLogs.filter(log => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;
    if (todFilter) {
      const h = new Date(log.start_time).getHours();
      const tod: Record<string, [number, number]> = {
        Manhã: [5, 12], Tarde: [12, 18], Noite: [18, 22], Madrugada: [22, 29],
      };
      const [lo, hi] = tod[todFilter] ?? [0, 24];
      const hh = h < 5 ? h + 24 : h;
      if (hh < lo || hh >= hi) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const notesStr = String(log.notes ?? '').toLowerCase();
      if (!log.type.includes(q) && !notesStr.includes(q)) return false;
    }
    return true;
  });

  function handleTap(_log: RoutineLog) { /* EventCard handles navigation directly */ }

  const hasActiveFilters = typeFilter !== 'all' || !!todFilter || !!search || period !== 'today';

  return (
    <div className="min-h-screen pb-28 bg-background">

      {/* Header */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: 'max(56px, env(safe-area-inset-top))',
          backgroundColor: 'hsl(152,15%,45%)',
        }}
      >
        <h1 className="text-[22px] font-bold text-white font-quicksand leading-tight">Rotina</h1>
        <p className="text-[13px] text-white/65 mt-0.5 font-nunito">
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

      {/* Active session */}
      <div className="pt-3">
        <ActiveSessionBanner />
      </div>

      {/* Daily stats — above the search/filter block */}
      {activeChild && allLogs.length > 0 && period === 'today' && !search && typeFilter === 'all' && (
        <div className="px-4 pt-3">
          <DailyStats logs={allLogs} />
        </div>
      )}

      {/* Search + filter — immediately above the event list */}
      <div className="px-4 pt-2 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-card border border-border">
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
              backgroundColor: hasActiveFilters
                ? 'color-mix(in srgb, hsl(var(--primary)) 10%, transparent)'
                : 'transparent',
            }}
          >
            Filtros{hasActiveFilters ? ' ●' : ''}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden space-y-3 pt-1 pb-1"
            >
              <div>
                <SectionLabel>Período</SectionLabel>
                <ChipGroup options={PERIOD_OPTIONS} value={period} onToggle={v => setPeriod(v)} accentColor={SLEEP_COLOR} />
              </div>
              <div>
                <SectionLabel>Tipo de evento</SectionLabel>
                <ChipGroup options={TYPE_FILTER_OPTIONS} value={typeFilter} onToggle={v => setTypeFilter(v)} accentColor={SLEEP_COLOR} />
              </div>
              <div>
                <SectionLabel>Período do dia</SectionLabel>
                <ChipGroup options={TOD_OPTIONS} value={todFilter} onToggle={v => setTodFilter(p => p === v ? '' : v)} accentColor={SLEEP_COLOR} />
              </div>
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

      {/* (duplicate search block removed) */}

      {/* Content */}
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Daily stats */}
            {allLogs.length > 0 && period === 'today' && !search && typeFilter === 'all' && (
              <DailyStats logs={allLogs} />
            )}

            {/* Results count / filter label */}
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
                Eventos {
                  period === 'today' ? 'de hoje'
                  : period === 'week' ? 'dos últimos 7 dias'
                  : 'dos últimos 30 dias'
                }
              </p>
            )}

            {logsLoading ? (
              <div className="space-y-2.5">
                {[0,1,2].map(i => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="rounded-2xl px-5 py-10 text-center bg-card border border-border">
                <p className="text-4xl mb-3">
                  {search || hasActiveFilters ? '🔍' : '🌤️'}
                </p>
                <p className="text-[15px] font-bold font-quicksand text-foreground">
                  {search
                    ? 'Nenhum resultado encontrado'
                    : hasActiveFilters
                    ? 'Nenhum evento com esses filtros'
                    : 'Nenhum evento registrado'}
                </p>
                <p className="text-[13px] mt-1.5 text-muted-foreground font-nunito leading-snug max-w-[240px] mx-auto">
                  {search
                    ? `Sem resultados para "${search}". Tente outra busca.`
                    : hasActiveFilters
                    ? 'Ajuste os filtros para ver mais eventos.'
                    : 'Toque no + para registrar o primeiro evento do dia.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(''); setTypeFilter('all'); setTodFilter(''); setPeriod('today'); }}
                    className="mt-4 text-[12px] font-bold font-nunito px-4 py-2 rounded-xl"
                    style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : groupByTod && !search ? (
              <div>
                {groupLogsByTimeOfDay(filteredLogs).map(({ group, logs: groupLogs }) => (
                  <GroupedSection key={group} group={group} logs={groupLogs} onTap={handleTap} />
                ))}
              </div>
            ) : (
              <div>
                {filteredLogs.map((log, idx) => (
                  <EventCard
                    key={log.id}
                    log={log}
                    isLast={idx === filteredLogs.length - 1}
                    onTap={handleTap}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* FAB */}
      {activeChild && (
        <FAB
          onBreastfeed={() => navigate('/breastfeeding')}
          onBottle={() => navigate('/bottle')}
          onSleep={() => navigate('/sleep')}
          onDiaper={() => navigate('/diaper/new')}
          onNote={() => setNoteSheetOpen(true)}
        />
      )}

      {/* Quick note sheet */}
      <AnimatePresence>
        {noteSheetOpen && activeChild && (
          <QuickNoteSheet
            open={noteSheetOpen}
            onClose={handleNoteClose}
            childId={activeChild.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
