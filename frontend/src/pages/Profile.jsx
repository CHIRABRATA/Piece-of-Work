import React, { useState, useEffect } from "react";
import { Edit3 } from "lucide-react";

const Profile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const user = {
    name: "Chirabrata Ghosal",
    regNo: "2024CS01",
    major: "Computer Science",
    year: "3rd Year",
    bio: "Full Stack Developer | AI Enthusiast | Coffee Addict ☕",
    stats: { matches: 42, views: 1050, likes: 305 },
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingRight: "5px" }}> 
      
      {/* 1. TOP BANNER */}
      <div className="dashboard-card" style={{ position: "relative", height: "250px", marginBottom: "80px", overflow: "visible" }}>
        <div style={{ 
            height: "100%", width: "100%", borderRadius: "24px", 
            background: "linear-gradient(90deg, #ff2a6d 0%, #05d9e8 100%)", 
            opacity: 0.8
        }} />
        
        <div style={{ 
            position: "absolute", bottom: "-60px", left: "50%", transform: "translateX(-50%)",
            width: "140px", height: "140px", borderRadius: "50%", 
            border: "6px solid #0b0c15", 
            backgroundImage: `url(${user.photoUrl})`, backgroundSize: "cover",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 10
        }} />
      </div>

      {/* 2. USER INFO */}
      <div style={{ textAlign: "center", marginBottom: "40px", padding: "0 10px" }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: isMobile ? "26px" : "32px", color: "white" }}>{user.name}</h1>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <Badge text={user.regNo} color="#ff2a6d" />
            <Badge text={user.major} color="#05d9e8" />
        </div>
        <p style={{ color: "#aaa", maxWidth: "500px", margin: "0 auto", lineHeight: "1.6", fontStyle: "italic", fontSize: "14px" }}>
            "{user.bio}"
        </p>
      </div>

      {/* 3. STATS GRID (RESPONSIVE) */}
      <div style={{ 
          display: "grid", 
          // 3 Columns on Desktop, 1 Column on Mobile
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", 
          gap: "20px", 
          maxWidth: "800px", 
          margin: "0 auto 40px auto" 
      }}>
         <StatCard label="Matches" value={user.stats.matches} color="#ff2a6d" />
         <StatCard label="Profile Views" value={user.stats.views} color="#05d9e8" />
         <StatCard label="Super Likes" value={user.stats.likes} color="#00ff88" />
      </div>

      {/* 4. ACTIONS */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "40px" }}>
          <button style={{ 
              padding: "12px 30px", borderRadius: "30px", border: "none", 
              background: "#ff2a6d", color: "white", fontWeight: "bold", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "10px", fontSize: "16px"
          }}>
              <Edit3 size={18} /> Edit Profile
          </button>
      </div>

    </div>
  );
};

const Badge = ({ text, color }) => (
    <span style={{ 
        background: `rgba(${color === '#ff2a6d' ? '255, 42, 109' : '5, 217, 232'}, 0.1)`, 
        color: color, padding: "5px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "600", border: `1px solid ${color}`
    }}>
        {text}
    </span>
);

const StatCard = ({ label, value, color }) => (
    <div className="dashboard-card" style={{ padding: "20px", textAlign: "center", borderTop: `3px solid ${color}` }}>
        <div style={{ fontSize: "32px", fontWeight: "800", color: "white", marginBottom: "5px" }}>{value}</div>
        <div style={{ color: "#aaa", fontSize: "14px" }}>{label}</div>
    </div>
);

export default Profile;