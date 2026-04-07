/**
 * RotinaPage — Ninho fast-log + trustworthy timeline.
 *
 * Modelo novo:
 *   - routine_logs = fonte da verdade
 *   - payload = json estruturado
 *   - notes = observação humana
 *   - leitura direta via Tables<'routine_logs'>
 */

import { useState } from 'react';
import { useRotinaData } from '../hooks/useRotinaData';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';
import { useActiveChild } from '../contexts/ActiveChildContext';
import { EventCard } from '../components/events/EventCard';
import { ActiveSessionBanner } from '../components/layout/ActiveSessionBanner';
import { Skeleton } from '../components/ui/skeleton';
import { fmtTimeSince } from '../lib/routineUtils';
import { SummaryMetricCard, SectionLabel } from '../components/ds';
import { ChipGroup } from '../components/ds/ChipGroup';

// ── Types ───────────────────────────────────────────────────────────────────

type RoutineLog = Tables<'routine_logs'>;
type TimeOfDay = 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada';

// ── Cores fixas do design system ────────────────────────────────────────────

const FEED_COLOR = '#789687';
const SLEEP_COLOR = '#806e84';
const DIAPER_COLOR = '#C8894A';
const SAGE = '#789687';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#E5E0D8';
const MUTED_BG = '#E8E8E2';
const MAUVE = '#806e84';
const MAUVE_BG = '#f4f0f3';
const TXT = '#2C2C2C';
const TXT_MUTED = '#7A7A7A';
const PAGE_BG = '#F8F5F0';

// ── Filtros ─────────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'feed', label: '🤱 Alimentação' },
  { value: 'sleep', label: '😴 Sono' },
  { value: 'diaper', label: '🧷 Fralda' },
  { value: 'note', label: '📝 Notas' },
];

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: '7 dias' },
  { value: 'month', label: '30 dias' },
];

const TOD_OPTIONS = [
  { value: 'Manhã', label: '🌅 Manhã' },
  { value: 'Tarde', label: '☀️ Tarde' },
  { value: 'Noite', label: '🌙 Noite' },
  { value: 'Madrugada', label: '🌃 Madrugada' },
];

const TIME_OF_DAY_EMOJI: Record<TimeOfDay, string> = {
  Manhã: '🌅',
  Tarde: '☀️',
  Noite: '🌙',
  Madrugada: '🌃',
};

// ── Helpers locais ──────────────────────────────────────────────────────────

function getHourFromLog(log: RoutineLog): number {
  return new Date(log.start_time).getHours();
}

function getTimeOfDay(hour: number): TimeOfDay {
  const hh = hour < 5 ? hour + 24 : hour;

  if (hh >= 5 && hh < 12) return 'Manhã';
  if (hh >= 12 && hh < 18) return 'Tarde';
  if (hh >= 18 && hh < 22) return 'Noite';
  return 'Madrugada';
}

function groupLogsByTimeOfDay(logs: RoutineLog[]) {
  const groupsOrder: TimeOfDay[] = ['Manhã', 'Tarde', 'Noite', 'Madrugada'];

  const grouped = groupsOrder
    .map((group) => ({
      group,
      logs: logs.filter((log) => getTimeOfDay(getHourFromLog(log)) === group),
    }))
    .filter((item) => item.logs.length > 0);

  return grouped;
}

function getFeedTotalSeconds(log: RoutineLog): number {
  const payload =
    log.payload && typeof log.payload === 'object' && !Array.isArray(log.payload)
      ? (log.payload as Record<string, unknown>)
      : {};

  const totalSeconds =
    typeof payload.total_seconds === 'number'
      ? payload.total_seconds
      : typeof payload.totalSeconds === 'number'
      ? payload.totalSeconds
      : null;

  if (typeof totalSeconds === 'number' && Number.isFinite(totalSeconds)) {
    return Math.max(0, totalSeconds);
  }

  if (log.end_time) {
    const diff = Math.floor(
      (new Date(log.end_time).getTime() - new Date(log.start_time).getTime()) / 1000
    );
    return Math.max(0, diff);
  }

  return 0;
}

