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
  );
}

/**
 * Guard: if user already completed onboarding (has family + child),
 * redirect straight to /home. Otherwise render the onboarding routes.
 */
function OnboardingGuard() {
  const { user } = useAuth();
  const { loading, hasFamily, hasChild } = useOnboardingStatus(user?.id ?? null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && hasFamily && hasChild) {
      navigate('/home', { replace: true });
    }
  }, [loading, hasFamily, hasChild, navigate]);

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
      <Route path="/onboarding" element={<WelcomePage />} />
      <Route path="/onboarding/auth" element={<AuthPage />} />
      <Route
        path="/onboarding/family"
        element={user ? <FamilyPage /> : <Navigate to="/onboarding/auth" replace />}
      />
      <Route
        path="/onboarding/child"
        element={user ? <ChildPage /> : <Navigate to="/onboarding/auth" replace />}
      />
      <Route
        path="/onboarding/complete"
        element={user ? <CompletePage /> : <Navigate to="/onboarding/auth" replace />}
      />
    </Routes>
  );
}

function NinhoApp() {
  const [splashDone, setSplashDone] = useState(false);
  const { user, loading } = useAuth();

  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <AnimatePresence mode="wait">
      {!splashDone ? (
        <SplashScreen key="splash" onFinish={handleSplashFinish} />
      ) : loading ? (
        <div
          key="loading"
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'hsl(var(--ninho-sage))' }}
          />
        </div>
      ) : (
        <BrowserRouter key="app">
          <Routes>
            {/* Public */}
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
        </BrowserRouter>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NinhoApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
