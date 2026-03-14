import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon as HomeOutline,
  ClockIcon as ClockOutline,
  ClipboardDocumentListIcon as ClipboardOutline,
  UserCircleIcon as UserOutline,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolid,
  ClockIcon as ClockSolid,
  ClipboardDocumentListIcon as ClipboardSolid,
  UserCircleIcon as UserSolid,
} from '@heroicons/react/24/solid';

const tabs = [
  { path: '/', label: 'Início', Outline: HomeOutline, Solid: HomeSolid },
  { path: '/rotina', label: 'Rotina', Outline: ClockOutline, Solid: ClockSolid },
  { path: '/saude', label: 'Saúde', Outline: ClipboardOutline, Solid: ClipboardSolid },
  { path: '/perfil', label: 'Perfil', Outline: UserOutline, Solid: UserSolid },
];

export function BottomNav() {
  const location = useLocation();
  const [active, setActive] = useState(location.pathname);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 pt-3 pb-safe"
      style={{
        background: 'rgba(255,255,255,0.82)',
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
            onClick={() => setActive(tab.path)}
            className="flex flex-col items-center gap-0.5 min-w-[60px] relative py-1"
          >
            {isActive && (
              <motion.div
                layoutId="nav-pill"
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              className="w-6 h-6 transition-colors"
              style={{ color: isActive ? 'hsl(var(--ninho-sage))' : 'hsl(var(--ninho-brown))' }}
            />
            <span
              className="text-[10px] font-semibold transition-colors"
              style={{
                fontFamily: 'Nunito, sans-serif',
                color: isActive ? 'hsl(var(--ninho-sage))' : 'hsl(var(--ninho-brown))',
                opacity: isActive ? 1 : 0.6,
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
