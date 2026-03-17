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
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/routine" element={<RotinaPage />} />
          <Route path="/health" element={<SaudePage />} />
          <Route path="/development" element={<DesenvolvimentoPage />} />
          <Route path="/family" element={<FamiliaPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </ActiveChildProvider>
  );
}

/**
 * Guard: routes within /onboarding/*.
 * - No user            → show welcome/auth freely
 * - Has family + child → skip to /home
 * - Has family, no child → skip directly to child step
 * - Has neither        → normal onboarding flow
 */
function OnboardingGuard() {
  const { user } = useAuth();
  const { loading, hasFamily, hasChild, familyId } = useOnboardingStatus(user?.id ?? null);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;

    if (hasFamily && hasChild) {
      console.log('[OnboardingGuard] User has family+child → /home');
      navigate('/home', { replace: true });
    } else if (hasFamily && !hasChild) {
      // Family exists but no child yet — jump to child step
      // Store the family id so ChildPage can find it
      if (familyId) sessionStorage.setItem('onboarding_family_id', familyId);
      console.log('[OnboardingGuard] User has family, no child → /onboarding/child');
      navigate('/onboarding/child', { replace: true });
    }
    // else: no family → let the user flow through normally
  }, [loading, user, hasFamily, hasChild, familyId, navigate]);

  if (loading && user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(var(--ninho-sage))' }}
        />
      </div>
    );
  }

  return (
    <Routes>
      {/* paths are relative to the /onboarding/* parent match */}
      <Route index element={<WelcomePage />} />
      <Route path="auth" element={<AuthPage />} />
      <Route
        path="family"
        element={user ? <FamilyPage /> : <Navigate to="/onboarding/auth" replace />}
      />
      <Route
        path="child"
        element={user ? <ChildPage /> : <Navigate to="/onboarding/auth" replace />}
      />
      <Route
        path="complete"
        element={user ? <CompletePage /> : <Navigate to="/onboarding/auth" replace />}
      />
    </Routes>
  );
}

/**
 * Root router: decides where unauthenticated vs authenticated users land.
 * BrowserRouter lives here — always mounted, independent of splash.
 */
function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'hsl(var(--ninho-sage))' }}
        />
      </div>
    );
  }

  return (
    <Routes>
      {/* Always-public */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Onboarding (public + partially guarded) */}
      <Route path="/onboarding/*" element={<OnboardingGuard />} />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        }
      />

      {/* Main app — auth required */}
      <Route
        path="/*"
        element={
          user ? (
            <AuthedRoutes />
          ) : (
            <Navigate to="/onboarding" replace />
          )
        }
      />
    </Routes>
  );
}

function NinhoApp() {
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {/* Splash overlays the app — does not block routing */}
      <AnimatePresence>
        {!splashDone && (
          <SplashScreen key="splash" onFinish={handleSplashFinish} />
        )}
      </AnimatePresence>

      {/* Router is always mounted regardless of splash state */}
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
