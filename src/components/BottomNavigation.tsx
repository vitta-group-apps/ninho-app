/**
 * NINHO — BottomNavigation
 * Tab bar fixa no rodapé: Rotina | Saúde | Perfil.
 * Usa tokens DS diretamente — não é um componente DS genérico.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/design-system/lib/utils';

interface NavItem {
  to:    string;
  label: string;
  icon:  (active: boolean) => React.ReactNode;
}

// ─── ícones SVG inline (24 px, stroke) ───────────────────────────────────────

function RoutineIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M12 6v6l4 2"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HealthIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  {
    to:    '/routine',
    label: 'Rotina',
    icon:  (a) => <RoutineIcon active={a} />,
  },
  {
    to:    '/health',
    label: 'Saúde',
    icon:  (a) => <HealthIcon active={a} />,
  },
  {
    to:    '/dashboard',
    label: 'Perfil',
    icon:  (a) => <ProfileIcon active={a} />,
  },
];

export function BottomNavigation() {
  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-20',
        'bg-ds-pure-white border-t border-ds-neutral-border',
        'flex items-stretch',
        // safe area padding for iOS
        'pb-[env(safe-area-inset-bottom,0px)]',
      )}
      aria-label="Navegação principal"
    >
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cn(
            'flex flex-1 flex-col items-center justify-center gap-[2px]',
            'py-[var(--padding-sm)] min-h-[56px]',
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:bg-ds-neutral-subtle',
            isActive
              ? 'text-ds-accent-fg'
              : 'text-ds-neutral-fg hover:text-ds-neutral-fg-strong hover:bg-ds-neutral-subtle',
          )}
        >
          {({ isActive }) => (
            <>
              {item.icon(isActive)}
              <span className={cn(
                'font-body text-text-xs leading-none',
                isActive ? 'font-semibold' : 'font-medium',
              )}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
