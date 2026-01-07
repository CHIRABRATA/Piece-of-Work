import React, { useState, useEffect } from "react";
import { Search, MessageCircle, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/mainContext";
import { db } from "../conf/firebase";
import { collection, onSnapshot } from "firebase/firestore";

const Find = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || "Unknown",
          regNo: data.regNo || "",
          major: data.branch || "",
          year: data.year || "",
          status: data.isOnline ? "Online" : "Offline",
          photoUrl: data.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        });
      });
      setStudents(list.filter(s => s.id !== user?.uid));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.regNo || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessage = (student) => {
    navigate("/chat", { 
      state: { 
        selectedUser: { 
          uid: student.id, 
          name: student.name, 
          photoURL: student.photoUrl 
        } 
      } 
    });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      
      {/* HEADER */}
      <div className="dashboard-card" style={{ padding: "20px", marginBottom: "20px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? "15px" : "0", flexShrink: 0 }}>
        <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: "white" }}>Find Students</h2>
            <p style={{ margin: "5px 0 0 0", color: "#6c757d", fontSize: "14px" }}>Start typing to filter results...</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", background: "#0b0c15", padding: "10px 15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", width: isMobile ? "100%" : "300px" }}>
            <Search size={18} color="#6c757d" style={{ marginRight: "10px" }} />
            <input 
                type="text" 
                placeholder="Search Name or ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: "transparent", border: "none", color: "white", outline: "none", width: "100%", fontSize: "15px" }} 
            />
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingRight: "5px", paddingBottom: "20px" }}>
        
        {isMobile ? (
             // --- MOBILE VIEW: COMPACT LIST ---
             <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {loading ? (
                    <div style={{ textAlign: "center", color: "#aaa", padding: "20px" }}>Loading students...</div>
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                        <div key={student.id} onClick={() => handleMessage(student)} style={{ 
                            display: "flex", alignItems: "center", gap: "15px", 
                            padding: "12px", borderRadius: "12px", 
                            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer"
                        }}>
                             {/* Avatar */}
                             <div style={{ position: "relative" }}>
                                <img src={student.photoUrl} alt={student.name} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
                                {student.status === 'Online' && <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", background: "#00ff88", borderRadius: "50%", border: "2px solid #13141f" }} />}
                             </div>
                             
                             {/* Info */}
                             <div style={{ flex: 1 }}>
                                 <div style={{ fontWeight: "600", color: "white", fontSize: "16px" }}>{student.name}</div>
                                 <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                     <span style={{ fontSize: "11px", color: "#ff2a6d", background: "rgba(255, 42, 109, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{student.regNo}</span>
                                     <span style={{ fontSize: "11px", color: "#05d9e8", background: "rgba(5, 217, 232, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>{student.major}</span>
                                 </div>
                             </div>

                             {/* Action Icon */}
                             <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "rgba(5, 217, 232, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#05d9e8" }}>
                                 <MessageCircle size={18} />
                             </div>
                        </div>
                    ))
                ) : (
                    <EmptyState />
                )}
             </div>
        ) : (
            // --- DESKTOP VIEW: CARD GRID ---
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
                {loading ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "#aaa" }}>Loading students...</div>
                ) : filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                        <div key={student.id} className="dashboard-card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                            {/* Status Dot */}
                            <div style={{ position: "absolute", top: "15px", right: "15px", fontSize: "12px", fontWeight: "600", color: student.status === 'Online' ? '#00ff88' : '#6c757d', display: "flex", alignItems: "center", gap: "5px" }}>
                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: student.status === 'Online' ? '#00ff88' : '#6c757d' }}></div>
                                {student.status}
                            </div>
                            <img src={student.photoUrl} alt={student.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px", border: "2px solid rgba(255,255,255,0.1)" }} />
                            <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "white", textAlign: "center" }}>{student.name}</h3>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexWrap: "wrap", justifyContent: "center" }}>
                                <span style={{ fontSize: "11px", background: "rgba(255, 42, 109, 0.1)", color: "#ff2a6d", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(255, 42, 109, 0.3)" }}>{student.regNo}</span>
                                <span style={{ fontSize: "11px", background: "rgba(5, 217, 232, 0.1)", color: "#05d9e8", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(5, 217, 232, 0.3)" }}>{student.major}</span>
                            </div>
                            <button 
                                onClick={() => handleMessage(student)}
                                style={{ 
                                    width: "100%", padding: "10px", 
                                    background: "transparent", border: "1px solid rgba(255,255,255,0.2)", 
                                    borderRadius: "10px", color: "white", cursor: "pointer", 
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = "#00ff88"; e.currentTarget.style.background = "rgba(0, 255, 136, 0.1)"; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent"; }}
                            >
                                <MessageCircle size={16} /> Message
                            </button>
                        </div>
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// Helper for "No Results"
const EmptyState = () => (
    <div style={{ textAlign: "center", marginTop: "50px", color: "#6c757d", gridColumn: "1 / -1" }}>
        <Search size={40} style={{ marginBottom: "10px", opacity: 0.5 }} />
        <h3>No match found</h3>
        <p>Try searching for a different name.</p>
    </div>
);

export default Find;
