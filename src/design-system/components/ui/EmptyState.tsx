/**
 * NINHO DESIGN SYSTEM — EmptyState (Molecule)
 * Nitro™ Core v3.0
 *
 * MISSÃO: Ecrã vazio com estética Apple — ícone discreto, tipografia Nunito,
 * CTA claro via LinkButton. Usado em Rotina, Saúde e qualquer lista sem dados.
 *
 * Construído sobre: Text · LinkButton · Button (átomos DS)
 *
 * QUANDO USAR:
 *   - Lista/timeline sem registos
 *   - Secção sem dados ainda populados
 *   - Estado após filtro sem resultados
 *
 * QUANDO NÃO USAR:
 *   - Durante carregamento → usa Skeleton
 *   - Erros de rede → usa ErrorBoundary ou Alert
 *
 * EXEMPLO:
 * ```tsx
 * <EmptyState
 *   icon="📋"
 *   title="Sem registos hoje"
 *   description="Começa por registar o sono, a fralda ou a alimentação."
 *   cta={{ label: "Registar agora", onClick: () => scrollToForm() }}
 * />
 * ```
 *
 * ACESSIBILIDADE:
 *   - role="region" + aria-label para leitores de ecrã
 *   - ícone decorativo via aria-hidden
 */

import React from 'react';
import { Text }       from './Text';
import { LinkButton } from './LinkButton';

// ─── tipos ────────────────────────────────────────────────────────────────────

export interface EmptyStateCta {
  label:    string;
  onClick?: () => void;
  href?:    string;
}

export interface EmptyStateProps {
  /** Emoji ou string usada como ícone decorativo */
  icon?:        string;
  /** Título principal */
  title:        string;
  /** Descrição complementar */
  description?: string;
  /** Call-to-action — opcional */
  cta?:         EmptyStateCta;
  /** Compacto — menos padding vertical (para uso em card) */
  compact?:     boolean;
  /** aria-label do region — default: título */
  ariaLabel?:   string;
}

// ─── component ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon        = '🪺',
  title,
  description,
  cta,
  compact     = false,
  ariaLabel,
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={ariaLabel ?? title}
      className={[
        'flex flex-col items-center justify-center text-center',
        'gap-[var(--gap-sm)] px-[var(--padding-lg)]',
        compact ? 'py-8' : 'py-14',
      ].join(' ')}
    >
      {/* icon */}
      <span
        className="text-5xl leading-none select-none mb-[var(--gap-xs)]"
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* title */}
      <Text variant="h3" className="font-heading">
        {title}
      </Text>

      {/* description */}
      {description && (
        <Text
          variant="body-md-regular"
          color="secondary"
          className="max-w-xs"
        >
          {description}
        </Text>
      )}

      {/* CTA */}
      {cta && (
        <div className="mt-[var(--gap-xs)]">
          <LinkButton
            label={cta.label}
            linkType="interactive"
            onClick={cta.onClick}
          />
        </div>
      )}
    </div>
  );
}
