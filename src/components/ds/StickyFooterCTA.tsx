/**
 * StickyFooterCTA — Ninho DS v2 fixed bottom action bar.
 *
 * Polish v2.1:
 * - bg-card replaced with a very slight blur + white base for depth
 * - Primary button is taller (56px) for better tap affordance
 * - Secondary button has correct hierarchy (lighter, smaller text)
 * - Border-top is slightly more visible
 * - Padding is more generous horizontally (20px)
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
      </div>
    </div>
  );
}
