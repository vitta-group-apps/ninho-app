/**
 * NINHO — SplashScreen
 * Animação de entrada: logo oficial completo como uma unidade.
 * O arquivo logo-ninho.svg já tem símbolo + wordmark juntos.
 * Sem separação de partes — anima o NinhoWordmark como peça única.
 */

import { motion } from 'framer-motion';
import { NinhoWordmark } from './NinhoLogo';

export function SplashScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* glow pulsante centralizado no símbolo (lado esquerdo do logo) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.28, 0.10, 0.28], scale: [0.8, 1.2, 1.0, 1.2] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          style={{
            position: 'absolute',
            left: '-10%',      // alinha com o símbolo (lado esq do wordmark)
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 120, height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #d8b9df 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* logo completo — símbolo + wordmark como uma peça só */}
        <motion.div
          initial={{ opacity: 0, scale: 0.82, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.72,
            ease: [0.34, 1.38, 0.64, 1],   // spring suave com leve overshoot
          }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <NinhoWordmark height={42} color="#6e2880" />
        </motion.div>

      </div>
    </div>
  );
}
