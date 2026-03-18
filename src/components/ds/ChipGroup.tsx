/**
 * ChipGroup — Ninho DS v2 selectable chip group.
 *
 * Polish v2.1:
 * - Chips have more horizontal padding (px-4.5) and slightly taller (46px min)
 * - Unselected chip text is foreground/70 for better hierarchy
 * - Selected state uses a subtle inner shadow for tactile depth
 * - Gap between chips is consistent (gap-2.5)
 *
 * Rules:
 * - ALWAYS wraps. Never horizontal scroll.
 * - Single-select: one active at a time (toggle off = deselect)
 * - Multi-select: multiple can be active
 */

interface ChipOption {
  value: string;
  label: string;
}

interface ChipGroupProps {
  options: ChipOption[];
  /** For single-select: pass current value string */
  value?: string;
  /** For multi-select: pass array of selected values */
  values?: string[];
  onToggle: (v: string) => void;
  /** Accent color (hsl string) used for selected state */
  accentColor?: string;
  multiSelect?: boolean;
}

export function ChipGroup({
  options,
  value,
  values,
  onToggle,
  accentColor,
  multiSelect = false,
}: ChipGroupProps) {
  const accent = accentColor ?? 'hsl(var(--primary))';

  function isSelected(v: string): boolean {
    if (multiSelect && values) return values.includes(v);
    return value === v;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = isSelected(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className="py-2.5 px-4 rounded-2xl text-[13px] font-semibold transition-all active:scale-95 font-nunito"
            style={{
              backgroundColor: selected
                ? accent
                : 'hsl(var(--card))',
              color: selected
                ? 'white'
                : 'hsl(var(--foreground) / 0.75)',
              border: `1.5px solid ${selected ? accent : 'hsl(var(--border))'}`,
              minHeight: '44px',
              boxShadow: selected
                ? `inset 0 1px 2px rgba(0,0,0,0.15)`
                : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
