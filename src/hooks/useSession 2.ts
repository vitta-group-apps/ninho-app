import { useEffect, useRef, useCallback } from 'react'
import { supabase, translateSupabaseError } from '@/lib/supabase'
import { useNinhoStore, getNinhoStore } from '@/store/useNinhoStore'

async function resolveSession(): Promise<void> {
  const store = getNinhoStore()
  store.setAppState('loading')

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      store.setAppState('unauthenticated')
      return
    }

    store.setUser({ id: session.user.id, email: session.user.email })

    // Check family membership
    const { data: memberData } = await supabase
      .from('family_members')
      .select('family_id, families(id, name, owner_user_id)')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!memberData?.families) {
      store.setAppState('onboarding_family')
      return
    }

    const family = memberData.families as { id: string; name: string; owner_user_id: string }
    store.setCurrentFamily(family)

    // Check children
    const { data: children } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at', { ascending: false })

    if (!children || children.length === 0) {
      store.setAppState('onboarding_child')
      return
    }

    store.setChildren(children)

    // Preserva currentChild persistido se ainda estiver na lista; caso contrário, seleciona o primeiro
    const persisted  = store.currentChild
    const stillValid = persisted && children.some((c: any) => c.id === persisted.id)
    store.setCurrentChild(stillValid ? persisted : (children[0] as any))

    store.setAppState('dashboard')

  } catch (error) {
    console.error('[useSession] error:', error)
    useNinhoStore.setState({
      appState: 'unauthenticated',
      isLoadingSession: false,
      sessionError: translateSupabaseError(
        error instanceof Error ? { message: error.message } : null
      ),
    })
  }
}

export function useSession() {
  const store = useNinhoStore()
  const isResolvingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const safeResolve = useCallback(async () => {
    if (isResolvingRef.current) return
    isResolvingRef.current = true
    try {
      await resolveSession()
    } finally {
      isResolvingRef.current = false
    }
  }, [])

  useEffect(() => {
    safeResolve()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (event === 'SIGNED_OUT') {
          getNinhoStore().reset()
        } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          safeResolve()
        }
      }, 300)
    })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [safeResolve])

  return { ...store, refresh: safeResolve }
}
