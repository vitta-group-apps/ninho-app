/**
 * NINHO — DashboardPage
 *
 * Zeus: Apple Health High-Key. Nome da criança em destaque massivo (44px Bold).
 *       Branco puro, Heroicons, Cards DS elevated, zero cinza/bordas.
 * Lumen: "O ninho de [Nome]" — nome da criança central, não pronomes genéricos.
 * Lora: Card DS elevated = shadow-ds-xs, rounded-xl, sem border. Tokens semânticos.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Heart, Sparkles, ChevronRight } from 'lucide-react';
import { Text }  from '@/design-system/components/ui/Text';
import { Card }  from '@/design-system/components/ui/Card';
import { useNinhoStore } from '@/store/useNinhoStore';

// ─── quick action tile ────────────────────────────────────────────────────────

interface QuickActionProps {
  icon:    React.ReactNode;
  label:   string;
  sub:     string;
  iconBg:  string;
  iconFg:  string;
  delay:   number;
  onClick: () => void;
}

function QuickAction({ icon, label, sub, iconBg, iconFg, delay, onClick }: QuickActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      className="flex-1"
    >
      <Card variant="elevated" padding="none" onClick={onClick} className="h-full">
        <div className="flex flex-col gap-[var(--gap-md)] p-[var(--padding-lg)]">
          <div className={`w-11 h-11 rounded-[var(--radius-lg)] flex items-center justify-center ${iconBg}`}>
            <div className={`w-6 h-6 ${iconFg}`}>{icon}</div>
          </div>
          <div className="flex flex-col gap-[var(--gap-xxs)]">
            <Text variant="body-md-semibold" className="font-heading">{label}</Text>
            <Text variant="caption-regular" color="secondary">{sub}</Text>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate          = useNavigate();
  const { currentChild }  = useNinhoStore();

  const childName = currentChild?.preferred_name ?? currentChild?.name ?? '';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div
      className="min-h-screen bg-ds-pure-white flex flex-col"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)' }}
    >

      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <section className="px-[var(--padding-xl)] pt-[var(--padding-lg)] pb-[var(--padding-xxl)]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* saudação contextual */}
          <Text variant="caption-medium" color="secondary" as="p" className="mb-[var(--gap-xs)]">
            {greeting}
          </Text>

          {/* nome da criança — âncora visual dominante */}
          {childName ? (
            <h1
              className="font-heading font-bold tracking-tight text-ds-neutral-fg-strong"
              style={{ fontSize: '2.75rem', lineHeight: 1.08 }}
            >
              O ninho de{'\u00A0'}
              <span className="text-ds-accent-fg">{childName}</span>
            </h1>
          ) : (
            <h1
              className="font-heading font-bold tracking-tight text-ds-neutral-fg-strong"
              style={{ fontSize: '2.75rem', lineHeight: 1.08 }}
            >
              Bem-vindo ao{'\u00A0'}
              <span className="text-ds-accent-fg">ninho</span>
            </h1>
          )}

          <Text variant="body-md-regular" color="secondary" as="p" className="mt-[var(--gap-md)]">
            Tudo pronto para acompanhar o dia a dia.
          </Text>
        </motion.div>
      </section>

      {/* ── main ──────────────────────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col px-[var(--padding-xl)] gap-[var(--gap-lg)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
      >

        {/* label de seção */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <Text
            variant="caption-medium"
            color="secondary"
            className="uppercase tracking-widest"
          >
            Por onde começar
          </Text>
        </motion.div>

        {/* ação principal — destaque */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.985 }}
        >
          <Card variant="elevated" padding="none" onClick={() => navigate('/routine')}>
            <div className="flex items-center gap-[var(--gap-lg)] px-[var(--padding-xl)] py-[var(--padding-xl)] bg-ds-accent-subtle rounded-[var(--radius-xl)]">
              {/* ícone */}
              <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-ds-accent-tint flex items-center justify-center shrink-0">
                <Sparkles
                  className="w-7 h-7 text-ds-on-tint-white"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              {/* texto */}
              <div className="flex-1 min-w-0">
                <Text variant="body-lg-semibold" className="font-heading text-ds-accent-fg">
                  Rotina de hoje
                </Text>
                <Text variant="caption-regular" color="secondary" className="mt-[var(--gap-xxs)]">
                  {childName
                    ? `Acompanhe o dia a dia de ${childName}`
                    : 'Sono, fraldas e alimentação'}
                </Text>
              </div>
              <ChevronRight
                className="w-5 h-5 text-ds-accent-fg shrink-0"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </Card>
        </motion.div>

        {/* cards secundários lado a lado */}
        <div className="flex gap-[var(--gap-md)]">
          <QuickAction
            icon={<ClipboardList strokeWidth={1.5} />}
            label="Registros"
            sub={childName ? `Histórico de ${childName}` : 'Logs do dia'}
            iconBg="bg-ds-neutral-subtle"
            iconFg="text-ds-neutral-fg-strong"
            delay={0.28}
            onClick={() => navigate('/routine')}
          />
          <QuickAction
            icon={<Heart strokeWidth={1.5} />}
            label="Saúde"
            sub="Febre e crescimento"
            iconBg="bg-ds-success-subtle"
            iconFg="text-ds-success-fg"
            delay={0.35}
            onClick={() => navigate('/health')}
          />
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
