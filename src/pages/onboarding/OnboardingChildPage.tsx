import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useNinhoStore } from '@/store/useNinhoStore'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type InternalStep = 'name' | 'birthdate' | 'sex'

export function OnboardingChildPage() {
  const [step, setStep]           = useState<InternalStep>('name')
  const [childName, setChildName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [sex, setSex]             = useState<'male' | 'female' | 'undisclosed' | ''>('')
  const [loading, setLoading]     = useState(false)
  const store = useNinhoStore()

  function formatBirthdate(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  function parseDate(ddmmyyyy: string): string | null {
    const parts = ddmmyyyy.split('/')
    if (parts.length !== 3) return null
    const [dd, mm, yyyy] = parts
    if (!dd || !mm || !yyyy || yyyy.length < 4) return null
    const date = new Date(`${yyyy}-${mm}-${dd}`)
    if (isNaN(date.getTime())) return null
    return `${yyyy}-${mm}-${dd}`
  }

  async function handleCreate() {
    if (!store.currentFamilyId) return
    setLoading(true)
    try {
      const isoDate = parseDate(birthdate)
      const { data: child, error } = await supabase
        .from('children')
        .insert({
          family_id: store.currentFamilyId,
          preferred_name: childName.trim(),
          birth_date: isoDate,
          sex_at_birth: sex === 'undisclosed' || sex === '' ? null : sex,
        })
        .select()
        .single()

      if (error) throw error

      store.setCurrentChild(child)
      store.addChild(child)
      store.setAppState('dashboard')
      toast.success(`${childName.trim()} foi adicionado(a)!`)
    } catch (err: any) {
      toast.error(err.message ?? 'Não foi possível adicionar a criança.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-200 flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-6 h-1.5 rounded-full bg-sage-500" />
          <div className="w-6 h-1.5 rounded-full bg-sage-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">

          {/* Step: name */}
          {step === 'name' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-stone-800 mb-2">Como se chama a criança?</h2>
                <p className="text-sm text-stone-500">O nome que ela gosta de ser chamada.</p>
              </div>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="ex: Bela"
                required
                autoFocus
                maxLength={40}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl border text-stone-800',
                  'border-stone-300 bg-stone-50',
                  'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent',
                  'placeholder:text-stone-400 text-sm transition'
                )}
              />
              <button
                onClick={() => setStep('birthdate')}
                disabled={!childName.trim()}
                className={cn(
                  'w-full py-2.5 rounded-xl font-medium text-sm transition',
                  'bg-sage-500 text-white hover:bg-sage-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step: birthdate */}
          {step === 'birthdate' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-stone-800 mb-2">
                  Quando {childName} nasceu?
                </h2>
                <p className="text-sm text-stone-500">Isso ajuda a personalizar os conteúdos.</p>
              </div>
              <input
                type="text"
                value={birthdate}
                onChange={(e) => setBirthdate(formatBirthdate(e.target.value))}
                placeholder="DD/MM/AAAA"
                inputMode="numeric"
                autoFocus
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl border text-stone-800',
                  'border-stone-300 bg-stone-50',
                  'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent',
                  'placeholder:text-stone-400 text-sm transition font-mono tracking-widest'
                )}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('name')}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-600 text-sm hover:bg-stone-50 transition"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep('sex')}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl font-medium text-sm transition',
                    'bg-sage-500 text-white hover:bg-sage-600'
                  )}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step: sex */}
          {step === 'sex' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif text-stone-800 mb-2">
                  Sexo biológico de {childName}
                </h2>
                <p className="text-sm text-stone-500">Utilizado para referências de saúde. Opcional.</p>
              </div>
              <div className="space-y-2">
                {[
                  { value: 'female', label: 'Feminino' },
                  { value: 'male',   label: 'Masculino' },
                  { value: 'undisclosed', label: 'Prefiro não dizer' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSex(opt.value as typeof sex)}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl border text-left text-sm transition',
                      sex === opt.value
                        ? 'border-sage-500 bg-sage-50 text-sage-700 font-medium'
                        : 'border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('birthdate')}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-600 text-sm hover:bg-stone-50 transition"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl font-medium text-sm transition',
                    'bg-sage-500 text-white hover:bg-sage-600',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center justify-center gap-2'
                  )}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Começar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
