/**
 * NINHO — ErrorBoundary
 * Captura erros de renderização React e exibe uma tela de recuperação.
 *
 * Estética Apple: mensagem clara, ícone, botão de "Recarregar" — sem stack trace
 * exposto ao utilizador final.
 *
 * EXEMPLO:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */

import React from 'react';

interface Props   { children: React.ReactNode }
interface State   { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Em produção ligaria ao Sentry/Datadog aqui
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-screen bg-[hsl(60_11%_91%)] flex flex-col items-center justify-center px-6 text-center gap-6"
      >
        {/* icon */}
        <span className="text-6xl leading-none select-none" aria-hidden="true">⚠️</span>

        {/* copy */}
        <div className="flex flex-col gap-2">
          <h1
            style={{ fontFamily: 'Quicksand, system-ui, sans-serif', fontWeight: 700 }}
            className="text-2xl text-[hsl(30_15%_20%)]"
          >
            Ocorreu um erro inesperado
          </h1>
          <p
            style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}
            className="text-sm text-[hsl(30_8%_50%)] max-w-xs"
          >
            Algo correu mal ao carregar esta página. Os teus dados estão seguros.
          </p>
        </div>

        {/* actions */}
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <button
            onClick={this.handleReload}
            style={{ fontFamily: 'Nunito, system-ui, sans-serif', fontWeight: 600 }}
            className="w-full py-3 rounded-[6px] bg-[hsl(152_14%_65%)] text-white text-sm shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
          >
            Recarregar
          </button>
          <button
            onClick={this.handleReset}
            style={{ fontFamily: 'Nunito, system-ui, sans-serif' }}
            className="text-sm text-[hsl(30_15%_45%)] underline underline-offset-2 hover:text-[hsl(30_15%_25%)] transition-colors"
          >
            Tentar sem recarregar
          </button>
        </div>

        {/* dev-only detail */}
        {import.meta.env.DEV && this.state.message && (
          <pre className="mt-4 text-[10px] text-left text-red-500 bg-red-50 rounded p-3 max-w-sm overflow-auto max-h-32">
            {this.state.message}
          </pre>
        )}
      </div>
    );
  }
}
