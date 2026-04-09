/**
 * ChipGroup — Ninho DS v2 selectable chip group.
 *
 * SYSTEM RULES (LOCKED):
 * - Always wraps. NEVER horizontal scroll.
 * - Selected: filled accent bg + white text (high contrast)
 * - Unselected: card bg + muted foreground + 1.5px border
 * - Same visual logic in ALL contexts: filters, sleep, diaper, bottle, breastfeeding
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
  /** Accent color (hsl string) used for selected state. Defaults to --primary. */
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
            className="py-2.5 px-4 rounded-2xl text-[13px] font-semibold transition-all duration-150 active:scale-95 font-nunito whitespace-nowrap"
            style={{
              backgroundColor: selected ? accent : 'hsl(var(--card))',
              color: selected ? 'white' : 'hsl(var(--foreground) / 0.65)',
              border: `1.5px solid ${selected ? accent : 'hsl(var(--border))'}`,
              minHeight: '40px',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
