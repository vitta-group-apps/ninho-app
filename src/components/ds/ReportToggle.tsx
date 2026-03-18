/**
 * ReportToggle — Ninho DS v3 "Incluir no relatório médico" toggle row.
 * Uses React.forwardRef so it works correctly inside framer-motion.
 */

import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface ReportToggleProps {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

export const ReportToggle = React.forwardRef<HTMLDivElement, ReportToggleProps>(
  function ReportToggle({ checked, onCheckedChange }, ref) {
    return (
      <div
        ref={ref}
        className="flex items-center gap-3 px-4 py-4 rounded-2xl transition-colors"
        style={{
          backgroundColor: checked
            ? 'color-mix(in srgb, hsl(var(--primary)) 8%, hsl(var(--card)))'
            : 'hsl(var(--card))',
          border: `1.5px solid ${checked ? 'color-mix(in srgb, hsl(var(--primary)) 30%, transparent)' : 'hsl(var(--border))'}`,
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: checked
              ? 'color-mix(in srgb, hsl(var(--primary)) 15%, transparent)'
              : 'hsl(var(--muted))',
          }}
        >
          <ClipboardDocumentListIcon
            className="w-5 h-5"
            style={{ color: checked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
            strokeWidth={1.75}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-foreground font-nunito">
            Incluir no relatório médico
          </p>
          <p className="text-[11px] mt-0.5 leading-tight font-nunito"
             style={{ color: 'hsl(var(--muted-foreground))' }}>
            Aparecerá no próximo relatório gerado
          </p>
        </div>

        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    );
  }
);
