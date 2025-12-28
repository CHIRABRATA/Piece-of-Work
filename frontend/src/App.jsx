import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/mainContext";
import Layout from "./components/Layout"; 
import Discovery from "./pages/Discovery"; 
import Login from "./pages/Login"; 

// 1. The Bouncer (Security Check)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      /* Replaced inline styles with Tailwind for a modern dark-mode loader */
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-blue-400 font-sans tracking-[0.2em]">
        <div className="animate-pulse mb-4 text-xl font-black">LOADING CAMPUS...</div>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-progress origin-left"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* PUBLIC: Login */}
        <Route path="/login" element={<LoginWrapper />} />

        {/* PROTECTED: The Dashboard */}
        <Route 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* These render INSIDE the Layout's <Outlet/> */}
          <Route path="/" element={<Discovery />} />
          <Route path="/chat" element={<Placeholder title="Group Chats" subtitle="Temporary 1-hour rooms" />} />
          <Route path="/find" element={<Placeholder title="Find Friends" subtitle="Swipe to connect" />} />
          <Route path="/settings" element={<Placeholder title="Profile Settings" subtitle="Manage your campus ID" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

// Helper: Redirects logged-in users away from Login page
const LoginWrapper = () => {
  const { user, loading } = useAuth();
  if (loading) return null; 
  if (user) return <Navigate to="/" />;
  return <Login />;
};

// Helper: Modern Styled Placeholder for empty pages
const Placeholder = ({ title, subtitle }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
    <h1 className="text-5xl font-black text-blue-400 mb-2">{title}</h1>
    <p className="text-slate-400 text-lg font-medium italic">{subtitle || "Coming Soon"}</p>
    <div className="mt-8 px-6 py-2 border border-white/10 bg-white/5 rounded-full text-xs uppercase tracking-widest text-slate-500">
      Feature Under Development
    </div>
  </div>
);

export default App;