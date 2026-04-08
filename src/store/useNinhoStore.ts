import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Profile { 
  id: string; 
  full_name: string | null; 
  avatar_url: string | null; 
}

export interface Family { 
  id: string; 
  name: string; 
}

export interface Child { 
  id: string; 
  name: string; 
  preferred_name: string | null;
  sex_at_birth: string; 
  birth_date: string | null;
  [key: string]: any; 
}

export type AppStatus = 
  | 'loading' | 'auth' | 'unauthenticated' | 'onboarding' 
  | 'onboarding_family' | 'onboarding_child' | 'dashboard' | 'ready';

interface NinhoState {
  profile: Profile | null;
  currentFamily: Family | null;
  currentChild: Child | null;
  children: Child[];
  appState: AppStatus;
  isLoadingSession: boolean;
  sessionError: string | null; // O QUE ESTAVA FALTANDO AGORA
  
  setProfile: (profile: Profile | null) => void;
  setUser: (user: any) => void; 
  setCurrentFamily: (family: Family | null) => void;
  setCurrentChild: (child: Child | null) => void;
  setChildren: (children: any[]) => void;
  setAppState: (state: AppStatus) => void;
  setIsLoadingSession: (loading: boolean) => void;
  setSessionError: (error: string | null) => void;
  signOut: () => Promise<void>;
  reset: () => void;
  
  // Blindagem contra propriedades futuras que o Claude possa injetar
  [key: string]: any;
}

export const useNinhoStore = create<NinhoState>()(
  persist(
    (set) => ({
      profile: null,
      currentFamily: null,
      currentChild: null,
      children: [],
      appState: 'loading',
      isLoadingSession: true,
      sessionError: null,
      
      setProfile: (profile) => set({ profile }),
      setUser: (user) => set({ profile: user }),
      setCurrentFamily: (family) => set({ currentFamily: family }),
      setCurrentChild: (child) => set({ currentChild: child }),
      setChildren: (children) => set({ children }),
      setAppState: (state) => set({ appState: state }),
      setIsLoadingSession: (loading) => set({ isLoadingSession: loading }),
      setSessionError: (sessionError) => set({ sessionError }),
      
      signOut: async () => {
        set({ profile: null, currentFamily: null, currentChild: null, children: [], appState: 'auth' });
      },
      reset: () => {
        set({ profile: null, currentFamily: null, currentChild: null, children: [], appState: 'auth' });
      }
    }),
    {
      name: 'ninho-storage',
      // Nunca persistir estado transitório — evita appState:'loading' sobreviver ao refresh
      partialize: (state) => ({
        profile:       state.profile,
        currentFamily: state.currentFamily,
        currentChild:  state.currentChild,
        children:      state.children,
      }),
    }
  )
)

export const getNinhoStore = () => useNinhoStore.getState();
