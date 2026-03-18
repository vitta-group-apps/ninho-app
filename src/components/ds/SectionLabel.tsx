/**
 * SectionLabel — Ninho DS v2 section label.
 *
 * Polish v2.1:
 * - Slightly more bottom margin (mb-3) for breathing room
 * - Letter-spacing fine-tuned for readability
 */

interface SectionLabelProps {
  children: React.ReactNode;
}

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3 text-muted-foreground font-nunito">
      {children}
    </p>
  );
}
