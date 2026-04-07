import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
