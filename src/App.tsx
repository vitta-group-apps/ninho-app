import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useSession } from '@/hooks/useSession'
import { AuthPage } from '@/pages/AuthPage'
import { OnboardingFamilyPage } from '@/pages/onboarding/OnboardingFamilyPage'
import { OnboardingChildPage } from '@/pages/onboarding/OnboardingChildPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { SplashScreen } from '@/components/SplashScreen'

function AppRoutes() {
  const { appState } = useSession()

  if (appState === 'loading') return <SplashScreen />

  return (
    <Routes>
      {appState === 'unauthenticated' && (
        <>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </>
      )}
      {appState === 'onboarding_family' && (
        <>
          <Route path="/onboarding/family" element={<OnboardingFamilyPage />} />
          <Route path="*" element={<Navigate to="/onboarding/family" replace />} />
        </>
      )}
      {appState === 'onboarding_child' && (
        <>
          <Route path="/onboarding/child" element={<OnboardingChildPage />} />
          <Route path="*" element={<Navigate to="/onboarding/child" replace />} />
        </>
      )}
      {appState === 'dashboard' && (
        <>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#fff',
            border: '1px solid #E8E8E2',
            color: '#3d4039',
            fontFamily: '"DM Sans", sans-serif',
          },
        }}
      />
    </BrowserRouter>
  )
}
