import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CompletePage() {
  const navigate = useNavigate();
  const childName = sessionStorage.getItem('onboarding_child_name') || 'sua família';

  useEffect(() => {
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
      style={{ backgroundColor: '#F8F5F0' }}
    >
      {/* Progress — todos verdes */}
      <div className="flex gap-1.5 w-full max-w-xs mb-12">
        {[1, 2, 3].map(s => (
          <div key={s} className="h-1 rounded-full flex-1"
            style={{ backgroundColor: '#789687' }} />
        ))}
      </div>

      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
      >
        {/* Ícone de sucesso */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-6"
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 88, height: 88,
              backgroundColor: '#ebf0ed',
              border: '2px solid #ccd9d3',
            }}
          >
            <span style={{ fontSize: 40 }}>✅</span>
          </div>
        </motion.div>

        <h1 className="text-[30px] font-bold mb-2"
          style={{ fontFamily: 'Quicksand, sans-serif', color: '#2C2C2C' }}>
          Tudo pronto!
        </h1>

        <p className="text-[15px] mb-1"
          style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}>
          O ninho está preparado para
        </p>

        <p className="text-[20px] font-bold mb-10"
          style={{ color: '#806e84', fontFamily: 'Quicksand, sans-serif' }}>
          {childName} 🐣
        </p>

        {/* Mensagem de boas-vindas */}
        <div
          className="w-full max-w-xs px-4 py-3 rounded-2xl mb-8 text-center"
          style={{ backgroundColor: '#f4f0f3', border: '1px solid #e3d9e2' }}
        >
          <p className="text-[13px] leading-relaxed"
            style={{ color: '#7A7A7A', fontFamily: 'Nunito, sans-serif' }}>
            Comece registrando a primeira mamada, sono ou fraldinha — tudo fica salvo e organizado aqui.
          </p>
        </div>

        <button
          onClick={goHome}
          className="w-full max-w-xs rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
          style={{
            height: 52,
            backgroundColor: '#806e84',
            fontFamily: 'Nunito, sans-serif',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Ir para o início →
        </button>
      </motion.div>
    </div>
  );
}
