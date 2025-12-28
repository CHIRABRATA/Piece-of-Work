import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/mainContext";
import Layout from "./components/Layout"; 
import Discovery from "./pages/Discovery"; 
import Login from "./pages/Login"; 

// 1. The Bouncer (Security Check)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
     return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white", background: "#0b0c15" }}>Loading Campus...</div>;
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
        {/* 1. PUBLIC ROUTE: Login */}
        <Route path="/login" element={<LoginWrapper />} />

        {/* 2. PROTECTED ROUTES (The App) */}
        {/* We wrap the Layout in ProtectedRoute so the Sidebar is also hidden from outsiders */}
        <Route 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Pages */}
          <Route path="/" element={<Discovery />} />
          <Route path="/chat" element={<div style={{color:'white', padding:'40px'}}>Chat Feed Coming Soon</div>} />
          <Route path="/find" element={<div style={{color:'white', padding:'40px'}}>Search People Coming Soon</div>} />
          <Route path="/settings" element={<div style={{color:'white', padding:'40px'}}>Settings Page</div>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

// Helper to redirect logged-in users away from Login page
const LoginWrapper = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" />;
  return <Login />;
};

export default App;