/**
 * ActiveSessionBanner — DS v2 persistent active-session surface.
 *
 * Sits below the home/rotina header when a timed session is running.
 * Supports: sleep + breastfeeding.
 *
 * Uses semantic tokens. No hardcoded hex.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fmtTimer } from '@/lib/routineUtils';
import { loadSleepSession } from '@/pages/SleepScreen';

const FEED_SESSION_KEY = 'ninho_feed_session_v6';
const SLEEP_COLOR = 'hsl(270,12%,42%)';
const FEED_COLOR  = 'hsl(152,15%,55%)';

interface ActiveBannerItem {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  color: string;
  elapsed: number;
  onClick: () => void;
}

export function ActiveSessionBanner() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActiveBannerItem[]>([]);

  useEffect(() => {
    const build = () => {
      const next: ActiveBannerItem[] = [];

      // Sleep
      const sleep = loadSleepSession();
      if (sleep) {
        const isPaused = !!sleep.pausedAt;
        const startMs = isPaused ? null : new Date(sleep.startIso).getTime();
        const elapsed = isPaused
          ? sleep.accumulatedSec
          : sleep.accumulatedSec + Math.floor((Date.now() - (startMs ?? 0)) / 1000);
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

      // Breastfeeding
      try {
        const raw = localStorage.getItem(FEED_SESSION_KEY);
        if (raw) {
          const feed = JSON.parse(raw);
          if (feed && (feed.status === 'ACTIVE' || feed.status === 'PAUSED')) {
            next.push({
              id: 'feed',
              emoji: '🤱',
              label: 'Amamentação em andamento',
              sub: feed.status === 'PAUSED' ? 'Pausado' : 'Ativo',
              color: FEED_COLOR,
              elapsed: Math.floor((Date.now() - feed.sessionStartEpoch) / 1000),
              onClick: () => navigate('/breastfeeding'),
            });
          }
        }
      } catch { /* noop */ }

      setItems(next);
    };

    build();
    const interval = setInterval(build, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  if (items.length === 0) return null;

  return (
    <div className="px-4 pt-3 space-y-2">
      {items.map(item => (
        <BannerItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function BannerItem({ item }: { item: ActiveBannerItem }) {
  const [elapsed, setElapsed] = useState(item.elapsed);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setElapsed(item.elapsed);
    if (item.sub !== 'Pausado') {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [item.elapsed, item.sub]);

  const isPaused = item.sub === 'Pausado';

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={item.onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: `color-mix(in srgb, ${item.color} 10%, transparent)`,
        border: `1.5px solid color-mix(in srgb, ${item.color} 25%, transparent)`,
      }}
    >
      <span className="text-xl flex-shrink-0">{item.emoji}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight text-foreground font-quicksand truncate">
          {item.label}
        </p>
        <p className="text-xs font-nunito" style={{ color: item.color }}>
          {isPaused ? 'Pausado' : `Há ${fmtTimer(elapsed)}`}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {!isPaused && (
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
        )}
        <span className="text-xs font-bold tabular-nums font-nunito" style={{ color: item.color }}>
          {fmtTimer(elapsed)}
        </span>
        <span className="text-sm" style={{ color: item.color }}>›</span>
      </div>
    </motion.button>
  );
}
