/**
 * ReportToggle — Ninho DS v2 "Incluir no relatório médico" toggle row.
 * Shared across ALL routine forms for consistency.
 */

import { Switch } from '@/components/ui/switch';

interface ReportToggleProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

export function ReportToggle({ checked, onCheckedChange }: ReportToggleProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-4 rounded-2xl bg-card border border-border"
    >
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm font-semibold leading-tight text-foreground font-nunito">
          Incluir no relatório médico
        </p>
        <p className="text-xs mt-0.5 text-muted-foreground font-nunito">
          Aparecerá no próximo relatório gerado
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
