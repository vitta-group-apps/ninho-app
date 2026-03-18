/**
 * ActiveSessionBanner — DS v2 persistent active-session surface.
 *
 * Polish v2.1:
 * - Reduced outer padding to integrate tighter with page content
 * - Banner height is more compact and intentional
 * - Timer is right-aligned with stronger emphasis
 * - Pulsing dot is now inside the emoji pill rather than floating
 * - Status sub-text uses the accent color directly
 * - Arrow replaced with ChevronRight icon for consistency
 *
 * Uses semantic tokens. No hardcoded hex.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
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
    <div className="px-4 pt-2.5 space-y-2">
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
    if (ref.current) clearInterval(ref.current);
    if (item.sub !== 'Pausado') {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
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
      {/* Emoji with optional pulse */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 relative"
        style={{ backgroundColor: `color-mix(in srgb, ${item.color} 18%, transparent)` }}
      >
        {item.emoji}
        {!isPaused && (
          <div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse border-2 border-card"
            style={{ backgroundColor: item.color }}
          />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight text-foreground font-quicksand truncate">
          {item.label}
        </p>
        <p className="text-[11px] font-semibold font-nunito mt-0.5" style={{ color: item.color }}>
          {isPaused ? 'Pausado — toque para retomar' : `Há ${fmtTimer(elapsed)}`}
        </p>
      </div>

      {/* Timer + chevron */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className="text-[14px] font-bold tabular-nums font-quicksand"
          style={{ color: item.color }}
        >
          {fmtTimer(elapsed)}
        </span>
        <ChevronRightIcon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} strokeWidth={2.5} />
      </div>
    </motion.button>
  );
}
