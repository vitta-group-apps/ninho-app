/**
 * NINHO — App.tsx
 *
 * Arquitetura de roteamento:
 *   StateRouter fica SEMPRE montado dentro do BrowserRouter.
 *   Usa useLayoutEffect (síncrono, antes do paint) para navegar.
 *   LoadingScreen renderiza dentro do BrowserRouter — sem flash.
 *
 * Hierarquia:
 *   BrowserRouter
 *     StateRouter   ← sempre montado, reage a appState com useLayoutEffect
 *     LoadingScreen ← se appState === 'loading'
 *     Toaster / OfflineAlert / AppShell / Routes ← se não loading
 */

import { useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useSession }         from "./hooks/useSession";
import { useNinhoStore }      from "./store/useNinhoStore";
import type { AppStatus }     from "./store/useNinhoStore";
import AuthPage               from "./pages/onboarding/AuthPage";
import ModePage               from "./pages/onboarding/ModePage";
import FamilyPage             from "./pages/onboarding/FamilyPage";
import ChildPage              from "./pages/onboarding/ChildPage";
import CopilotsPage           from "./pages/onboarding/CopilotsPage";
import { DashboardPage }      from "./pages/DashboardPage";
import { RoutineDashboard }   from "./pages/routine/RoutineDashboard";
import { HealthDashboard }    from "./pages/health/HealthDashboard";
import { ProfilePage }        from "./pages/profile/ProfilePage";
import { BottomNavigation }   from "./components/BottomNavigation";
import { SpinnerRound }       from "./design-system/components/ui/Spinner";
import { OfflineAlert }       from "./design-system/components/ui/OfflineAlert";

// ─── mapeamento appState → rota ──────────────────────────────────────────────

const STATE_ROUTES: Partial<Record<AppStatus, string>> = {
  unauthenticated:     '/auth',
  auth:                '/auth',
  onboarding_mode:     '/onboarding/mode',
  onboarding_family:   '/onboarding/family',
  onboarding_child:    '/onboarding/child',
  onboarding_copilots: '/onboarding/copilots',
  dashboard:           '/routine',
  ready:               '/routine',
};

const APP_PREFIXES = ['/routine', '/health', '/dashboard', '/profile'];

// ─── StateRouter ──────────────────────────────────────────────────────────────
//
// Sempre montado. useLayoutEffect: corre sync antes do paint → zero flash.
// Quando appState muda, navega para a rota certa antes que o browser renderize.

function StateRouter() {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const appState   = useNinhoStore(s => s.appState);

  useLayoutEffect(() => {
    const target = STATE_ROUTES[appState];
    if (!target) return; // 'loading' — aguarda resolução

    if (pathname === target) return; // já na rota correta

    // Não redireciona da zona do app se o estado já é dashboard
    const isAppState = appState === 'dashboard' || appState === 'ready';
    const inAppZone  = APP_PREFIXES.some(p => pathname.startsWith(p));
    if (isAppState && inAppZone) return;

    navigate(target, { replace: true });
  }, [appState, navigate, pathname]);

  return null;
}

// ─── bottom navigation ────────────────────────────────────────────────────────

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const showNav = APP_PREFIXES.some(r => pathname.startsWith(r));
  return (
    <>
      {children}
      {showNav && <BottomNavigation />}
    </>
  );
}

// ─── loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>
      <span aria-hidden="true" style={{ fontSize: '3rem', lineHeight: 1 }}>🪺</span>
      <SpinnerRound size="lg" />
    </div>
  );
}

// ─── conteúdo da app (dentro do BrowserRouter) ───────────────────────────────

function AppContent() {
  const { profile } = useSession();
  const appState    = useNinhoStore(s => s.appState);

  // StateRouter sempre montado — roda antes do conteúdo abrir
  return (
    <>
      <StateRouter />

      {appState === 'loading' ? (
        // Loading dentro do BrowserRouter: StateRouter montado, sem flash
        <LoadingScreen />
      ) : (
        <>
          <OfflineAlert />
          <Toaster position="top-center" richColors />
          <AppShell>
            <Routes>
              {/* Auth */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Onboarding — sem guard de profile: FamilyPage/ChildPage validam internamente */}
              <Route path="/onboarding/mode"      element={<ModePage />} />
              <Route path="/onboarding/family"    element={<FamilyPage />} />
              <Route path="/onboarding/child"     element={<ChildPage />} />
              <Route path="/onboarding/copilots"  element={<CopilotsPage />} />

              {/* App — guarda profile */}
              <Route path="/dashboard" element={profile ? <DashboardPage />    : null} />
              <Route path="/routine"   element={profile ? <RoutineDashboard /> : null} />
              <Route path="/health"    element={profile ? <HealthDashboard />  : null} />
              <Route path="/profile"   element={profile ? <ProfilePage />      : null} />

              {/* Fallback: StateRouter navega para cá corretamente */}
              <Route path="*" element={null} />
            </Routes>
          </AppShell>
        </>
      )}
    </>
  );
}

// ─── app ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
