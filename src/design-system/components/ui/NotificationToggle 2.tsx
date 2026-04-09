/**
 * NINHO DESIGN SYSTEM — NotificationToggle (Molecule)
 * Nitro™ Core v3.0 — Arquitetura Atômica
 *
 * MISSÃO: Gere permissão de Web Push do utilizador.
 * Construído sobre os átomos: Switch · Text · Card.
 *
 * ESTADOS:
 *   default    — permissão não solicitada ainda
 *   granted    — push ativo (switch ON, verde)
 *   denied     — bloqueado pelo browser (switch desativado, explicação)
 *   requesting — a aguardar resposta do utilizador
 *
 * QUANDO USAR:
 *   - ProfilePage › seção Notificações
 *   - Onboarding step de configuração de alertas
 *
 * EXEMPLO DE USO:
 * ```tsx
 * <NotificationToggle
 *   label="Lembretes de medicação"
 *   description="Recebe alertas na hora certa para não perder nenhuma dose."
 *   onPermissionChange={(granted) => console.log(granted)}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { Switch } from './Switch';
import { Text }   from './Text';
import { cn }     from '../../lib/utils';

// ─── types ────────────────────────────────────────────────────────────────────

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'requesting' | 'unsupported';

export interface NotificationToggleProps {
  /** Título da notificação configurável */
  label:              string;
  /** Descrição opcional do que será notificado */
  description?:       string;
  /** Callback disparado após resolução da permissão */
  onPermissionChange?: (granted: boolean) => void;
  className?:         string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function getPermissionState(): PushPermissionState {
  if (!('Notification' in window)) return 'unsupported';
  const p = Notification.permission;
  if (p === 'granted') return 'granted';
  if (p === 'denied')  return 'denied';
  return 'default';
}

const DENIED_MSG  = 'Push bloqueado nas definições do browser. Activa manualmente.';
const UNSUP_MSG   = 'O teu browser não suporta notificações push.';

// ─── component ────────────────────────────────────────────────────────────────

export function NotificationToggle({
  label, description, onPermissionChange, className,
}: NotificationToggleProps) {
  const [state, setState] = useState<PushPermissionState>('default');

  useEffect(() => {
    setState(getPermissionState());
  }, []);

  async function handleToggle(checked: boolean) {
    if (!checked) {
      // Não é possível revogar push programaticamente — instruir utilizador
      return;
    }
    if (state === 'denied' || state === 'unsupported') return;

    setState('requesting');

    try {
      const result = await Notification.requestPermission();
      const next: PushPermissionState = result === 'granted' ? 'granted'
                                      : result === 'denied'  ? 'denied'
                                      : 'default';
      setState(next);
      onPermissionChange?.(next === 'granted');
    } catch {
      setState('default');
    }
  }

  const isGranted    = state === 'granted';
  const isBlocked    = state === 'denied' || state === 'unsupported';
  const isRequesting = state === 'requesting';

  const statusNote = state === 'denied'      ? DENIED_MSG
                   : state === 'unsupported' ? UNSUP_MSG
                   : isGranted               ? 'Notificações ativas.'
                   : undefined;

  return (
    <div className={cn('flex flex-col gap-[var(--gap-xs)]', className)}>
      <Switch
        checked={isGranted}
        onCheckedChange={handleToggle}
        label={label}
        description={description}
        disabled={isBlocked || isRequesting}
        size="md"
      />
      {statusNote && (
        <Text
          variant="caption-regular"
          color={isBlocked ? 'error' : 'success'}
          as="p"
          className="pl-1"
        >
          {statusNote}
        </Text>
      )}
    </div>
  );
}
