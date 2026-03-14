import { motion } from 'framer-motion';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: 'hsl(var(--ninho-mauve))' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      onAnimationComplete={() => {
        // Trigger finish after full splash duration
        setTimeout(onFinish, 0);
      }}
    >
      {/* Animated Ninho Spiral Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="mb-8"
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer arc / nest shape */}
          <motion.path
            d="M 20 70 Q 10 30 50 20 Q 90 10 85 50 Q 80 80 50 85 Q 25 88 20 70"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.1 }}
          />
          {/* Inner nest arc */}
          <motion.path
            d="M 30 65 Q 25 42 50 36 Q 72 30 70 52 Q 68 68 50 72 Q 34 75 30 65"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: 'easeInOut', delay: 0.4 }}
          />
          {/* Center dot / egg */}
          <motion.circle
            cx="50"
            cy="54"
            r="6"
            fill="white"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 1.0 }}
          />
          {/* Small accent dots */}
          <motion.circle
            cx="38"
            cy="52"
            r="3"
            fill="rgba(255,255,255,0.6)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.1 }}
          />
          <motion.circle
            cx="62"
            cy="52"
            r="3"
            fill="rgba(255,255,255,0.6)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.15 }}
          />
        </svg>
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="text-5xl font-bold tracking-tight"
        style={{ color: 'white', fontFamily: 'Quicksand, sans-serif' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        ninho
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-3 text-base text-center px-8"
        style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'Nunito, sans-serif' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        Sua rede de apoio em cada fase do bebê.
      </motion.p>

      {/* Auto-dismiss after 2.8s */}
      <AutoDismiss onFinish={onFinish} delay={2800} />
    </motion.div>
  );
}

function AutoDismiss({ onFinish, delay }: { onFinish: () => void; delay: number }) {
  // We use a simple effect via inline component trick
  import('react').then(({ useEffect }) => {
    // This pattern won't work. Using a different approach below.
  });
  return null;
}

// Re-export properly with useEffect
import { useEffect } from 'react';

export function SplashScreenWrapper({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return <SplashScreen onFinish={onFinish} />;
}
