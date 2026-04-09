/**
 * NINHO — DashboardPage
 * Boas-vindas pós-login / pós-onboarding.
 * ZEUS: branco puro, saudação bold dominante, zero bordas decorativas.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNinhoStore } from '@/store/useNinhoStore';
import { Text } from '@/design-system/components/ui/Text';
import { Button } from '@/design-system/components/ui/Button';

export function DashboardPage() {
  const navigate = useNavigate();
  const store  = useNinhoStore();
  const child  = store.currentChild;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const childName = child?.preferred_name ?? child?.name ?? '';

  return (
    <div
      className="min-h-screen bg-ds-pure-white flex flex-col items-center justify-center pb-24"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center text-center gap-[var(--gap-xl)] px-[var(--padding-lg)] w-full max-w-sm"
      >
        {/* emoji âncora */}
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          aria-hidden="true"
          style={{ fontSize: '5rem', lineHeight: 1 }}
          className="select-none"
        >
          🪺
        </motion.span>

        {/* saudação contextual — tipografia dominante */}
        <div className="flex flex-col gap-[var(--gap-sm)]">
          <Text variant="h1" className="font-heading tracking-tight">
            {greeting}{childName ? `,\n${childName}` : ''}
          </Text>
          <Text variant="body-md-regular" color="secondary">
            Tudo pronto para acompanhar o dia a dia do seu bebê.
          </Text>
        </div>

        {/* CTA primário grande */}
        <Button
          label="Ver rotina de hoje →"
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/routine')}
        />
      </motion.div>
    </div>
  );
}

export default DashboardPage;
