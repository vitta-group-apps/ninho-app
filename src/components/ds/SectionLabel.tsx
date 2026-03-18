/**
 * SectionLabel — Ninho DS v2 section label.
 * Used above chip groups, textareas, and field blocks.
 */

interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-xs font-bold uppercase tracking-wider mb-2.5 text-muted-foreground font-nunito">
      {children}
    </p>
  );
}
