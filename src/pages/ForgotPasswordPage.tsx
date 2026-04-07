import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../integrations/supabase/client';
import simboloNinho from '../assets/simbolo-ninho.png';

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function ForgotPasswordPage() {
  const navigate  = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) { setError('Digite um e-mail válido.'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError('Não foi possível enviar o e-mail. Tente novamente.');
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>

      {/* Header roxo */}
      <div
        className="relative overflow-hidden flex-shrink-0 flex flex-col items-center px-6 pb-8"
        style={{
          backgroundColor: '#806e84',
          borderRadius: '0 0 28px 28px',
          paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
        }}
      >
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />

        {/* Voltar */}
        <button
          onClick={() => navigate('/onboarding/auth?tab=login')}
          className="absolute left-5 top-[calc(env(safe-area-inset-top)+16px)] z-10 flex items-center gap-1 text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'Nunito, sans-serif', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Voltar
        </button>

        {/* Logo */}
        <div className="relative z-10 mb-3" style={{
          width: 40, height: 40, borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.12)',
          border: '1.5px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src={simboloNinho} alt="Ninho"
            style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>

        <h1 className="relative z-10 text-white text-[22px] font-bold text-center"
          style={{ fontFamily: 'Quicksand, sans-serif' }}>
          {sent ? 'E-mail enviado!' : 'Esqueceu a senha?'}
        </h1>
        <p className="relative z-10 text-center mt-1 text-[13px]"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5, maxWidth: 260 }}>
          {sent
            ? 'Verifique sua caixa de entrada e spam.'
            : 'Informe seu e-mail e enviaremos um link para criar uma nova senha.'}
        </p>
      </div>

      {/* Corpo */}
      <div className="flex-1 px-6 pt-7 pb-10">
        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center pt-8 gap-6"
          >
            {/* Ícone */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f4f0f3', border: '2px solid #e3d9e2' }}>
              <span className="text-4xl">📬</span>
            </div>

            {/* Info */}
            <div>
              <p className="text-[17px] font-bold font-quicksand" style={{ color: '#2C2C2C' }}>
                Link enviado!
              </p>
              <p className="text-[13px] mt-1 font-nunito leading-snug" style={{ color: '#7A7A7A' }}>
                Se esse e-mail estiver cadastrado, você receberá um link em breve.
               </p>
              <p className="text-[14px] font-bold font-nunito mt-0.5" style={{ color: '#806e84' }}>
                {email}
              </p>
            </div>

            {/* Info box */}
            <div className="w-full px-4 py-3 rounded-2xl text-left"
              style={{ backgroundColor: '#f4f0f3', border: '1px solid #e3d9e2' }}>
              <p className="text-[12px] font-nunito leading-relaxed" style={{ color: '#7A7A7A' }}>
                ⏱ O link expira em <strong style={{ color: '#2C2C2C' }}>1 hora</strong>. Verifique também a pasta de spam.
              </p>
            </div>

            {/* Reenviar */}
            <button
              onClick={() => setSent(false)}
              className="text-[13px] font-semibold font-nunito"
              style={{ color: '#806e84', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Não recebi — reenviar
            </button>

            {/* Voltar login */}
            <button
              onClick={() => navigate('/onboarding/auth?tab=login')}
              className="w-full py-[15px] rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
              style={{ backgroundColor: '#806e84', fontFamily: 'Nunito, sans-serif', border: 'none', cursor: 'pointer' }}
            >
              Voltar para o login
            </button>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
            noValidate
          >
            <div>
              <label className="block mb-[5px]" style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                E-mail cadastrado
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                autoFocus
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  backgroundColor: '#E8E8E2',
                  border: '1.5px solid transparent',
                  borderRadius: 12, color: '#2C2C2C',
                }}
                onFocus={e => e.target.style.borderColor = '#C7B3C5'}
                onBlur={e => e.target.style.borderColor = 'transparent'}
              />
            </div>

            {error && (
              <div className="px-3 py-2.5 rounded-xl text-xs font-nunito"
                style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca', color: '#C04A4A' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValidEmail(email)}
              className="w-full py-[15px] rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#806e84', fontFamily: 'Nunito, sans-serif', border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Enviando...' : 'Enviar link de redefinição →'}
            </button>

            <p className="text-center text-[11px] font-nunito" style={{ color: '#7A7A7A' }}>
              Lembrou a senha?{' '}
              <button
                type="button"
                onClick={() => navigate('/onboarding/auth?tab=login')}
                style={{ color: '#806e84', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Fazer login
              </button>
            </p>
          </motion.form>
        )}
      </div>
    </div>
  );
}