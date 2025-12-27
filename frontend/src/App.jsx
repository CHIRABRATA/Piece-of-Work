import { AuthProvider, useAuth } from "./context/mainContext";
import Login from "./components/Login";

// A small wrapper to handle the conditional rendering inside the Provider
const AppContent = () => {
  const { user, logout } = useAuth();

  // If not logged in -> Show Login
  if (!user) {
    return <Login />;
  }

  // If logged in -> Show Dashboard (Or your main Component)
  return (
    <div style={{ textAlign: "center", padding: "50px", color: "white" }}>
      <h2>Welcome to Campus Connect</h2>
      <p>Logged in as: {user.email}</p>
      <button 
        onClick={logout}
        style={{ padding: "10px 20px", background: "red", color: "white", border: "none", cursor: "pointer" }}
      >
        Logout
      </button>
    </div>
  );
};

function App() {
  return (
    <div style={{ backgroundColor: "#121212", minHeight: "100vh" }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </div>
  );
}

export default App;