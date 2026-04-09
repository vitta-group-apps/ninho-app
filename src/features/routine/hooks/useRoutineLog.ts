/**
 * NINHO — useRoutineLog (Fase 1)
 *
 * Hook de ESCRITA para a tabela `routine_logs`.
 * Expõe `logRoutine` (insert) e `updateRoutineLog` (update).
 *
 * Camadas de segurança:
 *   1. Guard local: childId não pode ser vazio string — erro imediato
 *   2. RPC `can_log_for_child`: checa permissão antes de bater no banco
 *      Se false (viewer sem permissão) → erro claro, sem INSERT tentado
 *   3. RLS do Supabase: última linha de defesa — rejeitaria mesmo sem o guard
 *
 * Por que usar `can_log_for_child` antes do INSERT?
 *   Reduz round-trips: sem o guard, uma tentativa proibida geraria um INSERT
 *   que o Postgres rejeita via RLS, e o cliente receberia um erro genérico de
 *   permissão. Com o guard, o hook detecta o problema cedo e retorna uma
 *   mensagem de erro legível para o usuário antes de qualquer mutação.
 *
 * Contrato de tipos:
 *   RoutineLogInput é uma discriminated union — o TypeScript impede em
 *   compile-time que um log do tipo 'sleep' carregue campos de 'feed'.
 *   Ver src/features/routine/types/routine.ts para a definição completa.
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  RoutineLogInput,
  RoutineLogUpdate,
  RoutineLogWithPayload,
} from '../types/routine';
import { parseRoutinePayload } from '../types/routine';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DO HOOK
// ─────────────────────────────────────────────────────────────────────────────

export interface UseRoutineLogReturn {
  /** true durante qualquer operação assíncrona */
  isLoading: boolean;
  /** Erro da última operação, ou null */
  error: Error | null;
  /**
   * Insere um novo log de rotina.
   * Retorna o log criado (com payload tipado) ou lança Error.
   *
   * @throws {Error} se childId inválido, sem permissão, ou falha do Supabase
   */
  logRoutine: (input: RoutineLogInput) => Promise<RoutineLogWithPayload>;
  /**
   * Atualiza um log existente pelo ID.
   * Apenas campos do RoutineLogUpdate podem ser alterados —
   * `type` e `child_id` são imutáveis após criação.
   *
   * @throws {Error} se id inválido ou sem permissão de escrita
   */
  updateRoutineLog: (
    id: string,
    update: RoutineLogUpdate
  ) => Promise<RoutineLogWithPayload>;
  /** Limpa o erro manualmente (ex: ao fechar um Alert) */
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — verifica permissão de escrita via RPC
// ─────────────────────────────────────────────────────────────────────────────

async function assertCanLog(childId: string): Promise<void> {
  if (!childId.trim()) {
    throw new Error('[useRoutineLog] childId é obrigatório para registrar uma rotina.');
  }

  const { data: canLog, error: rpcError } = await supabase.rpc('can_log_for_child', {
    _child_id: childId,
  });

  if (rpcError) {
    throw new Error(`[useRoutineLog] Falha ao verificar permissão: ${rpcError.message}`);
  }

  if (!canLog) {
    throw new Error(
      '[useRoutineLog] Permissão negada — seu perfil não permite registrar rotinas para esta criança.'
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — deserializa o Row do banco para RoutineLogWithPayload
// Lança se o JSONB estiver malformado (indica inconsistência no banco)
// ─────────────────────────────────────────────────────────────────────────────

function deserializeRow(row: Record<string, unknown>): RoutineLogWithPayload {
  const typed = parseRoutinePayload(row['payload']);

  if (!typed) {
    throw new Error(
      `[useRoutineLog] Payload JSONB malformado para log ${row['id']}. ` +
      `Valor recebido: ${JSON.stringify(row['payload'])}`
    );
  }

  return {
    id:         row['id']         as string,
    child_id:   row['child_id']   as string,
    author_id:  row['author_id']  as string,
    type:       row['type']       as RoutineLogWithPayload['type'],
    start_time: row['start_time'] as string,
    end_time:   (row['end_time']  as string | null) ?? null,
    notes:      (row['notes']     as string | null) ?? null,
    created_at: row['created_at'] as string,
    payload:    typed,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useRoutineLog(): UseRoutineLogReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<Error | null>(null);

  // ── INSERT ──────────────────────────────────────────────────────────────────
  const logRoutine = useCallback(async (
    input: RoutineLogInput
  ): Promise<RoutineLogWithPayload> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Guard local + RPC de permissão
      await assertCanLog(input.childId);

      // 2. Montar o row para inserção
      //    start_time usa ISO-8601. Se não fornecido, o banco usa now().
      const insertRow = {
        child_id:   input.childId,
        type:       input.type,
        payload:    input.payload,     // JSONB tipado
        start_time: input.startTime ?? new Date().toISOString(),
        end_time:   input.endTime   ?? null,
        notes:      input.notes     ?? null,
        // author_id: preenchido automaticamente pelo banco via auth.uid()
        // (a policy INSERT verifica auth.uid() = author_id)
      };

      const { data, error: insertError } = await supabase
        .from('routine_logs')
        .insert(insertRow)
        .select()
        .single();

      if (insertError) throw new Error(`[useRoutineLog] Insert falhou: ${insertError.message}`);
      if (!data)       throw new Error('[useRoutineLog] Insert retornou sem dados.');

      return deserializeRow(data as Record<string, unknown>);
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      setError(wrapped);
      throw wrapped;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── UPDATE ──────────────────────────────────────────────────────────────────
  const updateRoutineLog = useCallback(async (
    id: string,
    update: RoutineLogUpdate
  ): Promise<RoutineLogWithPayload> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!id.trim()) {
        throw new Error('[useRoutineLog] id é obrigatório para atualizar um log.');
      }

      // Montar apenas os campos que foram fornecidos
      // Campos undefined são omitidos pelo Supabase client (não sobrescrevem)
      const updateRow: Record<string, unknown> = {};

      if (update.startTime !== undefined) updateRow['start_time'] = update.startTime;
      if (update.endTime   !== undefined) updateRow['end_time']   = update.endTime;
      if (update.notes     !== undefined) updateRow['notes']      = update.notes;

      // Merge parcial do payload — preserva campos existentes no JSONB
      // Nota: o Supabase não tem merge nativo de JSONB via JS client.
      // Para merge verdadeiro, usaríamos uma Edge Function ou RPC com jsonb_merge.
      // Aqui fazemos fetch + merge local + write — seguro para payloads pequenos.
      if (update.payload !== undefined) {
        const { data: existing } = await supabase
          .from('routine_logs')
          .select('payload')
          .eq('id', id)
          .single();

        const merged = existing?.payload
          ? { ...existing.payload as object, ...update.payload }
          : update.payload;

        updateRow['payload'] = merged;
      }

      const { data, error: updateError } = await supabase
        .from('routine_logs')
        .update(updateRow)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw new Error(`[useRoutineLog] Update falhou: ${updateError.message}`);
      if (!data)       throw new Error('[useRoutineLog] Update retornou sem dados.');

      return deserializeRow(data as Record<string, unknown>);
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error(String(err));
      setError(wrapped);
      throw wrapped;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { isLoading, error, logRoutine, updateRoutineLog, clearError };
}
