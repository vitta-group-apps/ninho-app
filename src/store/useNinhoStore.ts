import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Family {
  id: string;
  name: string;
}

interface NinhoState {
  profile: Profile | null;
  currentFamily: Family | null;
  setProfile: (profile: Profile | null) => void;
  setCurrentFamily: (family: Family | null) => void;
}

export const useNinhoStore = create<NinhoState>()(
  persist(
    (set) => ({
      profile: null,
      currentFamily: null,
      setProfile: (profile) => set({ profile }),
      setCurrentFamily: (family) => set({ currentFamily: family }),
    }),
    { name: 'ninho-storage' }
  )
)
