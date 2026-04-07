import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type AuthStep = 'email' | 'otp' | 'password'

export function AuthPage() {
  const [step, setStep]         = useState<AuthStep>('email')
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setStep('otp')
      setResendCooldown(60)
      toast.success('Código enviado! Confere o teu e-mail.')
    } catch (err: any) {
      toast.error(err.message ?? 'Não foi possível enviar o código.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: 'email',
      })
      if (error) throw error
      // useSession will pick up SIGNED_IN event automatically
    } catch (err: any) {
      toast.error('Código inválido ou expirado. Tenta novamente.')
      setOtp('')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      })
      if (error) throw error
      setResendCooldown(60)
      setOtp('')
      toast.success('Novo código enviado!')
    } catch {
      toast.error('Não foi possível reenviar.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) throw error
    } catch (err: any) {
      toast.error('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-200 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-sage-500 flex items-center justify-center shadow-md mb-4">
            <span className="text-white text-2xl font-serif">n</span>
          </div>
          <h1 className="text-3xl text-stone-800 font-serif">ninho</h1>
          <p className="text-stone-500 text-sm mt-1 font-sans">cuidar, juntos.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">

          {/* Email step */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <h2 className="text-lg font-serif text-stone-800 mb-1">Bem-vinda de volta</h2>
                <p className="text-sm text-stone-500">Entra com o teu e-mail para continuar.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">E-mail</label>
                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@exemplo.com"
                  required
                  autoComplete="email"
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-stone-800',
                    'border-stone-300 bg-stone-50',
                    'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent',
                    'placeholder:text-stone-400 text-sm transition'
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className={cn(
                  'w-full py-2.5 rounded-xl font-medium text-sm transition',
                  'bg-sage-500 text-white hover:bg-sage-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continuar
              </button>
              <button
                type="button"
                onClick={() => setStep('password')}
                className="w-full text-center text-sm text-stone-400 hover:text-stone-600 transition"
              >
                Prefiro usar senha
              </button>
            </form>
          )}

          {/* OTP step */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h2 className="text-lg font-serif text-stone-800 mb-1">Verifica o teu e-mail</h2>
                <p className="text-sm text-stone-500">
                  Enviámos um código de 6 dígitos para{' '}
                  <span className="font-medium text-stone-700">{email}</span>.
                </p>
              </div>

              {/* OTP visual input */}
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-10 h-12 rounded-lg border-2 flex items-center justify-center',
                      'text-lg font-mono font-semibold text-stone-800',
                      otp.length === i
                        ? 'border-sage-500 bg-sage-50'
                        : otp[i]
                          ? 'border-sage-300 bg-white'
                          : 'border-stone-200 bg-stone-50'
                    )}
                  >
                    {otp[i] ?? ''}
                  </div>
                ))}
              </div>

              {/* Hidden real input */}
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtp(val)
                }}
                className="sr-only"
                aria-label="Código de verificação"
              />

              <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="w-full py-2.5 rounded-xl bg-stone-100 text-stone-600 text-sm hover:bg-stone-200 transition"
              >
                Toca aqui para digitar o código
              </button>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={cn(
                  'w-full py-2.5 rounded-xl font-medium text-sm transition',
                  'bg-sage-500 text-white hover:bg-sage-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verificar código
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp('') }}
                  className="text-stone-400 hover:text-stone-600 transition"
                >
                  ← Mudar e-mail
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sage-600 hover:text-sage-700 disabled:text-stone-400 disabled:cursor-not-allowed transition"
                >
                  {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar código'}
                </button>
              </div>
            </form>
          )}

          {/* Password step */}
          {step === 'password' && (
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <h2 className="text-lg font-serif text-stone-800 mb-1">Entrar com senha</h2>
                <p className="text-sm text-stone-500">
                  Entra com o teu e-mail e senha.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@exemplo.com"
                  required
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-stone-800',
                    'border-stone-300 bg-stone-50',
                    'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent',
                    'placeholder:text-stone-400 text-sm transition'
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Senha</label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className={cn(
                    'w-full px-3.5 py-2.5 rounded-xl border text-stone-800',
                    'border-stone-300 bg-stone-50',
                    'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent',
                    'placeholder:text-stone-400 text-sm transition'
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className={cn(
                  'w-full py-2.5 rounded-xl font-medium text-sm transition',
                  'bg-sage-500 text-white hover:bg-sage-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2'
                )}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-center text-sm text-stone-400 hover:text-stone-600 transition"
              >
                ← Usar código por e-mail
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
