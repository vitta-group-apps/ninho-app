import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useSession }         from "./hooks/useSession";
import AuthPage               from "./pages/onboarding/AuthPage";
import FamilyPage             from "./pages/onboarding/FamilyPage";
import ChildPage              from "./pages/onboarding/ChildPage";
import { DashboardPage }      from "./pages/DashboardPage";
import { RoutineDashboard }   from "./pages/routine/RoutineDashboard";
import { HealthDashboard }    from "./pages/health/HealthDashboard";
import { ProfilePage }        from "./pages/profile/ProfilePage";
import { BottomNavigation }   from "./components/BottomNavigation";
import { SpinnerRound }       from "./design-system/components/ui/Spinner";

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <span className="text-4xl" aria-hidden="true">🪺</span>
      <SpinnerRound size="lg" />
    </div>
  );
}

// ─── root redirect driven by appState ────────────────────────────────────────

function AppRoot({ appState }: { appState: string }) {
  switch (appState) {
    case 'unauthenticated':
    case 'auth':              return <Navigate to="/auth"               replace />;
    case 'onboarding_family': return <Navigate to="/onboarding/family"  replace />;
    case 'onboarding_child':  return <Navigate to="/onboarding/child"   replace />;
    case 'dashboard':
    case 'ready':             return <Navigate to="/routine"            replace />;
    default:                  return <Navigate to="/auth"               replace />;
  }
}

// ─── app ──────────────────────────────────────────────────────────────────────

function App() {
  const { appState, profile } = useSession();

  if (appState === 'loading') return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <AppShell>
        <Routes>
          <Route path="/auth"               element={<AuthPage />} />
          <Route path="/onboarding/family"  element={<FamilyPage />} />
          <Route path="/onboarding/child"   element={<ChildPage />} />
          <Route path="/dashboard"          element={profile ? <DashboardPage />    : <Navigate to="/auth" replace />} />
          <Route path="/routine"            element={profile ? <RoutineDashboard /> : <Navigate to="/auth" replace />} />
          <Route path="/health"             element={profile ? <HealthDashboard />  : <Navigate to="/auth" replace />} />
          <Route path="/profile"            element={profile ? <ProfilePage />      : <Navigate to="/auth" replace />} />
          <Route path="/"                   element={<AppRoot appState={appState} />} />
          <Route path="*"                   element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;
