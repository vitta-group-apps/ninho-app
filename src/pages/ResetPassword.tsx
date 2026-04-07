import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../integrations/supabase/client';
import simboloNinho from '../assets/simbolo-ninho.png';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  // ── Detecta token do link de email ──────────────────────────────
  // Supabase envia o token como hash fragment: #access_token=...&type=recovery
  // onAuthStateChange dispara com evento 'PASSWORD_RECOVERY' quando o token é válido
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setTokenReady(true);
      }
    });

    // Também tenta pegar sessão existente (caso usuário já esteja autenticado via link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setTokenReady(true);
    });

    // Timeout — se em 5s não chegou nenhum token, link é inválido ou expirado
    const timeout = setTimeout(() => {
      setInvalidToken(prev => {
        if (!tokenReady) return true;
        return prev;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [tokenReady]);

  // Validação
  const pwLen   = password.length >= 6;
  const pwUpper = /[A-Z]/.test(password);
  const pwNum   = /\d/.test(password);
  const pwMatch = password === confirm && confirm.length > 0;
  const isValid = pwLen && pwUpper && pwNum && pwMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      if (error.message.includes('same password')) {
        setError('A nova senha não pode ser igual à senha atual.');
      } else {
        setError('Não foi possível atualizar a senha. O link pode ter expirado.');
      }
    } else {
      setSuccess(true);
      // Limpa sessão de recovery para forçar login limpo
      setTimeout(() => supabase.auth.signOut(), 1500);
    }
  }

  // ── Estados de carregamento ──────────────────────────────────────

  // Aguardando token
  if (!tokenReady && !invalidToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: '#F8F5F0' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-4"
          style={{ borderColor: '#806e84' }} />
        <p className="text-[13px] font-nunito" style={{ color: '#7A7A7A' }}>
          Verificando link...
        </p>
      </div>
    );
  }

  // Token inválido ou expirado
  if (invalidToken && !tokenReady) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F5F0' }}>
        <div className="relative overflow-hidden flex-shrink-0 flex flex-col items-center px-6 pb-8"
          style={{
            backgroundColor: '#806e84',
            borderRadius: '0 0 28px 28px',
            paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
          }}>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
          }} />
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
            Link inválido
          </h1>
          <p className="relative z-10 text-center mt-1 text-[13px]"
            style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
            Este link expirou ou já foi usado.
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#FCEAEA', border: '2px solid #f5caca' }}>
            <span className="text-4xl">⚠️</span>
          </div>
          <div className="text-center">
            <p className="text-[17px] font-bold font-quicksand" style={{ color: '#2C2C2C' }}>
              Link expirado
            </p>
            <p className="text-[13px] mt-1.5 font-nunito leading-snug" style={{ color: '#7A7A7A' }}>
              Links de redefinição de senha expiram em 1 hora. Solicite um novo link.
            </p>
          </div>
          <button
            onClick={() => navigate('/onboarding/auth?tab=login')}
            className="w-full py-[15px] rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
            style={{ backgroundColor: '#806e84', fontFamily: 'Nunito, sans-serif', border: 'none', cursor: 'pointer' }}
          >
            Solicitar novo link →
          </button>
        </div>
      </div>
    );
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
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />
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
          {success ? 'Senha alterada!' : 'Nova senha'}
        </h1>
        <p className="relative z-10 text-center mt-1 text-[13px]"
          style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'Nunito, sans-serif', lineHeight: 1.5 }}>
          {success
            ? 'Sua senha foi atualizada com sucesso.'
            : 'Digite e confirme sua nova senha.'}
        </p>
      </div>

      {/* Corpo */}
      <div className="flex-1 px-6 pt-7 pb-10">
        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center pt-8 gap-6"
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#ebf0ed', border: '2px solid #ccd9d3' }}>
              <span className="text-4xl">✅</span>
            </div>
            <div>
              <p className="text-[17px] font-bold font-quicksand" style={{ color: '#2C2C2C' }}>
                Tudo certo!
              </p>
              <p className="text-[13px] mt-1 font-nunito" style={{ color: '#7A7A7A' }}>
                Agora você pode entrar com a nova senha.
              </p>
            </div>
            <button
              onClick={() => navigate('/onboarding/auth?tab=login')}
              className="w-full py-[15px] rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95"
              style={{ backgroundColor: '#806e84', fontFamily: 'Nunito, sans-serif', border: 'none', cursor: 'pointer' }}
            >
              Ir para o login →
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
            {/* Nova senha */}
            <div>
              <label className="block mb-[5px]" style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                Nova senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Crie sua nova senha"
                required
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
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  {[
                    { ok: pwLen,   label: '≥ 6 caracteres' },
                    { ok: pwUpper, label: '1 maiúscula' },
                    { ok: pwNum,   label: '1 número' },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="text-[11px]" style={{ color: ok ? '#789687' : '#CBCBC8' }}>
                        {ok ? '●' : '○'}
                      </span>
                      <span className="text-[11px] font-nunito"
                        style={{ color: ok ? '#789687' : '#CBCBC8' }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="block mb-[5px]" style={{
                fontFamily: 'Nunito, sans-serif', fontSize: 10, fontWeight: 700,
                color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full px-4 py-3 text-sm outline-none transition-all"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  backgroundColor: '#E8E8E2',
                  border: `1.5px solid ${confirm.length > 0
                    ? pwMatch ? '#789687' : '#C04A4A'
                    : 'transparent'}`,
                  borderRadius: 12, color: '#2C2C2C',
                }}
                onFocus={e => { if (!confirm.length) e.target.style.borderColor = '#C7B3C5'; }}
                onBlur={e => { if (!confirm.length) e.target.style.borderColor = 'transparent'; }}
              />
              {confirm.length > 0 && !pwMatch && (
                <p className="mt-1 text-[11px] font-nunito" style={{ color: '#C04A4A' }}>
                  As senhas não coincidem
                </p>
              )}
            </div>

            {/* Error box */}
            {error && (
              <div className="px-3 py-2.5 rounded-xl text-xs font-nunito"
                style={{ backgroundColor: '#FCEAEA', border: '1px solid #f5caca', color: '#C04A4A' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-[15px] rounded-2xl font-bold text-[15px] text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: '#806e84', fontFamily: 'Nunito, sans-serif', border: 'none', cursor: 'pointer' }}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha →'}
            </button>

            <p className="text-center text-[11px] font-nunito" style={{ color: '#7A7A7A' }}>
              Lembrou a senha?{' '}
              <button type="button"
                onClick={() => navigate('/onboarding/auth?tab=login')}
                style={{ color: '#806e84', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                Fazer login
              </button>
            </p>
          </motion.form>
        )}
      </div>
    </div>
  );
}