import { useState, useCallback, useEffect } from 'react';
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
import DesenvolvimentoPage from '@/pages/DesenvolvimentoPage';
import FamiliaPage from '@/pages/FamiliaPage';
import DiaperScreen from '@/pages/DiaperScreen';
import SleepScreen from '@/pages/SleepScreen';
import SleepDetailScreen from '@/pages/SleepDetailScreen';
import FeedDetailScreen from '@/pages/FeedDetailScreen';
import BreastfeedingScreen from '@/pages/BreastfeedingScreen';
import BottleScreen from '@/pages/BottleScreen';
import BottleDetailScreen from '@/pages/BottleDetailScreen';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';

// Pages — onboarding
import WelcomePage from '@/pages/onboarding/WelcomePage';
import AuthPage from '@/pages/onboarding/AuthPage';
import FamilyPage from '@/pages/onboarding/FamilyPage';
import ChildPage from '@/pages/onboarding/ChildPage';
import CompletePage from '@/pages/onboarding/CompletePage';

const queryClient = new QueryClient();

/** Authenticated main app with bottom nav */
function AuthedRoutes() {
  return (
    <ActiveChildProvider>
      <Routes>
        {/* Full-screen flows — no AppShell (no bottom nav) */}
        <Route path="/diaper/new"              element={<DiaperScreen />} />
        <Route path="/diaper/detail/:logId"    element={<DiaperDetailScreen />} />
        <Route path="/diaper/edit/:logId"      element={<DiaperScreen />} />
        <Route path="/sleep/detail/:logId"     element={<SleepDetailScreen />} />
        <Route path="/feed/detail/:logId"      element={<FeedDetailScreen />} />
        <Route path="/bottle/detail/:logId"    element={<BottleDetailScreen />} />
        <Route path="/bottle/edit/:logId"      element={<BottleScreen />} />
        <Route path="/sleep"              element={<SleepScreen />} />
        <Route path="/breastfeeding"      element={<BreastfeedingScreen />} />
        <Route path="/bottle"             element={<BottleScreen />} />

        {/* Main app shell */}
        <Route path="/*" element={
          <AppShell>
            <Routes>
              <Route path="/"            element={<Navigate to="/home" replace />} />
              <Route path="/home"        element={<HomePage />} />
              {/* /routine is canonical; /rotina is kept as alias to prevent 404s */}
              <Route path="/routine"     element={<RotinaPage />} />
              <Route path="/rotina"      element={<Navigate to="/routine" replace />} />
              <Route path="/health"      element={<SaudePage />} />
              <Route path="/saude"       element={<Navigate to="/health" replace />} />
              <Route path="/development" element={<DesenvolvimentoPage />} />
              <Route path="/crescer"     element={<Navigate to="/development" replace />} />
              <Route path="/family"      element={<FamiliaPage />} />
              <Route path="/familia"     element={<Navigate to="/family" replace />} />
              <Route path="*"            element={<NotFound />} />
            </Routes>
          </AppShell>
        } />
      </Routes>
    </ActiveChildProvider>
  );
}

/**
 * Guard: routes within /onboarding/*.
 */
function OnboardingGuard() {
  const { user } = useAuth();
  const { loading, hasFamily, hasChild, familyId } = useOnboardingStatus(user?.id ?? null);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (hasFamily && hasChild) {
      navigate('/home', { replace: true });
    } else if (hasFamily && !hasChild) {
      if (familyId) sessionStorage.setItem('onboarding_family_id', familyId);
      navigate('/onboarding/child', { replace: true });
    }
  }, [loading, user, hasFamily, hasChild, familyId, navigate]);

  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(var(--ninho-sage))' }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route index element={<WelcomePage />} />
      <Route path="auth" element={<AuthPage />} />
      <Route path="family" element={user ? <FamilyPage /> : <Navigate to="/onboarding/auth" replace />} />
      <Route path="child"  element={user ? <ChildPage />  : <Navigate to="/onboarding/auth" replace />} />
      <Route path="complete" element={user ? <CompletePage /> : <Navigate to="/onboarding/auth" replace />} />
    </Routes>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(var(--ninho-sage))' }} />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding/*" element={<OnboardingGuard />} />
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/onboarding" replace />} />
      <Route path="/*" element={user ? <AuthedRoutes /> : <Navigate to="/onboarding" replace />} />
    </Routes>
  );
}

function NinhoApp() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <>
      <AnimatePresence>
        {!splashDone && <SplashScreen key="splash" onFinish={handleSplashFinish} />}
      </AnimatePresence>
      <AppRouter />
    </>
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
