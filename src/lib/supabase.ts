import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Accept both naming conventions: VITE_SUPABASE_ANON_KEY (standard) and
// VITE_SUPABASE_PUBLISHABLE_KEY (used by the Supabase MCP project scaffolding)
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Use console.error instead of throw so the app doesn't white-screen in environments
  // where env vars haven't been configured yet (CI, preview builds, etc.)
  console.error(
    '[Ninho] Supabase env vars missing. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) ' +
    'in your .env or Vercel project settings.'
  )
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export const db = <T extends keyof Database['public']['Tables']>(table: T) =>
  supabase.from(table)

const SUPABASE_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials':        'E-mail ou senha incorretos. Tenta de novo?',
  'Email not confirmed':               'Confirma o teu e-mail para continuar.',
  'User already registered':           'Esse e-mail já tem uma conta. Entra diretamente?',
  'JWT expired':                       'A sua sessão expirou. Entra novamente.',
  'new row violates row-level security policy': 'Sem permissão para esta ação.',
  'duplicate key value violates unique constraint': 'Esse registro já existe.',
  'Failed to fetch':                   'Sem conexão com a internet. Verifica a rede.',
}

export function translateSupabaseError(error: { message?: string } | null): string {
  if (!error?.message) return 'Algo correu mal. Tenta novamente.'
  for (const [key, friendly] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (error.message.includes(key)) return friendly
  }
  return 'Algo correu mal. Tenta novamente.'
}

export type SupabaseResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }
