/**
 * NINHO DESIGN SYSTEM — SuccessCheckmark (Molecule)
 * Nitro™ Core v3.0
 *
 * Feedback visual de sucesso — checkmark animado com Framer Motion.
 * Aparece durante ~1.2s e desaparece com fade-out.
 * Usado internamente pelos cards de log após saveLog bem-sucedido.
 *
 * EXEMPLO DE USO:
 * ```tsx
 * const [saved, setSaved] = useState(false);
 * // após addLog():
 * setSaved(true);
 * // após 1400ms: setSaved(false);
 *
 * <SuccessCheckmark visible={saved} />
 * ```
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface SuccessCheckmarkProps {
  /** Controla visibilidade — o componente gere o próprio fade-in/out */
  visible:    boolean;
  /** Tamanho do círculo em px — default 48 */
  size?:      number;
}

export function SuccessCheckmark({ visible, size = 48 }: SuccessCheckmarkProps) {
  const r  = size / 2;
  const sw = size * 0.08;               // stroke width proporcional

  // Checkmark path centred in the circle
  const cx = r;
  const cy = r;
  const x1 = cx - size * 0.22;
  const y1 = cy + size * 0.02;
  const x2 = cx - size * 0.04;
  const y2 = cy + size * 0.2;
  const x3 = cx + size * 0.24;
  const y3 = cy - size * 0.18;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex items-center justify-center"
          role="status"
          aria-label="Guardado com sucesso"
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            fill="none"
            aria-hidden="true"
          >
            {/* Circle — ds-success-tint */}
            <motion.circle
              cx={cx} cy={cy} r={r - sw / 2}
              stroke="var(--color-success-background-bg-tint-01)"
              strokeWidth={sw}
              fill="var(--color-success-background-bg-subtle-01)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            />
            {/* Checkmark — ds-success-fg-strong */}
            <motion.path
              d={`M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3}`}
              stroke="var(--color-success-foreground-fg-high-contrast)"
              strokeWidth={sw * 1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, delay: 0.2, ease: 'easeOut' }}
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
