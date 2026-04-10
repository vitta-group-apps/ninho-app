/**
 * NINHO — useSession
 *
 * Resolve o estado da sessão e naveia o appState correspondente.
 * StateRouter em App.tsx reage às mudanças de appState.
 *
 * Fluxo:
 *   getSession() → sem sessão → 'unauthenticated'
 *   getSession() → sessão → upsert profile → check family → check children → define appState
 *
 * Por que profile upsert?
 *   Magic link cria auth.users mas não necessariamente profiles.
 *   family_members.user_id tem FK para profiles.id.
 *   Sem o upsert, o insert em family_members falha com erro de FK.
 */

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

    // ── Garantir que o perfil existe no banco ─────────────────────────────
    // Magic link cria auth.users mas não cria profiles automaticamente
    // (depende de trigger no Supabase que pode não existir).
    // upsert seguro: cria se não existe, atualiza name/avatar do OAuth se existe.
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id:         session.user.id,
        full_name:  session.user.user_metadata?.full_name
                    ?? session.user.user_metadata?.name
                    ?? null,
        avatar_url: session.user.user_metadata?.avatar_url
                    ?? session.user.user_metadata?.picture
                    ?? null,
      }, { onConflict: 'id' })

    if (profileErr) {
      // Não é fatal — a tabela pode não existir ou o trigger já cuida disso
      console.warn('[useSession] profile upsert warning:', profileErr.message)
    }

    // ── Atualizar store com dados do usuário ──────────────────────────────
    store.setUser({ id: session.user.id, email: session.user.email })

    // ── Verificar família ─────────────────────────────────────────────────
    const { data: memberData } = await supabase
      .from('family_members')
      .select('family_id, families(id, name, owner_user_id)')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!memberData?.families) {
      // Novo usuário ou onboarding incompleto
      if (!store.onboardingMode) {
        store.setAppState('onboarding_mode')
      } else {
        store.setAppState('onboarding_family')
      }
      return
    }

    const family = memberData.families as { id: string; name: string; owner_user_id: string }
    store.setCurrentFamily(family)

    // ── Verificar crianças ────────────────────────────────────────────────
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

    // Preserva currentChild persistido se ainda válido; senão usa o primeiro
    const persisted  = store.currentChild
    const stillValid = persisted && children.some((c: any) => c.id === persisted.id)
    store.setCurrentChild(stillValid ? persisted : (children[0] as any))

    store.setAppState('dashboard')

  } catch (error) {
    console.error('[useSession] error:', error)
    useNinhoStore.setState({
      appState:         'unauthenticated',
      isLoadingSession: false,
      sessionError:     translateSupabaseError(
        error instanceof Error ? { message: error.message } : null
      ),
    })
  }
}

export function useSession() {
  const store           = useNinhoStore()
  const isResolvingRef  = useRef(false)
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        } else if (
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') &&
          session?.user
        ) {
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
