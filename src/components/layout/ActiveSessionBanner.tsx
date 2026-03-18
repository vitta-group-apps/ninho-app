/**
 * ActiveSessionBanner — Persistent surface for any running timed session.
 *
 * Shows at the top of Home and Rotina when:
 *  - a breastfeeding session is active (localStorage: ninho_feed_session_v6)
 *  - a sleep session is active (localStorage: ninho_sleep_v2)
 *
 * Tapping opens the corresponding full-screen flow.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fmtTimer } from '@/lib/routineUtils';
import { loadSleepSession } from '@/pages/SleepScreen';

const FEED_SESSION_KEY = 'ninho_feed_session_v6';
const MAUVE = 'hsl(270,12%,52%)';
const SAGE  = 'hsl(152,15%,55%)';

interface ActiveBannerItem {
  id: string;
  emoji: string;
  label: string;
  sub: string;
  color: string;
  bgColor: string;
  elapsed: number;
  onClick: () => void;
}

function useLiveElapsed(startEpoch: number | null, paused: boolean): number {
  const [elapsed, setElapsed] = useState(
    startEpoch ? Math.floor((Date.now() - startEpoch) / 1000) : 0
  );
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startEpoch && !paused) {
      ref.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startEpoch) / 1000));
      }, 1000);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [startEpoch, paused]);

  return elapsed;
}

export function ActiveSessionBanner() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActiveBannerItem[]>([]);

  useEffect(() => {
    const build = () => {
      const next: ActiveBannerItem[] = [];

      // ── Sleep session ──────────────────────────────────────────
      const sleep = loadSleepSession();
      if (sleep) {
        const isPaused = !!sleep.pausedAt;
        const startMs = isPaused ? null : new Date(sleep.startIso).getTime();
        next.push({
          id: 'sleep',
          emoji: '😴',
          label: 'Sono em andamento',
          sub: isPaused ? 'Pausado' : 'Ativo',
          color: MAUVE,
          bgColor: `${MAUVE}15`,
          elapsed: sleep.accumulatedSec,
          onClick: () => navigate('/sleep'),
        });
      }

      // ── Breastfeed session ────────────────────────────────────
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
              color: SAGE,
              bgColor: `${SAGE}15`,
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
    <div className="px-5 pt-3 space-y-2">
      {items.map(item => (
        <BannerItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function BannerItem({ item }: { item: ActiveBannerItem }) {
  const [elapsed, setElapsed] = useState(item.elapsed);

  useEffect(() => {
    setElapsed(item.elapsed);
    if (item.sub !== 'Pausado') {
      const ref = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(ref);
    }
  }, [item.elapsed, item.sub]);

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={item.onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-98"
      style={{
        backgroundColor: item.bgColor,
        border: `1.5px solid ${item.color}30`,
      }}
    >
      <span className="text-xl flex-shrink-0">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-tight truncate"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}>
          {item.label}
        </p>
        <p className="text-xs" style={{ color: item.color, fontFamily: 'Nunito, sans-serif' }}>
          {item.sub === 'Pausado' ? 'Pausado' : `Há ${fmtTimer(elapsed)}`}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {item.sub !== 'Pausado' && (
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
        )}
        <span className="text-xs font-bold tabular-nums"
          style={{ color: item.color, fontFamily: 'Nunito, sans-serif' }}>
          {fmtTimer(elapsed)}
        </span>
        <span className="text-sm" style={{ color: item.color }}>›</span>
      </div>
    </motion.button>
  );
}
