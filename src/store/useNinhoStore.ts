import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AppState = 'loading' | 'unauthenticated' | 'onboarding_family' | 'onboarding_child' | 'dashboard'

export interface NinhoChild {
  id: string
  family_id: string
  preferred_name: string
  birth_date: string | null
  sex_at_birth: string | null
  created_at: string
}

export interface NinhoFamily {
  id: string
  name: string
  owner_user_id: string
}

export interface NinhoUser {
  id: string
  email: string | undefined
}

interface NinhoState {
  // Auth
  user: NinhoUser | null
  // Family
  currentFamilyId: string | null
  currentFamily: NinhoFamily | null
  // Child
  currentChildId: string | null
  currentChild: NinhoChild | null
  children: NinhoChild[]
  // App flow
  appState: AppState
  isLoadingSession: boolean
  sessionError: string | null
}

interface NinhoActions {
  setUser: (user: NinhoUser | null) => void
  setCurrentFamily: (family: NinhoFamily | null) => void
  setCurrentChild: (child: NinhoChild | null) => void
  setChildren: (children: NinhoChild[]) => void
  addChild: (child: NinhoChild) => void
  setAppState: (state: AppState) => void
  signOut: () => Promise<void>
  reset: () => void
}

export type NinhoStore = NinhoState & NinhoActions

const initialState: NinhoState = {
  user: null,
  currentFamilyId: null,
  currentFamily: null,
  currentChildId: null,
  currentChild: null,
  children: [],
  appState: 'loading',
  isLoadingSession: true,
  sessionError: null,
}

export const useNinhoStore = create<NinhoStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      setCurrentFamily: (currentFamily) =>
        set({ currentFamily, currentFamilyId: currentFamily?.id ?? null }),

      setCurrentChild: (currentChild) =>
        set({ currentChild, currentChildId: currentChild?.id ?? null }),

      setChildren: (children) => {
        const { currentChildId } = get()
        const current = children.find((c) => c.id === currentChildId) ?? children[0] ?? null
        set({ children, currentChild: current, currentChildId: current?.id ?? null })
      },

      addChild: (child) => {
        const { children } = get()
        set({ children: [child, ...children] })
      },

      setAppState: (appState) =>
        set({ appState, isLoadingSession: appState === 'loading' }),

      signOut: async () => {
        const { supabase } = await import('@/lib/supabase')
        await supabase.auth.signOut()
        set({ ...initialState, appState: 'unauthenticated', isLoadingSession: false })
      },

      reset: () =>
        set({ ...initialState, appState: 'unauthenticated', isLoadingSession: false }),
    }),
    {
      name: 'ninho-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentChildId: state.currentChildId,
        currentFamilyId: state.currentFamilyId,
      }),
    }
  )
)

export const selectors = {
  user: (s: NinhoStore) => s.user,
  appState: (s: NinhoStore) => s.appState,
  currentChild: (s: NinhoStore) => s.currentChild,
  currentFamily: (s: NinhoStore) => s.currentFamily,
  children: (s: NinhoStore) => s.children,
  isLoading: (s: NinhoStore) => s.appState === 'loading',
} as const

export const getNinhoStore = () => useNinhoStore.getState()
