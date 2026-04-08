/**
 * NINHO DESIGN SYSTEM — OfflineAlert (Molecule)
 * Nitro™ Core v3.0
 *
 * MISSÃO: Alerta discreto de "Sem conexão" usando tokens de warning do sistema.
 * Aparece no topo da viewport quando `navigator.onLine` é falso.
 * Desaparece automaticamente quando a conexão é restaurada.
 *
 * Construído sobre: Text · ícone SVG inline · tokens ds-warning-*
 *
 * EXEMPLO DE USO:
 * ```tsx
 * // No App.tsx, antes do <Routes>:
 * <OfflineAlert />
 * ```
 *
 * ACESSIBILIDADE:
 *   - role="status" aria-live="polite" — anuncia para leitores de ecrã
 *   - Não bloqueia interação (posição fixed, pointer-events-none quando oculto)
 */

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion }    from 'framer-motion';
import { Text } from './Text';

// ─── OfflineAlert ─────────────────────────────────────────────────────────────

export function OfflineAlert() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline-alert"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-[var(--gap-xs)] px-[var(--padding-md)] py-[10px] bg-ds-warning-tint border-b border-ds-warning-border"
          role="status"
          aria-live="polite"
          aria-label="Sem conexão à internet"
        >
          {/* wifi-off icon — inline, sem dependência externa */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-ds-warning-fg-strong"
          >
            <path
              d="M1 1l14 14M8 12.5a.5.5 0 110 1 .5.5 0 010-1zM10.6 10.6A3.5 3.5 0 005.4 5.4M13.07 7.93A7 7 0 006.2 5.2M15.54 5.46A10.5 10.5 0 004.05 4.05"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <Text variant="caption-medium" className="text-ds-warning-fg-strong">
            Sem conexão — algumas funcionalidades podem não estar disponíveis
          </Text>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
