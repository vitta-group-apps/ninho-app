/**
 * ActiveSessionBanner — DS v3 persistent active-session surface.
 *
 * Robusto contra:
 * - localStorage corrompido
 * - elapsed inválido
 * - sessão parcial
 * - timer negativo
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { fmtTimer } from '../../lib/routineUtils';
import { loadSleepSession } from '../pages/SleepScreen';

const FEED_SESSION_KEY = 'ninho_feed_session_v7';
const SLEEP_COLOR = 'hsl(270,12%,42%)';
const FEED_COLOR = 'hsl(152,15%,55%)';

interface ActiveBannerItem {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  color: string;
  elapsed: number;
  onClick: () => void;
}

type FeedSessionStorage = {
  childId?: string;
  sessionStartEpoch?: number;
  sideTimes?: { L: number; R: number };
  activeSide?: 'L' | 'R';
  switchCount?: number;
  status?: 'ACTIVE' | 'PAUSED' | 'FINISHED';
  segmentStartEpoch?: number | null;
};

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampElapsed(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function parseFeedSession(raw: string | null): FeedSessionStorage | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as FeedSessionStorage;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function buildFeedElapsed(session: FeedSessionStorage): number {
  const left = safeNumber(session.sideTimes?.L, 0);
  const right = safeNumber(session.sideTimes?.R, 0);
  const baseAccumulated = left + right;

  if (session.status === 'PAUSED') {
    return clampElapsed(baseAccumulated / 1000);
  }

  if (session.status === 'ACTIVE') {
    const segmentStartEpoch = safeNumber(session.segmentStartEpoch, 0);
    const liveSegmentMs =
      segmentStartEpoch > 0 ? Date.now() - segmentStartEpoch : 0;

    return clampElapsed((baseAccumulated + liveSegmentMs) / 1000);
  }

  return 0;
}

export function ActiveSessionBanner() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActiveBannerItem[]>([]);

  useEffect(() => {
    const build = () => {
      const next: ActiveBannerItem[] = [];

      const sleep = loadSleepSession();
      if (sleep) {
        const isPaused = !!sleep.pausedAt;
        const startMs = sleep.startIso ? new Date(sleep.startIso).getTime() : 0;
        const baseAccumulated = safeNumber(sleep.accumulatedSec, 0);

        const elapsed = isPaused
          ? clampElapsed(baseAccumulated)
          : clampElapsed(
              baseAccumulated +
                (startMs > 0 ? Math.floor((Date.now() - startMs) / 1000) : 0)
            );

        next.push({
          id: 'sleep',
          emoji: '😴',
          label: 'Sono em andamento',
          sub: isPaused ? 'Pausado' : 'Ativo',
          color: SLEEP_COLOR,
          elapsed,
          onClick: () => navigate('/sleep'),
        });
      }

      const feed = parseFeedSession(localStorage.getItem(FEED_SESSION_KEY));
      if (feed && (feed.status === 'ACTIVE' || feed.status === 'PAUSED')) {
        next.push({
          id: 'feed',
          emoji: '🤱',
          label: 'Amamentação em andamento',
          sub: feed.status === 'PAUSED' ? 'Pausado' : 'Ativo',
          color: FEED_COLOR,
          elapsed: buildFeedElapsed(feed),
          onClick: () => navigate('/breastfeeding'),
        });
      }

      setItems(next);
    };

    build();
    const interval = setInterval(build, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  if (items.length === 0) return null;

  return (
    <div className="px-4 pt-2.5 space-y-2">
      <AnimatePresence initial={false}>
        {items.map(item => (
          <BannerItem key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function BannerItem({ item }: { item: ActiveBannerItem }) {
  const [elapsed, setElapsed] = useState(clampElapsed(item.elapsed));
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(clampElapsed(item.elapsed));

    if (ref.current) clearInterval(ref.current);

    if (item.sub !== 'Pausado') {
      ref.current = setInterval(() => {
        setElapsed(prev => clampElapsed(prev + 1));
      }, 1000);
    }

    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [item.elapsed, item.sub]);

  const isPaused = item.sub === 'Pausado';

  return (
    <motion.button
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18 }}
      onClick={item.onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: `color-mix(in srgb, ${item.color} 9%, hsl(var(--card)))`,
        border: `1.5px solid color-mix(in srgb, ${item.color} 22%, transparent)`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 relative"
        style={{
          backgroundColor: `color-mix(in srgb, ${item.color} 18%, transparent)`,
        }}
      >
        {item.emoji}

        {!isPaused && (
          <div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse border-2 border-card"
            style={{ backgroundColor: item.color }}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight text-foreground font-quicksand truncate">
          {item.label}
        </p>
        <p
          className="text-[11px] font-semibold font-nunito mt-0.5"
          style={{ color: item.color }}
        >
          {isPaused ? 'Pausado — toque para retomar' : `Há ${fmtTimer(elapsed)}`}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className="text-[14px] font-bold tabular-nums font-quicksand"
          style={{ color: item.color }}
        >
          {fmtTimer(elapsed)}
        </span>
        <ChevronRightIcon
          className="w-4 h-4 flex-shrink-0"
          style={{ color: item.color }}
          strokeWidth={2.5}
        />
      </div>
    </motion.button>
  );
}
