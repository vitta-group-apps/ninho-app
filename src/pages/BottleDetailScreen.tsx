/**
 * BottleDetailScreen — READ-ONLY detail view for a bottle / formula feed.
 *
 * Route: /bottle/detail/:logId
 *
 * UX Rule (global):
 *   - Opens in READ mode: displays data, NO editable inputs
 *   - "Editar" CTA → navigates to edit screen /bottle/edit/:logId
 *
 * DS: ScreenHeader · StickyFooterCTA
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { parsePayload, getUserNotes, fmtTime } from '@/lib/routineUtils';
import type { RoutineLog } from '@/lib/eventSystem';
import { ScreenHeader, StickyFooterCTA } from '@/components/ds';

const BOTTLE_COLOR = 'hsl(var(--color-bottle))';

const TYPE_LABEL: Record<string, string> = {
  bottle: 'Leite materno', formula: 'Fórmula',
};
const TEMP_LABEL: Record<string, string> = {
  cold: 'Fria', warm: 'Morna', hot: 'Quente',
};
const REACTION_LABEL: Record<string, string> = {
  mamou_bem: 'Aceitou bem', rejeitou: 'Recusou', pouquinho: 'Mamou pouco',
  arrotou: 'Arrotou', regurgitou: 'Regurgitou',
};

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <p className="text-[13px] text-muted-foreground font-nunito flex-shrink-0">{label}</p>
      <p className="text-[13px] font-semibold font-nunito text-foreground text-right">{value}</p>
    </div>
  );
}

export default function BottleDetailScreen() {
  const navigate = useNavigate();
  const { logId } = useParams<{ logId: string }>();

  const [log, setLog] = useState<RoutineLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!logId) return;
    (async () => {
      const { data } = await supabase
        .from('routine_logs')
        .select('*')
        .eq('id', logId)
        .maybeSingle();
      if (data) setLog(data);
      setLoading(false);
    })();
  }, [logId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-primary" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ScreenHeader title="Mamadeira" onBack={() => navigate(-1)} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground font-nunito text-sm">Registro não encontrado.</p>
        </div>
      </div>
    );
  }

  const p = parsePayload(log.notes);
  const feedType = String(p.feeding_method ?? p.session_type ?? '');
  const typeLabel = TYPE_LABEL[feedType] ?? 'Mamadeira';
  const amountMl = p.amount_ml ? `${p.amount_ml}ml` : null;
  const tempLabel = TEMP_LABEL[String(p.temperature ?? '')] ?? null;
  const rawTags = String(p.tags ?? '').split(',').filter(Boolean);
  const reactionLabel = rawTags.map(t => REACTION_LABEL[t] ?? t).join(', ') || null;
  const notes = getUserNotes(log.notes);
  const includeInReport = Boolean(p.include_in_report);
  const screenTitle = feedType === 'formula' ? 'Fórmula' : 'Mamadeira';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ScreenHeader title={screenTitle} onBack={() => navigate(-1)} />

      <div className="ds-form-body">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Summary card */}
          <div
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${BOTTLE_COLOR} 8%, hsl(var(--card)))`,
              border: `1.5px solid color-mix(in srgb, ${BOTTLE_COLOR} 22%, transparent)`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[22px] flex-shrink-0"
                style={{ backgroundColor: `color-mix(in srgb, ${BOTTLE_COLOR} 16%, transparent)` }}
              >
                🍼
              </div>
              <div>
                <p className="text-[14px] font-bold font-quicksand text-foreground leading-tight">
                  {typeLabel}
                </p>
                <p className="text-[12px] font-semibold font-nunito mt-0.5 text-muted-foreground">
                  {fmtTime(log.start_time)}
                  {amountMl && ` · ${amountMl}`}
                </p>
              </div>
            </div>

            {/* Big amount */}
            {amountMl && (
              <div className="text-center mt-4">
                <p
                  className="text-[40px] font-bold tabular-nums font-quicksand leading-none"
                  style={{ color: BOTTLE_COLOR }}
                >
                  {amountMl}
                </p>
                <p className="text-[11px] mt-1 text-muted-foreground font-nunito">volume oferecido</p>
              </div>
            )}
          </div>

          {/* Detail rows */}
          <div
            className="rounded-2xl px-4 overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            <DetailRow label="Tipo" value={typeLabel} />
            <DetailRow label="Temperatura" value={tempLabel} />
            <DetailRow label="Como reagiu" value={reactionLabel} />
            <DetailRow label="Observações" value={notes} />
            <DetailRow label="Relatório médico" value={includeInReport ? 'Incluído' : null} />
          </div>

          {!amountMl && !tempLabel && !reactionLabel && !notes && (
            <p className="text-center text-[13px] text-muted-foreground font-nunito py-2">
              Nenhuma informação adicional registrada.
            </p>
          )}
        </motion.div>
      </div>

      <StickyFooterCTA
        primaryLabel="Editar"
        onPrimary={() => navigate(`/bottle/edit/${log.id}`)}
        primaryColor={BOTTLE_COLOR}
      />
    </div>
  );
}
