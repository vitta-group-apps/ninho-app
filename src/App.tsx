import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useSession }         from "./hooks/useSession";
import AuthPage               from "./pages/onboarding/AuthPage";
import FamilyPage             from "./pages/onboarding/FamilyPage";
import ChildPage              from "./pages/onboarding/ChildPage";
import { DashboardPage }      from "./pages/DashboardPage";
import { RoutineDashboard }   from "./pages/routine/RoutineDashboard";
import { SpinnerRound }       from "./design-system/components/ui/Spinner";

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
    case 'auth':             return <Navigate to="/auth"               replace />;
    case 'onboarding_family': return <Navigate to="/onboarding/family"  replace />;
    case 'onboarding_child':  return <Navigate to="/onboarding/child"   replace />;
    case 'dashboard':
    case 'ready':             return <Navigate to="/dashboard"          replace />;
    default:                  return <Navigate to="/auth"               replace />;
  }
}

// ─── app ──────────────────────────────────────────────────────────────────────

function App() {
  const { appState, profile } = useSession();   // ← inicia a máquina de sessão

  if (appState === 'loading') return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/auth"               element={<AuthPage />} />
        <Route path="/onboarding/family"  element={<FamilyPage />} />
        <Route path="/onboarding/child"   element={<ChildPage />} />
        <Route path="/dashboard"          element={profile ? <DashboardPage />    : <Navigate to="/auth" replace />} />
        <Route path="/routine"            element={profile ? <RoutineDashboard /> : <Navigate to="/auth" replace />} />
        <Route path="/"                   element={<AppRoot appState={appState} />} />
        <Route path="*"                   element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
