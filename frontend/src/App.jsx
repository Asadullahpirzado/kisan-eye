import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Analyze from "./pages/Analyze.jsx";
import Investigation from "./pages/Investigation.jsx";
import Results from "./pages/Results.jsx";
import History from "./pages/History.jsx";
import Monitoring from "./pages/Monitoring.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function AppInner() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState("home");
  const [analysisData, setAnalysisData] = useState(null);
  const [caseData, setCaseData] = useState(null);

  // Show login if not authenticated
  if (!isAuthenticated) return <Login />;

  function navigate(next) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleAnalyzed(data) {
    setAnalysisData(data);
    navigate("investigate");
  }

  function handleAssessmentComplete(result) {
    setCaseData(result);
    navigate("results");
  }

  function handleSelectHistoryCase(item) {
    setCaseData(item);
    navigate("results");
  }

  function handleMonitorCase(item) {
    setCaseData(item);
    navigate("monitor");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar view={view} onNavigate={navigate} />

      <main className="flex-1 pb-20 md:pb-0">
        {view === "home" && <Home onNavigate={navigate} />}
        {view === "analyze" && <Analyze onAnalyzed={handleAnalyzed} />}
        {view === "investigate" && analysisData && (
          <Investigation
            analysisData={analysisData}
            onComplete={handleAssessmentComplete}
            onBack={() => navigate("analyze")}
          />
        )}
        {view === "results" && caseData && <Results caseData={caseData} onNavigate={navigate} />}
        {view === "history" && <History onSelectCase={handleSelectHistoryCase} />}
        {view === "monitor" && <Monitoring selectedCase={caseData} onSelectCase={handleMonitorCase} />}
        {view === "dashboard" && <Dashboard onNavigate={navigate} />}
      </main>

      <BottomNav view={view} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
