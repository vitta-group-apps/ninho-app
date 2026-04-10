/**
 * NINHO — SplashScreen
 * Animação de entrada do app — logo oficial com spring + glow pulsante.
 * Mostrada enquanto appState === 'loading' (resolução de sessão).
 */

import { motion } from 'framer-motion';
import { NinhoIcon, NinhoWordmark } from './NinhoLogo';

const MAUVE700 = '#6e2880';
const MAUVE300 = '#d8b9df';

export function SplashScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>

      {/* ── símbolo com glow ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* anel de glow externo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.28, 1], opacity: [0.18, 0.04, 0.18] }}
          transition={{ delay: 0.5, duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle, ${MAUVE300} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* anel de glow interno */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.14, 1], opacity: [0.25, 0.08, 0.25] }}
          transition={{ delay: 0.3, duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 100, height: 100, borderRadius: '50%',
            background: `radial-gradient(circle, ${MAUVE300} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />

        {/* ícone */}
        <motion.div
          initial={{ scale: 0.35, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.75,
            ease: [0.34, 1.45, 0.64, 1], // spring overshoot suave
          }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <NinhoIcon size={76} color={MAUVE700} />
        </motion.div>
      </div>

      {/* ── wordmark ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <NinhoWordmark height={22} color={MAUVE700} />
      </motion.div>

    </div>
  );
}
