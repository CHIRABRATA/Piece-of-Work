import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/mainContext";
import Layout from "./components/Layout";
import Discovery from "./pages/Discovery";
import ClubHub from "./pages/ClubHub";
import ClubLeadDashboard from "./pages/ClubLeadDashboard";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Find from "./pages/Find";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Requests from "./pages/Requests";
import Feedback from "./pages/Feedback";
import LoadingScreen from "./components/Loading";
import { useState, useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth(); 
  const [minLoadFinished, setMinLoadFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadFinished(true);
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  const showLoading = authLoading || !minLoadFinished;

  if (showLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />; // Use 'replace' to prevent back-button loops
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* PUBLIC: Login */}
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/feedback" element={<Feedback />} />
        {/* PROTECTED: The Dashboard */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Discovery />} />
          <Route path="/club-hub" element={<ClubHub />} />
          <Route path="/club-leader" element={<ClubLeadDashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/find" element={<Find />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/settings" element={<Placeholder title="Profile Settings" subtitle="Manage your campus ID" />} />
          <Route path="/feedback" element={<Feedback />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

const LoginWrapper = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
};

const Placeholder = ({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
    <h1 className="text-5xl font-black text-blue-400 mb-2">{title}</h1>
    <p className="text-slate-400 text-lg font-medium italic">{subtitle || "Coming Soon"}</p>
  </div>
);

export default App;