function analyzeDayPatterns(logs: RoutineLog[]) {
  const feeds = logs
    .filter((l) => l.type === 'feed')
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

  let avgFeedIntervalMin: number | null = null;

  if (feeds.length >= 2) {
    const diffs: number[] = [];
    for (let i = 0; i < feeds.length - 1; i += 1) {
      const current = new Date(feeds[i].start_time).getTime();
      const next = new Date(feeds[i + 1].start_time).getTime();
      const diffMin = Math.abs(current - next) / 60000;
      if (diffMin > 0) diffs.push(diffMin);
    }

    if (diffs.length > 0) {
      avgFeedIntervalMin = Math.round(
        diffs.reduce((acc, value) => acc + value, 0) / diffs.length
      );
    }
  }

  const hasLongSleep = logs.some((l) => {
    if (l.type !== 'sleep' || !l.end_time) return false;
    const durationSec = Math.floor(
      (new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 1000
    );
    return durationSec >= 3 * 60 * 60;
  });

  return {
    avgFeedIntervalMin,
    hasLongSleep,
  };
}

// ── Cards e seções ──────────────────────────────────────────────────────────

function DailyStats({ logs }: { logs: RoutineLog[] }) {
  const feeds = logs.filter((l) => l.type === 'feed').length;
  const diapers = logs.filter((l) => l.type === 'diaper').length;

  const sleepSec = logs
    .filter((l) => l.type === 'sleep' && l.end_time)
    .reduce((acc, l) => {
      return (
        acc +
        Math.floor(
          (new Date(l.end_time!).getTime() - new Date(l.start_time).getTime()) / 1000
        )
      );
    }, 0);

  const h = Math.floor(sleepSec / 3600);
  const m = Math.floor((sleepSec % 3600) / 60);
  const sleepLabel = sleepSec > 0 ? (h > 0 ? `${h}h ${m}m` : `${m}m`) : '—';
  const insights = analyzeDayPatterns(logs);

  return (
    <div className="flex gap-2.5 mb-4">
      <SummaryMetricCard
        emoji="🤱"
        label="Mamadas"
        value={feeds > 0 ? `${feeds}` : '—'}
        sub={
          insights.avgFeedIntervalMin
            ? `~${insights.avgFeedIntervalMin}min entre mamadas`
            : undefined
        }
        accentColor={FEED_COLOR}
        empty={feeds === 0}
      />

      <SummaryMetricCard
        emoji="🧷"
        label="Fraldas"
        value={diapers > 0 ? `${diapers}` : '—'}
        accentColor={DIAPER_COLOR}
        empty={diapers === 0}
      />

      <SummaryMetricCard
        emoji="😴"
        label="Sono"
        value={sleepLabel}
        sub={insights.hasLongSleep ? 'Inclui sono longo' : undefined}
        accentColor={SLEEP_COLOR}
        empty={sleepSec === 0}
      />
    </div>
  );
}

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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const humanNote = note.trim();

      const { error } = await supabase.from('routine_logs').insert({
        child_id: childId,
        author_id: user.id,
        type: 'note',
        start_time: new Date().toISOString(),
        end_time: null,
        notes: humanNote,
        payload: {
          text: humanNote,
        },
      });

      if (error) throw error;

      setNote('');
      onClose();
    } catch {
      // manter silencioso por enquanto, seguindo o padrão atual da página
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
        style={{ backgroundColor: CARD_BG }}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mt-3 mb-4"
          style={{ backgroundColor: CARD_BORDER }}
        />

        <div className="px-5 pb-8 space-y-4">
          <div className="flex items-center gap-2">
            <PencilSquareIcon
              className="w-5 h-5"
              style={{ color: TXT_MUTED }}
            />
            <p
              className="text-[16px] font-bold font-quicksand"
              style={{ color: TXT }}
            >
              Nota rápida
            </p>
          </div>

          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex: mamou menos hoje, irritado, assadura..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl text-[13px] font-nunito resize-none outline-none transition-colors"
            style={{
              backgroundColor: MUTED_BG,
              border: `1.5px solid ${CARD_BORDER}`,
              color: TXT,
            }}
          />

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
              onClick={save}
              disabled={saving || !note.trim()}
              className="flex-[2] py-3 rounded-2xl text-[13px] font-bold font-nunito text-white transition-all active:scale-95 disabled:opacity-40"
              style={{
                backgroundColor: SAGE,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Salvando…' : 'Salvar nota'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function FAB({
  onBreastfeed,
  onBottle,
  onSleep,
  onDiaper,
  onNote,
}: {
  onBreastfeed: () => void;
  onBottle: () => void;
  onSleep: () => void;
  onDiaper: () => void;
  onNote: () => void;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    { emoji: '🤱', label: 'Amamentar', onClick: onBreastfeed, color: FEED_COLOR },
    { emoji: '🍼', label: 'Mamadeira', onClick: onBottle, color: '#5b9db5' },
    { emoji: '😴', label: 'Sono', onClick: onSleep, color: SLEEP_COLOR },
    { emoji: '🧷', label: 'Fralda', onClick: onDiaper, color: DIAPER_COLOR },
    { emoji: '📝', label: 'Nota', onClick: onNote, color: '#7e553d' },
  ];

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {open &&
            actions.map((a, i) => (
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
                    backgroundColor: CARD_BG,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                    border: `1px solid ${CARD_BORDER}`,
                  }}
                >
                  {a.label}
                </span>

                <button
                  onClick={() => {
                    a.onClick();
                    setOpen(false);
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 text-white"
                  style={{
                    backgroundColor: a.color,
                    boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
                  }}
                >
                  <span className="text-xl">{a.emoji}</span>
                </button>
              </motion.div>
            ))}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 text-white"
          style={{
            backgroundColor: MAUVE,
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          }}
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <PlusIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
          </motion.div>
        </button>
      </div>
    </>
  );
}

