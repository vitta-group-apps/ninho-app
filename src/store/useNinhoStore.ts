/**
 * useNinhoStore — Global UI state for Ninho
 *
 * Complementa o ActiveChildContext (dados do Supabase) com estado de UI
 * que não precisa ser persistido no servidor: modais, toasts, navegação.
 *
 * Regra: este store guarda APENAS estado de UI efêmero.
 * Dados de domínio (criança, família, logs) ficam nos hooks/contexts.
 */
import { create } from 'zustand';

// ─── Tipos de domínio ────────────────────────────────────────────────────────

export type LogCategory =
  | 'feed'
  | 'sleep'
  | 'diaper'
  | 'health'
  | 'development'
  | 'note';

export type BottomSheetId =
  | 'newLog'
  | 'childPicker'
  | 'paywall'
  | null;

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface NinhoToast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

// ─── Estado ──────────────────────────────────────────────────────────────────

interface NinhoState {
  // Bottom sheets
  activeSheet: BottomSheetId;
  openSheet: (sheet: NonNullable<BottomSheetId>) => void;
  closeSheet: () => void;

  // Categoria selecionada para novo log
  pendingLogCategory: LogCategory | null;
  setPendingLogCategory: (category: LogCategory | null) => void;

  // Toast queue
  toasts: NinhoToast[];
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Loading global (ex: durante onboarding)
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Flag de primeiro acesso (pós-onboarding, para animações de boas-vindas)
  isFirstSession: boolean;
  setFirstSession: (value: boolean) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useNinhoStore = create<NinhoState>((set) => ({
  // Bottom sheets
  activeSheet: null,
  openSheet: (sheet) => set({ activeSheet: sheet }),
  closeSheet: () => set({ activeSheet: null }),

  // Log category
  pendingLogCategory: null,
  setPendingLogCategory: (category) => set({ pendingLogCategory: category }),

  // Toasts
  toasts: [],
  showToast: (message, variant = 'info', duration = 3000) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: `toast-${Date.now()}`, message, variant, duration },
      ],
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Global loading
  isGlobalLoading: false,
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

  // First session
  isFirstSession: false,
  setFirstSession: (value) => set({ isFirstSession: value }),
}));

// ─── Selectors (evitam re-renders desnecessários) ────────────────────────────

export const selectActiveSheet = (s: NinhoState) => s.activeSheet;
export const selectToasts = (s: NinhoState) => s.toasts;
export const selectIsGlobalLoading = (s: NinhoState) => s.isGlobalLoading;
export const selectPendingLogCategory = (s: NinhoState) => s.pendingLogCategory;
