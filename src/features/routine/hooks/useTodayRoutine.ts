/**
 * NINHO — useTodayRoutine (Fase 1)
 *
 * Hook de LEITURA para a tabela `routine_logs`.
 * Busca todos os logs do dia corrente para uma criança ativa.
 *
 * Critério "hoje":
 *   Usa meia-noite local do dispositivo como limite inferior e 23:59:59 como
 *   limite superior. Converte para ISO-8601 antes de enviar ao Supabase para
 *   evitar problemas de timezone (o banco armazena em UTC).
 *
 * Filtro de segurança:
 *   Chama `can_access_child` via RPC antes de qualquer query.
 *   O RLS do Supabase faria o mesmo — o guard antecipa a resposta para a UI.
 *
 * Realtime (opcional, Fase 2):
 *   O hook expõe `refresh()` para polling manual. Subscription Supabase
 *   Realtime pode ser adicionada na Fase 2 sem alterar a interface do hook.
 *
 * Retorno:
 *   logs           — array de RoutineLogWithPayload, ordenado por start_time DESC
 *   isLoading      — true durante fetch e refresh
 *   error          — Error | null da última operação
 *   refresh()      — refetch manual (para pull-to-refresh na Fase 2)
 *   logsByType     — logs agrupados por tipo (otimização para render em seções)
 *   summary        — contagem por tipo para o resumo do dia
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RoutineLogType, RoutineLogWithPayload } from '../types/routine';
import { parseRoutinePayload } from '../types/routine';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS DO HOOK
// ─────────────────────────────────────────────────────────────────────────────

/** Contagem de logs por tipo — usado no resumo visual do dia */
export interface DaySummary {
  sleep:  number;
  feed:   number;
  diaper: number;
  note:   number;
  total:  number;
}

/** Logs agrupados por tipo para render em seções na Fase 2 */
export type LogsByType = Record<RoutineLogType, RoutineLogWithPayload[]>;

export interface UseTodayRoutineReturn {
  /** Todos os logs do dia, ordenados por start_time DESC */
  logs:       RoutineLogWithPayload[];
  /** Logs agrupados por tipo — evita filter() repetido nos componentes */
  logsByType: LogsByType;
  /** Contagens por tipo para o cabeçalho de resumo do dia */
  summary:    DaySummary;
  isLoading:  boolean;
  error:      Error | null;
  /** Refetch manual — exposto para pull-to-refresh na Fase 2 */
  refresh:    () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — intervalos de tempo e deserialização
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna [inicioHoje, fimHoje] como strings ISO-8601 no timezone local */
function getTodayBounds(): [string, string] {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return [start.toISOString(), end.toISOString()];
}

/** Tenta deserializar um row do banco — pula silenciosamente se JSONB inválido */
function tryDeserialize(row: Record<string, unknown>): RoutineLogWithPayload | null {
  const typed = parseRoutinePayload(row['payload']);
  if (!typed) return null;  // JSONB legado ou malformado — ignora

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

/** Agrupa um array de logs por tipo */
function groupByType(logs: RoutineLogWithPayload[]): LogsByType {
  const groups: LogsByType = { sleep: [], feed: [], diaper: [], note: [] };
  for (const log of logs) {
    groups[log.type].push(log);
  }
  return groups;
}

/** Calcula DaySummary a partir dos logs */
function buildSummary(logs: RoutineLogWithPayload[]): DaySummary {
  return logs.reduce<DaySummary>(
    (acc, log) => {
      acc[log.type] += 1;
      acc.total     += 1;
      return acc;
    },
    { sleep: 0, feed: 0, diaper: 0, note: 0, total: 0 }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE — retornado quando childId é nulo ou não autorizado
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_LOGS_BY_TYPE: LogsByType  = { sleep: [], feed: [], diaper: [], note: [] };
const EMPTY_SUMMARY: DaySummary       = { sleep: 0, feed: 0, diaper: 0, note: 0, total: 0 };

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useTodayRoutine(childId: string | null): UseTodayRoutineReturn {
  const [logs,      setLogs]      = useState<RoutineLogWithPayload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<Error | null>(null);

  // `refreshToken` é incrementado por refresh() para disparar o useEffect
  const [refreshToken, setRefreshToken] = useState(0);

  // Guard contra race conditions: ignora resposta se o componente desmontou
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Fetch principal ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!childId) {
      setLogs([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Verificar permissão de leitura via RPC
        const { data: canAccess, error: rpcError } = await supabase.rpc(
          'can_access_child',
          { _child_id: childId }
        );

        if (cancelled) return;

        if (rpcError) throw new Error(`[useTodayRoutine] RPC error: ${rpcError.message}`);

        if (!canAccess) {
          // Sem permissão — retorna vazio sem erro (não é uma falha, é um estado válido)
          setLogs([]);
          return;
        }

        // 2. Calcular limites do dia corrente
        const [dayStart, dayEnd] = getTodayBounds();

        // 3. Query: logs do dia para esta criança, mais recentes primeiro
        const { data: rows, error: queryError } = await supabase
          .from('routine_logs')
          .select('*')
          .eq('child_id', childId)
          .gte('start_time', dayStart)
          .lte('start_time', dayEnd)
          .order('start_time', { ascending: false });

        if (cancelled) return;
        if (queryError) throw new Error(`[useTodayRoutine] Query falhou: ${queryError.message}`);

        // 4. Deserializar e filtrar rows com payload inválido
        const typed = (rows ?? [])
          .map(r => tryDeserialize(r as Record<string, unknown>))
          .filter((r): r is RoutineLogWithPayload => r !== null);

        setLogs(typed);
      } catch (err) {
        if (cancelled) return;
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        setLogs([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [childId, refreshToken]);  // refreshToken força re-fetch quando chamado refresh()

  const refresh = useCallback(() => setRefreshToken(t => t + 1), []);

  // ── Derivados computados ───────────────────────────────────────────────────
  const logsByType = logs.length > 0 ? groupByType(logs) : EMPTY_LOGS_BY_TYPE;
  const summary    = logs.length > 0 ? buildSummary(logs) : EMPTY_SUMMARY;

  return { logs, logsByType, summary, isLoading, error, refresh };
}
