/**
 * SummaryMetricCard — Ninho DS v4
 *
 * Hierarchy:
 *  1. Icon + Label (small, secondary, top)
 *  2. Value (large, dominant)
 *  3. Sub line (quiet, contextual, 1 line max)
 *
 * v4 fixes:
 *  - Sub line capped at 1 line with ellipsis to prevent card height inconsistency
 *  - Value font size capped to prevent overflow in 3-column layout
 *  - min-w-0 on all text elements to prevent flex overflow
 */

interface SummaryMetricCardProps {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
  /** If true, value renders at lower opacity — signals "no data yet" */
  empty?: boolean;
  /** Accent color for the icon container tint (hsl string) */
  accentColor?: string;
}

export function SummaryMetricCard({
  emoji, label, value, sub, empty, accentColor,
}: SummaryMetricCardProps) {
  const tint = accentColor
    ? `color-mix(in srgb, ${accentColor} 16%, transparent)`
    : 'hsl(var(--muted))';

  return (
    <div className="flex-1 min-w-0 rounded-2xl px-2.5 pt-3 pb-2.5 flex flex-col gap-1 bg-card border border-border overflow-hidden">
      {/* Icon + label row */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] flex-shrink-0"
          style={{ backgroundColor: tint }}
        >
          {emoji}
        </div>
        <p className="text-[8px] font-bold uppercase tracking-[0.07em] text-muted-foreground font-nunito leading-none truncate min-w-0">
          {label}
        </p>
      </div>

      {/* BIG NUMBER — dominant visual */}
      <p
        className={`text-[22px] font-bold leading-none font-quicksand min-w-0 ${empty ? 'opacity-30' : 'text-foreground'}`}
        style={!empty && accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </p>

      {/* Sub line — 1 line, ellipsis */}
      {sub && (
        <p className="text-[9.5px] text-muted-foreground font-nunito leading-tight truncate min-w-0">
          {sub}
        </p>
      )}
    </div>
  );
}
