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
import HomePage from '@/pages/HomePage';
import RotinaPage from '@/pages/RotinaPage';
import SaudePage from '@/pages/SaudePage';
import DesenvolvimentoPage from '@/pages/DesenvolvimentoPage';
import FamiliaPage from '@/pages/FamiliaPage';
import { ResetPasswordPage } from '@/pages/ResetPassword';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
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
