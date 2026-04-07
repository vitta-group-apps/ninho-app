/**
 * Wrapper de OAuth que antes usava @lovable.dev/cloud-auth-js.
 * Substituído por OAuth direto no Supabase para deploy independente (Vercel).
 * A interface pública (lovable.auth.signInWithOAuth) é preservada.
 */
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      try {
        const redirectTo = opts?.redirect_uri ?? `${window.location.origin}/auth/callback`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            queryParams: opts?.extraParams,
          },
        });

        if (error) return { error };

        // signInWithOAuth redireciona o browser — retorna redirected: true
        return { redirected: true };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};
