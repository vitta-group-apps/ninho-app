import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SplashScreen } from '@/components/auth/SplashScreen';
import { LoginPage } from '@/components/auth/LoginPage';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import Home from '@/pages/Home';
import Rotina from '@/pages/Rotina';
import Saude from '@/pages/Saude';
import Perfil from '@/pages/Perfil';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function NinhoApp() {
  const [splashDone, setSplashDone] = useState(false);
  const { user, loading } = useAuth();

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  // Show spinner while Supabase resolves session
  if (loading && splashDone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--ninho-sand))' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'hsl(var(--ninho-sage))' }} />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!splashDone ? (
        <SplashScreen key="splash" onFinish={handleSplashFinish} />
      ) : (
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected */}
            {user ? (
              <Route element={<AppShell><div /></AppShell>}>
                <Route
                  path="/"
                  element={
                    <AppShell>
                      <Home />
                    </AppShell>
                  }
                />
                <Route
                  path="/rotina"
                  element={
                    <AppShell>
                      <Rotina />
                    </AppShell>
                  }
                />
                <Route
                  path="/saude"
                  element={
                    <AppShell>
                      <Saude />
                    </AppShell>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <AppShell>
                      <Perfil />
                    </AppShell>
                  }
                />
              </Route>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}

            <Route path="*" element={<NotFound />} />
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
