import React from "react";
import CardStack from "../components/Cards/CardStack";
import LightRays from "../components/effects/LightRays"; 
import { Search, Plus, Hash, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Dummy Stack Data
const DUMMY_USERS = [
  { uid: "u1", name: "Aisha Rahman", regNo: "2024CS01", major: "CSE", year: "3rd", bio: "Love coding and coffee", photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" },
  { uid: "u2", name: "Rahul Verma", regNo: "2023IT99", major: "IT", year: "4th", bio: "Hackathon junkie", photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80" },
  { uid: "u3", name: "Priya Singh", regNo: "2025ECE12", major: "ECE", year: "2nd", bio: "Circuits & Coffee", photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80" },
];

// NEW: Public Groups Data
const PUBLIC_GROUPS = [
  { id: "c1", name: "General Campus", members: 358, topic: "Everything campus related" },
  { id: "c2", name: "Tech Talk 💻", members: 120, topic: "Code, AI & Hackathons" },
  { id: "c3", name: "Events & Fests", members: 85, topic: "Weekend plans?" },
  { id: "c4", name: "Gaming Club 🎮", members: 64, topic: "Valo / CS:GO tonight" },
  { id: "c5", name: "Photography", members: 42, topic: "Photo walks & edits" },
];

const Discovery = () => {
  const navigate = useNavigate();

  const handleJoinGroup = (group) => {
      // Navigate to Chat -> Switch to Public -> Open this channel
      navigate("/chat", { state: { joinPublicChannel: group } });
  };

  return (
    // Grid Layout: Left Stack (Flexible) | Right Panel (Fixed 350px)
    <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "20px", height: "100%", paddingBottom: "20px", boxSizing: "border-box" }}>
      
      {/* --- COLUMN 1: THE STACK (Center) --- */}
      <div className="dashboard-card" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        
        {/* Header Text */}
        <div style={{ position: "absolute", top: "30px", left: "30px", zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: "24px", color: "white" }}>The Stack & Discover</h2>
          <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
             <div style={{ display: "flex", alignItems: "center", background: "#0b0c15", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Search size={16} color="#666" style={{ marginRight: "10px" }} />
                <input type="text" placeholder="Reg No or Name" style={{ background: "transparent", border: "none", color: "white", width: "150px", outline: "none" }} />
             </div>
          </div>
        </div>

        {/* The Card Stack */}
        <div style={{ transform: "scale(0.85)", marginTop: "40px" }}>
            <CardStack 
                users={DUMMY_USERS} 
                onSwipeDown={(u) => console.log("Req:", u.name)} 
                onSwipeUp={(u) => console.log("Skip:", u.name)} 
            />
        </div>

        {/* Background Rays */}
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.5, pointerEvents: "none" }}>
            <LightRays raysColor="#ff2a6d" speed={1.0} />
        </div>
      </div>

      {/* --- COLUMN 2: RIGHT PANEL (Connect Rooms) --- */}
      <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", padding: "20px", minHeight: 0 }}>
        
        <div style={{ marginBottom: "20px" }}>
            <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "white" }}>Connect Rooms</h3>
            <p style={{ margin: 0, color: "#aaa", fontSize: "13px" }}>Join public discussions</p>
        </div>

        {/* Search Groups */}
        <div style={{ display: "flex", alignItems: "center", background: "#0b0c15", padding: "10px 15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "20px" }}>
            <Search size={18} color="#6c757d" style={{ marginRight: "10px" }} />
            <input type="text" placeholder="Find a community..." style={{ background: "transparent", border: "none", color: "white", outline: "none", width: "100%", fontSize: "14px" }} />
        </div>

        {/* Scrollable Group List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "5px" }}>
            {PUBLIC_GROUPS.map((group) => (
                <div key={group.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* Group Icon */}
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(5, 217, 232, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#05d9e8" }}>
                            <Hash size={20} />
                        </div>
                        {/* Info */}
                        <div>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "white" }}>{group.name}</div>
                            <div style={{ fontSize: "12px", color: "#666", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Users size={10} /> {group.members} Online
                            </div>
                        </div>
                    </div>
                    
                    {/* Join Button */}
                    <button 
                        onClick={() => handleJoinGroup(group)}
                        style={{ 
                            padding: "6px 16px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)", 
                            background: "transparent", color: "white", fontSize: "12px", cursor: "pointer", fontWeight: "600",
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = "#05d9e8"; e.currentTarget.style.color = "#05d9e8"; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "white"; }}
                    >
                        Join
                    </button>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default Discovery;