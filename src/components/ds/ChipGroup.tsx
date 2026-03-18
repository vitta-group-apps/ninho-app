/**
 * ChipGroup — Ninho DS v2 selectable chip group.
 *
 * Rules:
 * - ALWAYS wraps. Never horizontal scroll.
 * - Single-select: one active at a time (toggle off = deselect)
 * - Multi-select: multiple can be active
 * - Selected state: brand color bg + white text
 * - Unselected: card bg, border, brown text
 * - Minimum touch target 44px height
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
            className="py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all active:scale-95 font-nunito"
            style={{
              backgroundColor: selected ? accent : 'hsl(var(--card))',
              color: selected ? 'white' : 'hsl(var(--foreground))',
              border: `1.5px solid ${selected ? accent : 'hsl(var(--border))'}`,
              minHeight: '44px',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
