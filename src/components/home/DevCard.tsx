import { motion } from 'framer-motion';
import { getDevelopmentMilestone } from '@/data/vaccineSchedule';
import { MockChild } from '@/hooks/useChild';

interface DevCardProps {
  child: MockChild;
}

export function DevCard({ child }: DevCardProps) {
  const milestone = getDevelopmentMilestone(child.birthDate);

  return (
    <motion.div
      className="mx-5 mb-4 rounded-2xl p-5 overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--ninho-mauve) / 0.12) 0%, hsl(var(--ninho-sage) / 0.1) 100%)',
        border: '1px solid hsl(var(--ninho-mauve) / 0.2)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Decorative */}
      <div
        className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
      />

      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ backgroundColor: 'hsl(var(--ninho-mauve) / 0.15)' }}
        >
          {milestone.emoji}
        </div>
        <div className="flex-1">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-1"
            style={{ color: 'hsl(var(--ninho-mauve))', fontFamily: 'Nunito, sans-serif' }}
          >
            Salto de Desenvolvimento
          </p>
          <p
            className="text-base font-bold"
            style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
          >
            {milestone.title}
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {milestone.milestones.map((m, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm"
            style={{ color: 'hsl(var(--ninho-brown) / 0.8)', fontFamily: 'Nunito, sans-serif' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
              style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
            />
            {m}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
