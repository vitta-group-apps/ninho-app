import { motion } from 'framer-motion';
import { getNextVaccine } from '@/data/vaccineSchedule';
import { MockChild } from '@/hooks/useChild';

interface VaccineCardProps {
  child: MockChild;
}

export function VaccineCard({ child }: VaccineCardProps) {
  const next = getNextVaccine(child.birthDate);

  if (!next) {
    return (
      <div className="mx-5 mb-4 rounded-2xl p-5 bg-white shadow-sm border border-border">
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}>
          Calendário vacinal completo ✓
        </p>
      </div>
    );
  }

  const { vaccine, scheduledDate, daysUntil } = next;
  const isUrgent = daysUntil <= 7;
  const isUpcoming = daysUntil <= 30;

  const badgeStyle = isUrgent
    ? { bg: 'hsl(0 84% 50% / 0.1)', text: 'hsl(0 84% 45%)' }
    : isUpcoming
    ? { bg: 'hsl(38 92% 50% / 0.12)', text: 'hsl(38 80% 40%)' }
    : { bg: 'hsl(var(--ninho-sage) / 0.12)', text: 'hsl(var(--ninho-sage))' };

  return (
    <motion.div
      className="mx-5 mb-4 rounded-2xl p-5 bg-white shadow-sm overflow-hidden relative"
      style={{ border: '1px solid hsl(var(--border))' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10"
        style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ backgroundColor: 'hsl(var(--ninho-sage) / 0.12)' }}
          >
            💉
          </div>
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: 'hsl(var(--ninho-sage))', fontFamily: 'Nunito, sans-serif' }}
            >
              Próxima Vacina
            </p>
            <p
              className="text-base font-bold leading-tight"
              style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
            >
              {vaccine.shortName}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
            >
              {vaccine.doses} · {vaccine.ageLabel}
            </p>
          </div>
        </div>

        {/* Badge */}
        <div
          className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text, fontFamily: 'Nunito, sans-serif' }}
        >
          {daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `em ${daysUntil}d`}
        </div>
      </div>

      <div
        className="mt-3 pt-3 text-xs"
        style={{ borderTop: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
      >
        📅 Prevista para{' '}
        <strong style={{ color: 'hsl(var(--ninho-brown))' }}>
          {scheduledDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </strong>
      </div>
    </motion.div>
  );
}
