import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function CompletePage() {
  const navigate = useNavigate();
  const childName = sessionStorage.getItem('onboarding_child_name') || 'sua família';

  useEffect(() => {
    // Clean up onboarding session data
    return () => {
      sessionStorage.removeItem('onboarding_family_id');
      sessionStorage.removeItem('onboarding_child_name');
    };
  }, []);

  function goHome() {
    sessionStorage.removeItem('onboarding_family_id');
    sessionStorage.removeItem('onboarding_child_name');
    navigate('/home', { replace: true });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
    >
      {/* Step indicator */}
      <div className="flex gap-1.5 w-full max-w-xs mb-12">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className="h-1 rounded-full flex-1"
            style={{ backgroundColor: 'hsl(var(--ninho-sage))' }}
          />
        ))}
      </div>

      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
        >
          <CheckCircleIcon
            className="w-20 h-20 mb-6"
            style={{ color: 'hsl(var(--ninho-sage))' }}
          />
        </motion.div>

        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: 'Quicksand, sans-serif', color: 'hsl(var(--ninho-brown))' }}
        >
          Tudo pronto!
        </h1>
        <p
          className="text-base mb-2"
          style={{ color: 'hsl(var(--muted-foreground))', fontFamily: 'Nunito, sans-serif' }}
        >
          Tudo pronto para
        </p>
        <p
          className="text-xl font-bold mb-10"
          style={{ color: 'hsl(var(--ninho-brown))', fontFamily: 'Quicksand, sans-serif' }}
        >
          {childName} 🐣
        </p>

        <Button
          onClick={goHome}
          className="w-full max-w-xs rounded-2xl text-sm font-bold"
          style={{
            height: '52px',
            backgroundColor: 'hsl(var(--ninho-sage))',
            color: 'white',
            fontFamily: 'Nunito, sans-serif',
          }}
        >
          Ir para o início
        </Button>
      </motion.div>
    </div>
  );
}