function GroupedSection({
  group,
  logs,
  onTap,
}: {
  group: TimeOfDay;
  logs: RoutineLog[];
  onTap: (log: RoutineLog) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-2 mb-2.5 w-full text-left py-0.5"
      >
        <span className="text-[13px]">{TIME_OF_DAY_EMOJI[group]}</span>
        <p
          className="text-[11px] font-bold uppercase tracking-[0.08em] font-nunito flex-1"
          style={{ color: TXT_MUTED }}
        >
          {group} · {logs.length} evento{logs.length !== 1 ? 's' : ''}
        </p>
        <span
          className="text-[10px] font-nunito opacity-60"
          style={{ color: TXT_MUTED }}
        >
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
                onTap={() => onTap(log)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function RotinaPage() {
  const navigate = useNavigate();
  const { activeChild, loading: childLoading } = useActiveChild();

  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [todFilter, setTodFilter] = useState('');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [showFilters, setShowFilters] = useState(false);
  const [groupByTod, setGroupByTod] = useState(true);

  const { logs: allLogs, loading: logsLoading, reload: reloadLogs } = useRotinaData(activeChild?.id, period);

  const lastFeed = allLogs.find((l) => l.type === 'feed');

  function handleNoteClose() {
    setNoteSheetOpen(false);
    reloadLogs();
  }

  const filteredLogs = allLogs.filter((log) => {
    if (typeFilter !== 'all' && log.type !== typeFilter) return false;

    if (todFilter) {
      const h = new Date(log.start_time).getHours();
      const todMap: Record<string, [number, number]> = {
        Manhã: [5, 12],
        Tarde: [12, 18],
        Noite: [18, 22],
        Madrugada: [22, 29],
      };

      const [lo, hi] = todMap[todFilter] ?? [0, 24];
      const hh = h < 5 ? h + 24 : h;

      if (hh < lo || hh >= hi) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const notesStr = String(log.notes ?? '').toLowerCase();
      const typeStr = String(log.type ?? '').toLowerCase();

      if (!typeStr.includes(q) && !notesStr.includes(q)) return false;
    }

    return true;
  });

  const hasActiveFilters =
    typeFilter !== 'all' || !!todFilter || !!search || period !== 'today';

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: PAGE_BG }}>
      {/* HEADER */}
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
          Rotina
        </h1>

        <p
          className="text-[13px] mt-0.5 font-nunito"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          {activeChild ? activeChild.name : 'Hoje'}
        </p>

        {lastFeed && (
          <div
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-[13px]">🤱</span>
            <p
              className="text-[12px] font-semibold font-nunito"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Última mamada há {fmtTimeSince(lastFeed.start_time)}
            </p>
          </div>
        )}
      </div>

      <div className="pt-3">
        <ActiveSessionBanner />
      </div>

      {/* Search + filtros */}
      <div className="px-4 pt-3 space-y-2">
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${CARD_BORDER}` }}
        >
          <MagnifyingGlassIcon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: TXT_MUTED }}
            strokeWidth={2}
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar eventos..."
            className="flex-1 text-[13px] bg-transparent font-nunito outline-none"
            style={{ color: TXT }}
          />

          {search && (
            <button onClick={() => setSearch('')}>
              <XMarkIcon className="w-4 h-4" style={{ color: TXT_MUTED }} />
            </button>
          )}

          <button
            onClick={() => setShowFilters((v) => !v)}
            className="text-[11px] font-bold font-nunito px-2 py-1 rounded-xl transition-colors"
            style={{
              color: hasActiveFilters ? MAUVE : TXT_MUTED,
              backgroundColor: hasActiveFilters ? MAUVE_BG : 'transparent',
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
                <ChipGroup
                  options={PERIOD_OPTIONS}
                  value={period}
                  onToggle={(v) => setPeriod(v as 'today' | 'week' | 'month')}
                  accentColor={SLEEP_COLOR}
                />
              </div>

              <div>
                <SectionLabel>Tipo de evento</SectionLabel>
                <ChipGroup
                  options={TYPE_FILTER_OPTIONS}
                  value={typeFilter}
                  onToggle={(v) => setTypeFilter(v)}
                  accentColor={SLEEP_COLOR}
                />
              </div>

              <div>
                <SectionLabel>Período do dia</SectionLabel>
                <ChipGroup
                  options={TOD_OPTIONS}
                  value={todFilter}
                  onToggle={(v) => setTodFilter((p) => (p === v ? '' : v))}
                  accentColor={SLEEP_COLOR}
                />
              </div>

              <div className="flex items-center justify-between px-1">
                <p
                  className="text-[12px] font-semibold font-nunito"
                  style={{ color: TXT_MUTED }}
                >
                  Agrupar por período do dia
                </p>

                <button
                  onClick={() => setGroupByTod((v) => !v)}
                  className="text-[11px] font-bold font-nunito px-3 py-1.5 rounded-xl transition-all"
                  style={{
                    backgroundColor: groupByTod ? MAUVE : MUTED_BG,
                    color: groupByTod ? 'white' : TXT_MUTED,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {groupByTod ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Conteúdo */}
      <div className="px-4 pt-3">
        {childLoading ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="flex-1 h-24 rounded-2xl" />
              ))}
            </div>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        ) : !activeChild ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <p className="text-4xl mb-3">👶</p>
            <p
              className="text-[16px] font-bold font-quicksand"
              style={{ color: TXT }}
            >
              Nenhuma criança ativa
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {allLogs.length > 0 &&
              period === 'today' &&
              !search &&
              typeFilter === 'all' && <DailyStats logs={allLogs} />}

            {hasActiveFilters && (
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.08em] font-nunito"
                  style={{ color: TXT_MUTED }}
                >
                  {filteredLogs.length} resultado
                  {filteredLogs.length !== 1 ? 's' : ''}
                </p>

                <button
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('all');
                    setTodFilter('');
                    setPeriod('today');
                  }}
                  className="text-[11px] font-semibold font-nunito underline underline-offset-2"
                  style={{ color: TXT_MUTED }}
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {!hasActiveFilters && (
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 font-nunito"
                style={{ color: TXT_MUTED }}
              >
                Eventos{' '}
                {period === 'today'
                  ? 'de hoje'
                  : period === 'week'
                  ? 'dos últimos 7 dias'
                  : 'dos últimos 30 dias'}
              </p>
            )}

            {logsLoading ? (
              <div className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-[72px] rounded-2xl" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div
                className="rounded-2xl px-5 py-10 text-center"
                style={{
                  backgroundColor: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                }}
              >
                <p className="text-4xl mb-3">
                  {search || hasActiveFilters ? '🔍' : '🌤️'}
                </p>

                <p
                  className="text-[15px] font-bold font-quicksand"
                  style={{ color: TXT }}
                >
                  {search
                    ? 'Nenhum resultado encontrado'
                    : hasActiveFilters
                    ? 'Nenhum evento com esses filtros'
                    : 'Nenhum evento registrado'}
                </p>

                <p
                  className="text-[13px] mt-1.5 font-nunito leading-snug max-w-[240px] mx-auto"
                  style={{ color: TXT_MUTED }}
                >
                  {search
                    ? `Sem resultados para "${search}".`
                    : hasActiveFilters
                    ? 'Ajuste os filtros para ver mais eventos.'
                    : 'Toque no + para registrar o primeiro evento do dia.'}
                </p>

                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setTypeFilter('all');
                      setTodFilter('');
                      setPeriod('today');
                    }}
                    className="mt-4 text-[12px] font-bold font-nunito px-4 py-2 rounded-xl"
                    style={{
                      backgroundColor: MUTED_BG,
                      color: TXT,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : groupByTod && !search ? (
              <div>
                {groupLogsByTimeOfDay(filteredLogs).map(({ group, logs: groupLogs }) => (
                  <GroupedSection
                    key={group}
                    group={group}
                    logs={groupLogs}
                    onTap={() => {}}
                  />
                ))}
              </div>
            ) : (
              <div>
                {filteredLogs.map((log, idx) => (
                  <EventCard
                    key={log.id}
                    log={log}
                    isLast={idx === filteredLogs.length - 1}
                    onTap={() => {}}
                  />
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
          onNote={() => setNoteSheetOpen(true)}
        />
      )}

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