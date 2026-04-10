/**
 * NINHO — App.tsx
 *
 * Arquitetura de roteamento:
 *   StateRouter fica SEMPRE montado dentro do BrowserRouter.
 *   Usa useLayoutEffect (síncrono, antes do paint) para navegar.
 *   SplashScreen renderiza dentro do BrowserRouter — sem flash.
 *
 * Hierarquia:
 *   BrowserRouter
 *     StateRouter   ← sempre montado, reage a appState com useLayoutEffect
 *     SplashScreen  ← se appState === 'loading'
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
import { SplashScreen }       from "./components/SplashScreen";
import { OfflineAlert }       from "./design-system/components/ui/OfflineAlert";
import { NinhoWordmark }      from "./components/NinhoLogo";

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

function StateRouter() {
  const navigate   = useNavigate();
  const { pathname } = useLocation();
  const appState   = useNinhoStore(s => s.appState);

  useLayoutEffect(() => {
    const target = STATE_ROUTES[appState];
    if (!target) return;
    if (pathname === target) return;
    const isAppState = appState === 'dashboard' || appState === 'ready';
    const inAppZone  = APP_PREFIXES.some(p => pathname.startsWith(p));
    if (isAppState && inAppZone) return;
    navigate(target, { replace: true });
  }, [appState, navigate, pathname]);

  return null;
}

// ─── app header (zona do app) ─────────────────────────────────────────────────

function AppHeader() {
  const currentChild = useNinhoStore(s => s.currentChild);
  const firstName    = currentChild?.preferred_name?.split(' ')[0] ?? '';

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 20,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #eeedec',
      paddingTop: 'env(safe-area-inset-top)',
    }}>
      <div style={{
        height: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingInline: 20,
      }}>
        <NinhoWordmark height={20} color="#6e2880" />
        {firstName && (
          <span style={{
            fontFamily: "'Nunito', system-ui, sans-serif",
            fontWeight: 600, fontSize: '0.85rem', color: '#a9a5a2',
          }}>
            {firstName}
          </span>
        )}
      </div>
    </header>
  );
}

// ─── app shell ────────────────────────────────────────────────────────────────

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const showNav = APP_PREFIXES.some(r => pathname.startsWith(r));

  return (
    <>
      {showNav && <AppHeader />}
      <div style={showNav ? {
        paddingTop: 'calc(env(safe-area-inset-top) + 50px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 60px)',
        minHeight: '100dvh',
      } : {}}>
        {children}
      </div>
      {showNav && <BottomNavigation />}
    </>
  );
}

// ─── conteúdo da app (dentro do BrowserRouter) ───────────────────────────────

function AppContent() {
  const { profile } = useSession();
  const appState    = useNinhoStore(s => s.appState);

  return (
    <>
      <StateRouter />

      {appState === 'loading' ? (
        <SplashScreen />
      ) : (
        <>
          <OfflineAlert />
          <Toaster position="top-center" richColors />
          <AppShell>
            <Routes>
              {/* Auth */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Onboarding */}
              <Route path="/onboarding/mode"      element={<ModePage />} />
              <Route path="/onboarding/family"    element={<FamilyPage />} />
              <Route path="/onboarding/child"     element={<ChildPage />} />
              <Route path="/onboarding/copilots"  element={<CopilotsPage />} />

              {/* App */}
              <Route path="/dashboard" element={profile ? <DashboardPage />    : null} />
              <Route path="/routine"   element={profile ? <RoutineDashboard /> : null} />
              <Route path="/health"    element={profile ? <HealthDashboard />  : null} />
              <Route path="/profile"   element={profile ? <ProfilePage />      : null} />

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
