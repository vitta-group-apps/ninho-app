import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/onboarding/AuthPage";
import FamilyPage from "./pages/onboarding/FamilyPage";
import ChildPage from "./pages/onboarding/ChildPage";
import { DashboardPage } from "./pages/DashboardPage";
import { useNinhoStore } from "./store/useNinhoStore";

function App() {
  const { profile, appState } = useNinhoStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/onboarding/family" element={<FamilyPage />} />
        <Route path="/onboarding/child" element={<ChildPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/" element={profile ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
