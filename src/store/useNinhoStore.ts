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

// Interface Child Expandida para aceitar o Schema Completo do useSession
export interface Child { 
  id: string; 
  name: string; 
  preferred_name: string | null;
  sex_at_birth: 'female' | 'male' | 'unknown' | string; 
  birth_date: string | null;
  // Propriedades de saúde detectadas no erro do useSession
  allergies?: string[] | null;
  birth_head_cm?: number | null;
  birth_hospital?: string | null;
  birth_length_cm?: number | null;
  birth_weight_grams?: number | null;
  blood_type?: string | null;
  updated_at?: string;
  [key: string]: any; // Permite outras propriedades do banco sem quebrar o TS
}

export type AppStatus = 
  | 'loading' 
  | 'auth' 
  | 'unauthenticated' 
  | 'onboarding' 
  | 'onboarding_family' 
  | 'onboarding_child' 
  | 'dashboard' 
  | 'ready';

interface NinhoState {
  profile: Profile | null;
  currentFamily: Family | null;
  currentChild: Child | null;
  children: Child[];
  appState: AppStatus;
  isLoadingSession: boolean; // Exigido pelo useSession.ts(53,7)
  
  setProfile: (profile: Profile | null) => void;
  setUser: (user: any) => void; 
  setCurrentFamily: (family: Family | null) => void;
  setCurrentChild: (child: Child | null) => void;
  setChildren: (children: any[]) => void; // Aceita o array completo do banco
  setAppState: (state: AppStatus) => void;
  setIsLoadingSession: (loading: boolean) => void;
  signOut: () => Promise<void>;
  reset: () => void;
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
      
      setProfile: (profile) => set({ profile }),
      setUser: (user) => set({ profile: user }),
      setCurrentFamily: (family) => set({ currentFamily: family }),
      setCurrentChild: (child) => set({ currentChild: child }),
      setChildren: (children) => set({ children }),
      setAppState: (state) => set({ appState: state }),
      setIsLoadingSession: (isLoadingSession) => set({ isLoadingSession }),
      
      signOut: async () => {
        set({ profile: null, currentFamily: null, currentChild: null, children: [], appState: 'auth' });
      },
      reset: () => {
        set({ profile: null, currentFamily: null, currentChild: null, children: [], appState: 'auth' });
      }
    }),
    { name: 'ninho-storage' }
  )
)

export const getNinhoStore = () => useNinhoStore.getState();
