import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      className="min-h-screen w-full max-w-md mx-auto relative"
      style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
    >
      {/* Main content with bottom padding for nav bar */}
      <main className="pb-24 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
