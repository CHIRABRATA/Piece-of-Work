import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom"; 
import { Search, MessageSquare, Users, Settings, LogOut, Hexagon, User, Menu } from "lucide-react"; 
import { useAuth } from "../context/mainContext"; 

const Layout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // State for Sidebar & Mobile Check
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMenuHovered, setIsMenuHovered] = useState(false);

  // 1. MOBILE RESPONSIVENESS LISTENER
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile, Auto-open on desktop
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Run once on mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
      await logout();
      navigate("/login");
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      
      {/* --- TOP NAVBAR --- */}
      <header style={{ 
          height: "70px", width: "100%", 
          background: "rgba(19, 20, 31, 0.95)", // Slightly more opaque for mobile
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", boxSizing: "border-box", zIndex: 60 // Higher than sidebar
      }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* Menu Toggle */}
              <button 
                onClick={toggleSidebar}
                onMouseEnter={() => setIsMenuHovered(true)}
                onMouseLeave={() => setIsMenuHovered(false)}
                style={{ 
                    background: isMenuHovered ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "none", outline: "none", cursor: "pointer", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", padding: "8px", borderRadius: "8px", transition: "all 0.2s"
                }}
              >
                  <Menu size={24} />
              </button>

              <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                <Hexagon fill="#ff2a6d" stroke="none" size={32} />
                <div style={{ lineHeight: "1" }}>
                    <div style={{ fontWeight: "800", fontSize: "20px", letterSpacing: "1px", color: "white" }}>CAMPUS</div>
                    <div style={{ fontWeight: "400", fontSize: "20px", color: "#05d9e8", letterSpacing: "2px" }}>CONNECT</div>
                </div>
              </Link>
          </div>

          <Link to="/profile" style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none", cursor: "pointer" }}>
             {/* Hide Name on Mobile to save space */}
             {!isMobile && (
                 <div style={{ textAlign: "right" }}>
                    <div style={{ color: "white", fontWeight: "600", fontSize: "14px" }}>My Profile</div>
                    <div style={{ color: "#00ff88", fontSize: "12px" }}>Online</div>
                 </div>
             )}
             <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#333", border: "2px solid #05d9e8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                 <User size={24} color="white" />
             </div>
          </Link>
      </header>

      {/* --- BODY AREA --- */}
      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
          
          {/* SIDEBAR */}
          <aside style={{ 
              // RESPONSIVE LOGIC:
              // Mobile: Fixed Position (Floating overlay)
              // Desktop: Relative Position (Push content)
              position: isMobile ? "absolute" : "relative",
              zIndex: 50,
              height: "100%",
              
              width: isSidebarOpen ? "260px" : "0px", 
              padding: isSidebarOpen ? "30px 20px" : "30px 0px", 
              opacity: isSidebarOpen ? 1 : 0, 
              
              background: "#0b0c15", 
              borderRight: "1px solid rgba(255,255,255,0.05)", 
              display: "flex", flexDirection: "column", 
              overflow: "hidden", 
              transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)", // Smooth "Drawer" feel
              whiteSpace: "nowrap",
              boxShadow: isMobile && isSidebarOpen ? "5px 0 15px rgba(0,0,0,0.5)" : "none"
          }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
              <NavItem to="/" icon={<Search size={20} />} label="Discover" isOpen={isSidebarOpen} />
              <NavItem to="/chat" icon={<MessageSquare size={20} />} label="Chat Feed" isOpen={isSidebarOpen} />
              <NavItem to="/find" icon={<Users size={20} />} label="Find People" isOpen={isSidebarOpen} />
              <NavItem to="/profile" icon={<Settings size={20} />} label="Settings" isOpen={isSidebarOpen} />
            </nav>

            <button 
                onClick={handleLogout} 
                style={{ 
                    marginTop: "auto", display: "flex", alignItems: "center", gap: "10px", 
                    padding: "12px", background: "rgba(255, 42, 109, 0.1)", color: "#ff2a6d", 
                    border: "1px solid #ff2a6d", borderRadius: "12px", cursor: "pointer", fontWeight: "600",
                    opacity: isSidebarOpen ? 1 : 0, transition: "opacity 0.3s" 
                }}
            >
              <LogOut size={18} /> {isSidebarOpen && "Logout"}
            </button>
          </aside>

          {/* MAIN CONTENT BACKDROP (Mobile Only - Click to close sidebar) */}
          {isMobile && isSidebarOpen && (
              <div 
                  onClick={() => setIsSidebarOpen(false)}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(3px)" }}
              />
          )}

          {/* CONTENT */}
          <main style={{ flex: 1, position: "relative", overflow: "hidden", padding: isMobile ? "10px" : "20px 20px 0 20px", transition: "all 0.5s ease" }}>
            <Outlet /> 
          </main>

      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label, isOpen }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} style={{
      display: "flex", alignItems: "center", gap: "15px",
      padding: "12px 15px", borderRadius: "12px",
      color: isActive ? "#fff" : "#6c757d",
      background: isActive ? "linear-gradient(90deg, rgba(5, 217, 232, 0.1) 0%, transparent 100%)" : "transparent",
      borderLeft: isActive ? "3px solid #05d9e8" : "3px solid transparent",
      textDecoration: "none", transition: "all 0.2s",
      whiteSpace: "nowrap"
    }}>
      {icon}
      <span style={{ fontWeight: isActive ? "600" : "400", opacity: isOpen ? 1 : 0, transition: "opacity 0.3s ease", transitionDelay: isOpen ? "0.2s" : "0s" }}>
          {label}
      </span>
    </Link>
  );
};

export default Layout;