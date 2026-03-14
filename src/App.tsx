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

function AuthedRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rotina" element={<Rotina />} />
        <Route path="/saude" element={<Saude />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppShell>
  );
}

function NinhoApp() {
  const [splashDone, setSplashDone] = useState(false);
  const { user, loading } = useAuth();

  const handleSplashFinish = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {!splashDone ? (
        <SplashScreen key="splash" onFinish={handleSplashFinish} />
      ) : loading ? (
        // Loading state after splash — waiting for auth check
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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route
              path="/*"
              element={user ? <AuthedRoutes /> : <Navigate to="/login" replace />}
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
