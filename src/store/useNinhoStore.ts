import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Profile { id: string; full_name: string | null; avatar_url: string | null; }
interface Family { id: string; name: string; }
interface Child { id: string; name: string; sex_at_birth: 'female' | 'male' | 'unknown'; }

interface NinhoState {
  profile: Profile | null;
  currentFamily: Family | null;
  currentChild: Child | null;
  appState: 'auth' | 'onboarding' | 'ready';
  setProfile: (profile: Profile | null) => void;
  setCurrentFamily: (family: Family | null) => void;
  setCurrentChild: (child: Child | null) => void;
  setAppState: (state: 'auth' | 'onboarding' | 'ready') => void;
}

export const useNinhoStore = create<NinhoState>()(
  persist(
    (set) => ({
      profile: null,
      currentFamily: null,
      currentChild: null,
      appState: 'auth',
      setProfile: (profile) => set({ profile }),
      setCurrentFamily: (family) => set({ currentFamily: family }),
      setCurrentChild: (child) => set({ currentChild: child }),
      setAppState: (state) => set({ appState: state }),
    }),
    { name: 'ninho-storage' }
  )
)
