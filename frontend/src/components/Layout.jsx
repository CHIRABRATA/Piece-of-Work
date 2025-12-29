import { Outlet, useLocation, Link, useNavigate } from "react-router-dom"; 
import { Search, MessageSquare, Users, Settings, LogOut, Hexagon, User } from "lucide-react"; 
import { useAuth } from "../context/mainContext"; 

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
      await logout();
      navigate("/login");
  };

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* 1. TOP NAVBAR (New!) */}
      <header style={{ 
          height: "70px", width: "100%", 
          background: "rgba(19, 20, 31, 0.9)", 
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 30px", boxSizing: "border-box", zIndex: 100
      }}>
          {/* Logo Moved Here */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Hexagon fill="#ff2a6d" stroke="none" size={32} />
            <div style={{ lineHeight: "1" }}>
                <div style={{ fontWeight: "800", fontSize: "20px", letterSpacing: "1px", color: "white" }}>CAMPUS</div>
                <div style={{ fontWeight: "400", fontSize: "20px", color: "#05d9e8", letterSpacing: "2px" }}>CONNECT</div>
            </div>
          </Link>

          {/* Right Side: Profile Icon */}
          <Link to="/profile" style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none", cursor: "pointer" }}>
             <div style={{ textAlign: "right", display: "none", md: "block" }}>
                <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>My Profile</div>
                <div style={{ color: "#00ff88", fontSize: "12px" }}>Online</div>
             </div>
             <div style={{ 
                 width: "40px", height: "40px", borderRadius: "50%", 
                 background: "#333", border: "2px solid #05d9e8",
                 display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
             }}>
                 <User size={24} color="white" />
             </div>
          </Link>
      </header>

      {/* 2. BODY (Sidebar + Content) */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          
          {/* SIDEBAR (Cleaner now) */}
          <aside style={{ width: "260px", background: "#0b0c15", borderRight: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", padding: "30px 20px" }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <NavItem to="/" icon={<Search size={20} />} label="Discover" />
              <NavItem to="/chat" icon={<MessageSquare size={20} />} label="Chat Feed" />
              <NavItem to="/find" icon={<Users size={20} />} label="Find People" />
              <NavItem to="/profile" icon={<Settings size={20} />} label="Settings" />
            </nav>

            <button 
                onClick={handleLogout} 
                style={{ 
                    marginTop: "auto", display: "flex", alignItems: "center", gap: "10px", 
                    padding: "12px", background: "rgba(255, 42, 109, 0.1)", color: "#ff2a6d", 
                    border: "1px solid #ff2a6d", borderRadius: "12px", cursor: "pointer", fontWeight: "600"
                }}
            >
              <LogOut size={18} /> Logout
            </button>
          </aside>

          {/* MAIN CONTENT */}
          <main style={{ flex: 1, position: "relative", overflow: "hidden", padding: "20px" }}>
            <Outlet /> 
          </main>

      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} style={{
      display: "flex", alignItems: "center", gap: "15px",
      padding: "12px 15px", borderRadius: "12px",
      color: isActive ? "#fff" : "#6c757d",
      background: isActive ? "linear-gradient(90deg, rgba(5, 217, 232, 0.1) 0%, transparent 100%)" : "transparent",
      borderLeft: isActive ? "3px solid #05d9e8" : "3px solid transparent",
      textDecoration: "none", transition: "all 0.2s"
    }}>
      {icon}
      <span style={{ fontWeight: isActive ? "600" : "400" }}>{label}</span>
    </Link>
  );
};

export default Layout;