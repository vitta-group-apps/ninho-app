import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
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

// ─── rota alvo para cada appState ────────────────────────────────────────────

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

// Prefixos das rotas "dentro do app" (zona com BottomNav)
const APP_PREFIXES = ['/routine', '/health', '/dashboard', '/profile'];

// ─── StateRouter: reage a mudanças de appState em qualquer rota ──────────────
//
// Este componente resolve o bug central: AppRoot só rodava em "/" e as mudanças
// de appState feitas pelas páginas de onboarding não atualizavam a URL.
// StateRouter vive dentro do BrowserRouter e garante navegação em qualquer rota.

function StateRouter() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const appState = useNinhoStore(s => s.appState);

  useEffect(() => {
    const target = STATE_ROUTES[appState];
    if (!target) return; // 'loading' — aguarda resolução

    // Já está na rota correta
    if (pathname === target) return;

    // Evita redirecionar da zona do app quando o estado é dashboard/ready
    const isAppState  = appState === 'dashboard' || appState === 'ready';
    const inAppZone   = APP_PREFIXES.some(p => pathname.startsWith(p));
    if (isAppState && inAppZone) return;

    navigate(target, { replace: true });
  }, [appState, navigate, pathname]);

  return null;
}

// ─── rotas que mostram a BottomNavigation ─────────────────────────────────────

const NAV_ROUTES = ['/routine', '/health', '/dashboard', '/profile'];

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const showNav = NAV_ROUTES.some(r => pathname.startsWith(r));

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
    <div className="min-h-screen bg-ds-pure-white flex flex-col items-center justify-center gap-4">
      <span aria-hidden="true" style={{ fontSize: '3rem' }}>🪺</span>
      <SpinnerRound size="lg" />
    </div>
  );
}

// ─── app ──────────────────────────────────────────────────────────────────────

function App() {
  const { appState, profile } = useSession();

  if (appState === 'loading') return <LoadingScreen />;

  return (
    <BrowserRouter>
      <OfflineAlert />
      <Toaster position="top-center" richColors />

      {/* StateRouter: escuta appState e navega para a rota correta, em qualquer URL */}
      <StateRouter />

      <AppShell>
        <Routes>
          <Route path="/auth"                 element={<AuthPage />} />
          <Route path="/onboarding/mode"      element={<ModePage />} />
          <Route path="/onboarding/family"    element={<FamilyPage />} />
          <Route path="/onboarding/child"     element={<ChildPage />} />
          <Route path="/onboarding/copilots"  element={<CopilotsPage />} />
          <Route path="/dashboard"            element={profile ? <DashboardPage />    : <Navigate to="/auth" replace />} />
          <Route path="/routine"              element={profile ? <RoutineDashboard /> : <Navigate to="/auth" replace />} />
          <Route path="/health"               element={profile ? <HealthDashboard />  : <Navigate to="/auth" replace />} />
          <Route path="/profile"              element={profile ? <ProfilePage />      : <Navigate to="/auth" replace />} />
          {/* Rota raiz: fallback direto para /auth enquanto loading resolve */}
          <Route path="/"                     element={<Navigate to="/auth" replace />} />
          <Route path="*"                     element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
