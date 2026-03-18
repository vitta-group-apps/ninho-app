/**
 * StickyFooterCTA — Ninho DS v2 fixed bottom action bar.
 *
 * Rules from DS:
 * - 1 primary CTA per context
 * - Optional secondary above or beside based on layout
 * - Safe-area aware bottom padding
 * - Solid fill primary, no gradients
 */

interface StickyFooterCTAProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Optional second label above primary */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Override bg color for primary (hsl string) */
  primaryColor?: string;
}

export function StickyFooterCTA({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondary,
  primaryColor,
}: StickyFooterCTAProps) {
  const bg = primaryColor ?? 'hsl(var(--primary))';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-center bg-card border-t border-border z-30"
      style={{
        padding: '12px 16px',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="w-full max-w-md space-y-2">
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 bg-muted text-foreground font-nunito"
          >
            {secondaryLabel}
          </button>
        )}
        <button
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
          className="w-full py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 text-white font-nunito"
          style={{ backgroundColor: primaryDisabled ? 'hsl(var(--muted))' : bg, color: primaryDisabled ? 'hsl(var(--muted-foreground))' : 'white' }}
        >
          {primaryLoading ? 'Salvando...' : primaryLabel}
        </button>
      </div>
    </div>
  );
}
