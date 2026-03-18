/**
 * StickyFooterCTA — Ninho DS v3 fixed bottom action bar.
 * Uses React.forwardRef so it works correctly inside framer-motion.
 *
 * Hierarchy:
 *   primary   — main task (tall, colored)
 *   secondary — safe alternative (neutral, above primary)
 *   tertiary  — destructive / discard (plain text, below primary)
 */

import * as React from 'react';

interface StickyFooterCTAProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Optional secondary button above primary */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Optional tertiary text action below primary — for Descartar, Cancelar, etc. */
  tertiaryLabel?: string;
  onTertiary?: () => void;
  /** Override bg color for primary (hsl string) */
  primaryColor?: string;
}

export const StickyFooterCTA = React.forwardRef<HTMLDivElement, StickyFooterCTAProps>(
  function StickyFooterCTA({
    primaryLabel,
    onPrimary,
    primaryDisabled,
    primaryLoading,
    secondaryLabel,
    onSecondary,
    tertiaryLabel,
    onTertiary,
    primaryColor,
  }, ref) {
    const bg = primaryColor ?? 'hsl(var(--primary))';

    return (
      <div
        ref={ref}
        className="fixed bottom-0 left-0 right-0 flex justify-center bg-card/95 backdrop-blur-sm border-t border-border z-30"
        style={{
          padding: '12px 20px',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="w-full max-w-md space-y-2.5">
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="w-full py-3.5 rounded-2xl text-[13px] font-semibold transition-all active:scale-95 bg-secondary text-foreground font-nunito"
            >
              {secondaryLabel}
            </button>
          )}
          <button
            onClick={onPrimary}
            disabled={primaryDisabled || primaryLoading}
            className="w-full rounded-2xl text-[14px] font-bold transition-all active:scale-95 disabled:opacity-45 font-nunito"
            style={{
              height: '52px',
              backgroundColor: primaryDisabled ? 'hsl(var(--muted))' : bg,
              color: primaryDisabled ? 'hsl(var(--muted-foreground))' : 'white',
            }}
          >
            {primaryLoading ? 'Salvando...' : primaryLabel}
          </button>
          {tertiaryLabel && onTertiary && (
            <button
              onClick={onTertiary}
              className="w-full py-1.5 text-[12px] font-semibold text-center font-nunito text-muted-foreground"
            >
              {tertiaryLabel}
            </button>
          )}
        </div>
      </div>
    );
  }
);
