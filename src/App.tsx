import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SplashScreen } from '@/components/auth/SplashScreen';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { ActiveChildProvider } from '@/contexts/ActiveChildContext';

// Pages — main app
import HomePage from '@/pages/HomePage';
import RotinaPage from '@/pages/RotinaPage';
import SaudePage from '@/pages/SaudePage';
import SettingsPage from '@/pages/SettingsPage';
import SettingsAccountPage from './pages/SettingsAccountPage';
import SettingsLanguagePage from './pages/SettingsLanguagePage';
import SettingsUnitsPage from './pages/SettingsUnitsPage';
import SettingsExportPage from './pages/SettingsExportPage';
import SettingsImportPage from './pages/SettingsImportPage';
import SettingsPlanPage from './pages/SettingsPlanPage';
import SettingsHelpPage from './pages/SettingsHelpPage';
import DesenvolvimentoPage from '@/pages/DesenvolvimentoPage';
import FamiliaPage from '@/pages/FamiliaPage';
import DiaperScreen from '@/pages/DiaperScreen';
import DiaperDetailScreen from '@/pages/DiaperDetailScreen';
import SleepScreen from '@/pages/SleepScreen';
import SleepDetailScreen from '@/pages/SleepDetailScreen';
import FeedDetailScreen from '@/pages/FeedDetailScreen';
import BreastfeedingScreen from '@/pages/BreastfeedingScreen';
import BottleScreen from '@/pages/BottleScreen';
import BottleDetailScreen from '@/pages/BottleDetailScreen';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';

// Pages — família e filhos (produto — separado do onboarding)
import ChildCreatePage from '@/pages/children/ChildCreatePage';
import ChildEditPage from '@/pages/children/ChildEditPage';
import FamilyEditPage from '@/pages/family/FamilyEditPage';
import InviteMemberPage from '@/pages/family/InviteMemberPage';

// Auth callback — Magic Link landing
import AuthCallback from '@/pages/AuthCallback';

// Pages — onboarding
import WelcomePage from '@/pages/onboarding/WelcomePage';
import AuthPage from '@/pages/onboarding/AuthPage';
import NomePage from '@/pages/onboarding/NomePage';
import FamilyPage from '@/pages/onboarding/FamilyPage';
import ChildPage from '@/pages/onboarding/ChildPage';
import CompletePage from '@/pages/onboarding/CompletePage';

const queryClient = new QueryClient();

// ─── Single auth context so useAuth() is only called once ───────────────────
type AuthCtx = ReturnType<typeof useAuth>;
const AuthContext = createContext<AuthCtx | null>(null);
function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}

function AuthedRoutes() {
  return (
    <ActiveChildProvider>
      <Routes>
        {/* Full-screen flows — no AppShell */}
        <Route path="/diaper/new"                    element={<DiaperScreen />} />
        <Route path="/diaper/detail/:logId"          element={<DiaperDetailScreen />} />
        <Route path="/diaper/edit/:logId"            element={<DiaperScreen />} />
        <Route path="/sleep/detail/:logId"           element={<SleepDetailScreen />} />
        <Route path="/feed/detail/:logId"            element={<FeedDetailScreen />} />
        <Route path="/bottle/detail/:logId"          element={<BottleDetailScreen />} />
        <Route path="/bottle/edit/:logId"            element={<BottleScreen />} />
        <Route path="/sleep"                         element={<SleepScreen />} />
        <Route path="/breastfeeding"                 element={<BreastfeedingScreen />} />
        <Route path="/bottle"                        element={<BottleScreen />} />

        {/* Família e filhos — rotas de produto (não onboarding) */}
        <Route path="/family/add-child"              element={<ChildCreatePage />} />
        <Route path="/family/child/:childId/edit"    element={<ChildEditPage />} />
        <Route path="/family/edit"                   element={<FamilyEditPage />} />
        <Route path="/family/invite"                 element={<InviteMemberPage />} />

        {/* Main app shell with bottom nav */}
        <Route path="/*" element={
          <AppShell>
            <Routes>
              <Route path="/"            element={<Navigate to="/home" replace />} />
              <Route path="/home"        element={<HomePage />} />
              <Route path="/routine"     element={<RotinaPage />} />
              <Route path="/rotina"      element={<Navigate to="/routine" replace />} />
              <Route path="/health"      element={<SaudePage />} />
              <Route path="/saude"       element={<Navigate to="/health" replace />} />
              <Route path="/development" element={<DesenvolvimentoPage />} />
              <Route path="/crescer"     element={<Navigate to="/development" replace />} />
              <Route path="/family"      element={<FamiliaPage />} />
              <Route path="/familia"     element={<Navigate to="/family" replace />} />
              <Route path="/settings"          element={<SettingsPage />} />
              <Route path="/settings/account"  element={<SettingsAccountPage />} />
              <Route path="/settings/language" element={<SettingsLanguagePage />} />
              <Route path="/settings/units"    element={<SettingsUnitsPage />} />
              <Route path="/settings/export"   element={<SettingsExportPage />} />
              <Route path="/settings/import"   element={<SettingsImportPage />} />
              <Route path="/settings/plan"     element={<SettingsPlanPage />} />
              <Route path="/settings/help"     element={<SettingsHelpPage />} />
              <Route path="*"            element={<NotFound />} />
            </Routes>
          </AppShell>
        } />
      </Routes>
    </ActiveChildProvider>
  );
}

function OnboardingGuard() {
  const { user, isLoggedIn, loading } = useAuthContext();
  const { loading: statusLoading, hasFamily, hasChild, familyId } = useOnboardingStatus(user?.id ?? null);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || statusLoading) return;
    if (isLoggedIn && hasFamily && hasChild) {
      navigate('/home', { replace: true });
    } else if (isLoggedIn && hasFamily && !hasChild) {
      if (familyId) sessionStorage.setItem('onboarding_family_id', familyId);
      navigate('/onboarding/child', { replace: true });
    }
  }, [loading, statusLoading, isLoggedIn, hasFamily, hasChild, familyId, navigate]);

  if ((loading || statusLoading) && user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#806e84' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.6)' }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route index           element={<WelcomePage />} />
      <Route path="auth"     element={<AuthPage />} />
      <Route path="nome"     element={user ? <NomePage />     : <Navigate to="/onboarding/auth" replace />} />
      <Route path="family"   element={user ? <FamilyPage />   : <Navigate to="/onboarding/auth" replace />} />
      <Route path="child"    element={user ? <ChildPage />    : <Navigate to="/onboarding/auth" replace />} />
      <Route path="complete" element={user ? <CompletePage /> : <Navigate to="/onboarding/auth" replace />} />
    </Routes>
  );
}

function AppRouter() {
  const { isLoggedIn, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#806e84' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.6)' }} />
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth callback must be reachable before session is established */}
      <Route path="/auth/callback"   element={<AuthCallback />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/onboarding/*"    element={<OnboardingGuard />} />
      <Route path="/"                element={isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
      <Route path="/*"               element={isLoggedIn ? <AuthedRoutes /> : <Navigate to="/onboarding" replace />} />
    </Routes>
  );
}

function NinhoApp() {
  const auth = useAuth();
  const { session, loading } = auth;
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  const splashDuration = !loading && session ? 1000 : 2400;

  return (
    <AuthContext.Provider value={auth}>
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen key="splash" onFinish={handleSplashFinish} duration={splashDuration} />
        )}
      </AnimatePresence>
      {splashDone && <AppRouter />}
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NinhoApp />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
