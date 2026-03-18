import { useLocation, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon as HomeOutline,
  ClockIcon as ClockOutline,
  HeartIcon as HeartOutline,
  SparklesIcon as SparklesOutline,
  UserGroupIcon as GroupOutline,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  ClockIcon as ClockSolid,
  HeartIcon as HeartSolid,
  SparklesIcon as SparklesSolid,
  UserGroupIcon as GroupSolid,
} from '@heroicons/react/24/solid';

const tabs = [
  { path: '/home',        label: 'Início',   Outline: HomeOutline,     Solid: HomeSolid },
  { path: '/routine',     label: 'Rotina',   Outline: ClockOutline,    Solid: ClockSolid },
  { path: '/health',      label: 'Saúde',    Outline: HeartOutline,    Solid: HeartSolid },
  { path: '/development', label: 'Crescer',  Outline: SparklesOutline, Solid: SparklesSolid },
  { path: '/family',      label: 'Família',  Outline: GroupOutline,    Solid: GroupSolid },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1 pt-2"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(90,74,66,0.08)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        const Icon = isActive ? tab.Solid : tab.Outline;

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className="flex flex-col items-center gap-0.5 min-w-0 flex-1 relative py-1 px-1"
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              className="w-6 h-6 transition-colors flex-shrink-0"
              style={{ color: isActive ? 'hsl(var(--ninho-sage))' : 'hsl(var(--ninho-brown))' }}
            />
            <span
              className="text-[10px] font-semibold transition-colors leading-tight truncate w-full text-center"
              style={{
                fontFamily: 'Nunito, sans-serif',
                color: isActive ? 'hsl(var(--ninho-sage))' : 'hsl(var(--ninho-brown))',
                opacity: isActive ? 1 : 0.55,
              }}
            >
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
