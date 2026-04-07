import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Interfaces alinhadas com o Schema v2 e o Dashboard real
interface Profile { 
  id: string; 
  full_name: string | null; 
  avatar_url: string | null; 
}

interface Family { 
  id: string; 
  name: string; 
}

interface Child { 
  id: string; 
  name: string; 
  preferred_name: string | null; // Exigido pelo DashboardPage
  sex_at_birth: 'female' | 'male' | 'unknown'; 
  birth_date: string | null; // Exigido pelo DashboardPage
}

// Unindo os tipos de estado que o useSession tenta injetar
type AppStatus = 'auth' | 'onboarding' | 'ready' | 'loading' | 'unauthenticated' | 'onboarding_family' | 'onboarding_child' | 'dashboard';

interface NinhoState {
  profile: Profile | null;
  currentFamily: Family | null;
  currentChild: Child | null;
  children: Child[];
  appState: AppStatus;
  
  // Actions que o useSession e Dashboard exigem
  setProfile: (profile: Profile | null) => void;
  setUser: (user: any) => void; // Alias para compatibilidade
  setCurrentFamily: (family: Family | null) => void;
  setCurrentChild: (child: Child | null) => void;
  setChildren: (children: Child[]) => void;
  setAppState: (state: AppStatus) => void;
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
      
      setProfile: (profile) => set({ profile }),
      setUser: (user) => set({ profile: user }),
      setCurrentFamily: (family) => set({ currentFamily: family }),
      setCurrentChild: (child) => set({ currentChild: child }),
      setChildren: (children) => set({ children }),
      setAppState: (state) => set({ appState: state }),
      
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
