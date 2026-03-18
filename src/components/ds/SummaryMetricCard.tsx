/**
 * SummaryMetricCard — Ninho DS v2 daily metric card.
 *
 * Anatomy:
 *   [icon container]
 *   [section label]
 *   [primary value]
 *   [secondary helper line?]
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
    ? `color-mix(in srgb, ${accentColor} 15%, transparent)`
    : 'hsl(var(--muted))';

  return (
    <div className="flex-1 min-w-0 rounded-2xl p-4 flex flex-col gap-2 bg-card border border-border">
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: tint }}
      >
        {emoji}
      </div>
      {/* Data */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground font-nunito leading-none">
          {label}
        </p>
        <p
          className={`text-sm font-bold leading-tight mt-1 font-quicksand text-foreground ${empty ? 'opacity-40' : ''}`}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[10px] mt-0.5 text-muted-foreground font-nunito">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
