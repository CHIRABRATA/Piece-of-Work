import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3, GraduationCap, Calendar, Users, Briefcase } from "lucide-react";
import { useAuth } from "../context/mainContext";

const Profile = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          const profile = data.profiles[authUser?.uid || 'default'];
          setProfileData(profile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => window.removeEventListener("resize", handleResize);
  }, [authUser]);

  if (loading) return <div className="flex items-center justify-center h-full text-blue-400 font-bold animate-pulse">LOADING PROFILE...</div>;

  const user = profileData || {
    name: "Complete Your Profile",
    regNo: "N/A",
    major: "N/A",
    year: "N/A",
    bio: "Click edit to add your bio and info!",
    stats: { matches: 0, views: 0, likes: 0 },
    photoUrl: "https://via.placeholder.com/150"
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingRight: "5px" }}>

      {/* 1. TOP BANNER */}
      <div className="dashboard-card" style={{ position: "relative", height: "200px", marginBottom: "80px", overflow: "visible" }}>
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
          backgroundPosition: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          zIndex: 10
        }} />
      </div>

      {/* 2. USER INFO */}
      <div style={{ textAlign: "center", marginBottom: "40px", padding: "0 10px" }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: isMobile ? "26px" : "36px", color: "white", fontWeight: "900", letterSpacing: "-1px" }}>{user.name}</h1>

        {/* COLLEGE BADGES */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <Badge text={user.regNo} color="#ff2a6d" icon={<GraduationCap size={14} />} />
          <Badge text={user.branch || user.major} color="#05d9e8" icon={<Briefcase size={14} />} />
          <Badge text={user.year} color="#00ff88" icon={<Calendar size={14} />} />
          {user.batch && <Badge text={`Batch ${user.batch}`} color="#f0ad4e" icon={<Users size={14} />} />}
        </div>

        <p style={{ color: "#aaa", maxWidth: "600px", margin: "0 auto 20px auto", lineHeight: "1.6", fontStyle: "italic", fontSize: "16px" }}>
          "{user.bio}"
        </p>

        {/* INTERESTS */}
        {user.interests && (
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "30px" }}>
            {(typeof user.interests === 'string' ? user.interests.split(',') : user.interests).map((interest, idx) => (
              <span key={idx} style={{
                background: "rgba(255,255,255,0.05)",
                color: "#ccc", padding: "4px 12px", borderRadius: "15px",
                fontSize: "12px", border: "1px solid rgba(255,255,255,0.1)"
              }}>
                #{interest.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. STATS GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
        gap: "20px",
        maxWidth: "800px",
        margin: "0 auto 40px auto"
      }}>
        <StatCard label="Matches" value={user.stats.matches} color="#ff2a6d" />
        <StatCard label="Profile Views" value={user.stats.views} color="#05d9e8" />
        {!isMobile && <StatCard label="Super Likes" value={user.stats.likes} color="#00ff88" />}
      </div>

      {/* 4. DETAILS SECTION */}
      <div style={{ maxWidth: "800px", margin: "0 auto 40px auto" }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailBlock label="Clubs" value={user.clubs || "Not joined any clubs yet"} />
        <DetailBlock label="Skills" value={user.skills || "Add your skills!"} />
      </div>

      {/* 5. ACTIONS */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "60px" }}>
        <button
          onClick={() => navigate("/edit-profile")}
          style={{
            padding: "15px 40px", borderRadius: "40px", border: "none",
            background: "linear-gradient(90deg, #ff2a6d 0%, #ff2a6d 100%)",
            boxShadow: "0 5px 20px rgba(255, 42, 109, 0.3)",
            color: "white", fontWeight: "800", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "10px", fontSize: "16px",
            transition: "transform 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <Edit3 size={18} /> EDIT PROFILE
        </button>
      </div>

    </div>
  );
};

const Badge = ({ text, color, icon }) => (
  <span style={{
    background: `rgba(${color === '#ff2a6d' ? '255, 42, 109' : color === '#05d9e8' ? '5, 217, 232' : '0, 255, 136'}, 0.05)`,
    color: color, padding: "6px 14px", borderRadius: "20px", fontSize: "14px", fontWeight: "700", border: `1px solid ${color}`,
    display: "flex", alignItems: "center", gap: "6px"
  }}>
    {icon} {text}
  </span>
);

const StatCard = ({ label, value, color }) => (
  <div className="dashboard-card" style={{ padding: "20px", textAlign: "center", borderBottom: `4px solid ${color}`, background: "rgba(255,255,255,0.02)" }}>
    <div style={{ fontSize: "36px", fontWeight: "900", color: "white", marginBottom: "2px" }}>{value}</div>
    <div style={{ color: "#666", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
  </div>
);

const DetailBlock = ({ label, value }) => (
  <div className="dashboard-card" style={{ padding: "20px", background: "rgba(255,255,255,0.02)" }}>
    <div style={{ color: "#ff2a6d", fontWeight: "800", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "1px" }}>{label}</div>
    <div style={{ color: "white", fontSize: "15px" }}>{value}</div>
  </div>
);

export default Profile;