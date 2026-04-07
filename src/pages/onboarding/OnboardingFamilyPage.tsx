import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useNinhoStore } from '@/store/useNinhoStore'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export function OnboardingFamilyPage() {
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const store = useNinhoStore()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || !store.user) return

    setLoading(true)
    try {
      // Create family
      const { data: family, error: famError } = await supabase
        .from('families')
        .insert({ name: trimmed, owner_user_id: store.user.id })
        .select()
        .single()

      if (famError) throw famError

      // Add owner as member
      const { error: memError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: store.user.id,
          role: 'owner',
          joined_at: new Date().toISOString(),
        })

      if (memError) {
        // Rollback
        await supabase.from('families').delete().eq('id', family.id)
        throw memError
      }

      store.setCurrentFamily({ id: family.id, name: family.name, owner_user_id: family.owner_user_id })
      store.setAppState('onboarding_child')
      toast.success(`Família "${trimmed}" criada!`)
    } catch (err: any) {
      toast.error(err.message ?? 'Não foi possível criar a família.')
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
          <div className="w-6 h-1.5 rounded-full bg-stone-300" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-stone-200">
          <div className="mb-6">
            <h2 className="text-2xl font-serif text-stone-800 mb-2">Como se chama a família?</h2>
            <p className="text-sm text-stone-500">
              Pode ser o sobrenome, um apelido carinhoso — o que fizer mais sentido pra vocês.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Família Silva"
              required
              autoFocus
              maxLength={60}
              className={cn(
                'w-full px-3.5 py-2.5 rounded-xl border text-stone-800',
                'border-stone-300 bg-stone-50',
                'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent',
                'placeholder:text-stone-400 text-sm transition'
              )}
            />
            <button
              type="submit"
              disabled={loading || !name.trim()}
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
          </form>
        </div>
      </div>
    </div>
  )
}
