/**
 * NINHO DESIGN SYSTEM — InvitationCard (Molecule)
 * Nitro™ Core v3.0 — Arquitetura Atômica
 *
 * MISSÃO: Representa um convite de família — pendente, aceito ou expirado.
 * Construído sobre os átomos: Card · Text · Button · Badge · Avatar.
 *
 * QUANDO USAR:
 *   - Listar convites enviados pela família (ProfilePage › seção Família)
 *   - Exibir convite recebido para o utilizador aceitar/recusar
 *
 * ACESSIBILIDADE:
 *   - role="article" com aria-label descritivo
 *   - Botões com aria-label explícito
 *   - Estado expirado: aria-disabled + visual apagado
 *
 * EXEMPLO DE USO:
 * ```tsx
 * <InvitationCard
 *   email="joao@example.com"
 *   role="caregiver"
 *   status="pending"
 *   sentAt="2026-04-08T10:00:00Z"
 *   onRevoke={() => revokeInvite(id)}
 * />
 * ```
 */

import React from 'react';
import { Card }   from './Card';
import { Text }   from './Text';
import { Button } from './Button';
import { Badge }  from './Badge';
import { Avatar } from './Avatar';
import type { BadgeVariant } from './Badge';

// ─── types ────────────────────────────────────────────────────────────────────

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type InvitationRole   = 'owner' | 'admin' | 'caregiver' | 'viewer';

export interface InvitationCardProps {
  /** E-mail do convidado */
  email:       string;
  /** Papel na família */
  role:        InvitationRole;
  /** Estado atual do convite */
  status:      InvitationStatus;
  /** ISO string de quando foi enviado */
  sentAt:      string;
  /** ISO string de expiração (opcional) */
  expiresAt?:  string;
  /** Revogar convite pendente */
  onRevoke?:   () => void;
  /** Aceitar convite recebido */
  onAccept?:   () => void;
  /** Recusar convite recebido */
  onDecline?:  () => void;
  /** Loading state dos botões */
  loading?:    boolean;
}

// ─── maps ────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<InvitationStatus, { label: string; variant: BadgeVariant }> = {
  pending:  { label: 'Pendente',  variant: 'warning'  },
  accepted: { label: 'Aceito',    variant: 'success'  },
  rejected: { label: 'Recusado',  variant: 'error'    },
  expired:  { label: 'Expirado',  variant: 'neutral'  },
};

const ROLE_LABELS: Record<InvitationRole, string> = {
  owner:     'Proprietário',
  admin:     'Administrador',
  caregiver: 'Cuidador(a)',
  viewer:    'Visualizador',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

// ─── component ────────────────────────────────────────────────────────────────

export function InvitationCard({
  email, role, status, sentAt, expiresAt,
  onRevoke, onAccept, onDecline, loading = false,
}: InvitationCardProps) {
  const { label: statusLabel, variant: statusVariant } = STATUS_BADGE[status];
  const isExpired  = status === 'expired';
  const isPending  = status === 'pending';
  const isReceived = !!(onAccept || onDecline);

  return (
    <Card
      variant="outlined"
      padding="md"
      className={isExpired ? 'opacity-60' : undefined}
    >
      <article aria-label={`Convite para ${email} — ${statusLabel}`}>
        {/* ── header row ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-[var(--gap-md)]">
          <Avatar initials={initials(email)} size="sm" />

          <div className="flex-1 min-w-0">
            <Text variant="body-md-semibold" as="p" className="truncate">{email}</Text>
            <Text variant="caption-regular" color="secondary" as="p">
              {ROLE_LABELS[role]} · Enviado em {fmtDate(sentAt)}
            </Text>
          </div>

          <Badge label={statusLabel} variant={statusVariant} size="sm" />
        </div>

        {/* ── expiry warning ──────────────────────────────────────────── */}
        {isPending && expiresAt && (
          <Text variant="caption-regular" color="warning" as="p" className="mt-[var(--gap-xs)]">
            Expira em {fmtDate(expiresAt)}
          </Text>
        )}

        {/* ── actions ─────────────────────────────────────────────────── */}
        {isPending && (
          <div className="flex gap-[var(--gap-sm)] mt-[var(--gap-md)]">
            {isReceived ? (
              <>
                <Button
                  label="Aceitar"
                  variant="primary"
                  size="sm"
                  loading={loading}
                  onClick={onAccept}
                  aria-label={`Aceitar convite de ${email}`}
                />
                <Button
                  label="Recusar"
                  variant="secondary"
                  size="sm"
                  disabled={loading}
                  onClick={onDecline}
                  aria-label={`Recusar convite de ${email}`}
                />
              </>
            ) : onRevoke ? (
              <Button
                label="Revogar"
                variant="secondary"
                size="sm"
                loading={loading}
                onClick={onRevoke}
                aria-label={`Revogar convite para ${email}`}
              />
            ) : null}
          </div>
        )}
      </article>
    </Card>
  );
}
