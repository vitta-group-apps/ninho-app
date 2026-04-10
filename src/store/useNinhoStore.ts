/**
 * NINHO — Zustand Store
 *
 * subscription: 'free' | 'premium'
 *   Controla o modelo freemium. Features premium verificam esse campo.
 *   Default: 'free'. Futuramente integrado com Stripe webhooks.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Profile {
  id:         string;
  full_name:  string | null;
  avatar_url: string | null;
}

export interface Family {
  id:   string;
  name: string;
}

export interface Child {
  id:             string;
  name:           string;
  preferred_name: string | null;
  sex_at_birth:   string;
  birth_date:     string | null;
  [key: string]:  any;
}

export type AppStatus =
  | 'loading' | 'auth' | 'unauthenticated' | 'onboarding'
  | 'onboarding_mode' | 'onboarding_family' | 'onboarding_child'
  | 'onboarding_copilots'
  | 'dashboard' | 'ready';

export type OnboardingMode = 'pregnancy' | 'newborn' | null;

export type SubscriptionPlan = 'free' | 'premium';

interface NinhoState {
  profile:          Profile | null;
  currentFamily:    Family | null;
  currentChild:     Child | null;
  children:         Child[];
  appState:         AppStatus;
  onboardingMode:   OnboardingMode;
  subscription:     SubscriptionPlan;   // freemium tier
  isLoadingSession: boolean;
  sessionError:     string | null;

  setProfile:          (profile: Profile | null) => void;
  setUser:             (user: any) => void;
  setCurrentFamily:    (family: Family | null) => void;
  setCurrentChild:     (child: Child | null) => void;
  setChildren:         (children: any[]) => void;
  setAppState:         (state: AppStatus) => void;
  setOnboardingMode:   (mode: OnboardingMode) => void;
  setSubscription:     (plan: SubscriptionPlan) => void;
  setIsLoadingSession: (loading: boolean) => void;
  setSessionError:     (error: string | null) => void;
  isPremium:           () => boolean;
  signOut:             () => Promise<void>;
  reset:               () => void;

  [key: string]: any;
}

export const useNinhoStore = create<NinhoState>()(
  persist(
    (set, get) => ({
      profile:          null,
      currentFamily:    null,
      currentChild:     null,
      children:         [],
      appState:         'loading',
      onboardingMode:   null,
      subscription:     'free',
      isLoadingSession: true,
      sessionError:     null,

      setProfile:          (profile)  => set({ profile }),
      setUser:             (user)     => set({ profile: user }),
      setCurrentFamily:    (family)   => set({ currentFamily: family }),
      setCurrentChild:     (child)    => set({ currentChild: child }),
      setChildren:         (children) => set({ children }),
      setAppState:         (state)    => set({ appState: state }),
      setOnboardingMode:   (mode)     => set({ onboardingMode: mode }),
      setSubscription:     (plan)     => set({ subscription: plan }),
      setIsLoadingSession: (loading)  => set({ isLoadingSession: loading }),
      setSessionError:     (sessionError) => set({ sessionError }),

      isPremium: () => get().subscription === 'premium',

      signOut: async () => {
        set({
          profile: null, currentFamily: null, currentChild: null,
          children: [], appState: 'auth', onboardingMode: null, subscription: 'free',
        });
      },
      reset: () => {
        set({
          profile: null, currentFamily: null, currentChild: null,
          children: [], appState: 'auth', onboardingMode: null, subscription: 'free',
        });
      },
    }),
    {
      name: 'ninho-storage',
      // Nunca persistir estado transitório
      partialize: (state) => ({
        profile:        state.profile,
        currentFamily:  state.currentFamily,
        currentChild:   state.currentChild,
        children:       state.children,
        onboardingMode: state.onboardingMode,
        subscription:   state.subscription,
      }),
    }
  )
)

export const getNinhoStore = () => useNinhoStore.getState();

// ─── helper: verifica se feature é premium ───────────────────────────────────
// Uso: isPremiumFeature() → mostra paywall ou lock icon

export function isPremiumFeature() {
  return getNinhoStore().subscription !== 'premium';
}
