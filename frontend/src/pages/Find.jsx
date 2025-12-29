import React, { useState } from "react";
import { Search, MessageCircle, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom"; 

const ALL_STUDENTS = [
  { id: "101", name: "Aisha Rahman", regNo: "2024CS01", major: "CSE", year: "3rd", status: "Online", photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
  { id: "102", name: "Rahul Verma", regNo: "2023IT99", major: "IT", year: "4th", status: "In Class", photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80" },
  { id: "103", name: "Priya Singh", regNo: "2025ECE12", major: "ECE", year: "2nd", status: "Online", photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80" },
  { id: "104", name: "Amit Patel", regNo: "2022MECH05", major: "Mech", year: "Final", status: "Offline", photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80" },
  { id: "105", name: "Sneha Gupta", regNo: "2024CS45", major: "CSE", year: "3rd", status: "Online", photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" },
  { id: "106", name: "Vikram Malhotra", regNo: "2023EEE22", major: "EEE", year: "3rd", status: "Gym", photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80" },
];

const Find = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredStudents = ALL_STUDENTS.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.regNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMessage = (student) => {
      navigate("/chat", { state: { startChatWith: student } });
  };

  return (
    // FIX: height: 100%, minHeight: 0 prevents overflow issues in flex containers
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      
      {/* HEADER SECTION */}
      <div className="dashboard-card" style={{ padding: "20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
            <h2 style={{ margin: 0, fontSize: "24px", color: "white" }}>Find Students</h2>
            <p style={{ margin: "5px 0 0 0", color: "#6c757d", fontSize: "14px" }}>Start typing to filter results...</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", background: "#0b0c15", padding: "10px 15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", width: "300px" }}>
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

      {/* GRID SECTION */}
      {/* FIX: flex: 1, overflowY: auto, minHeight: 0 ensures inner scrolling works perfect */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingRight: "5px", paddingBottom: "20px" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                    <div key={student.id} className="dashboard-card" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                        
                        {/* Status Dot */}
                        <div style={{ position: "absolute", top: "15px", right: "15px", fontSize: "12px", fontWeight: "600", color: student.status === 'Online' ? '#00ff88' : '#6c757d', display: "flex", alignItems: "center", gap: "5px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: student.status === 'Online' ? '#00ff88' : '#6c757d' }}></div>
                            {student.status}
                        </div>

                        {/* Avatar */}
                        <img 
                            src={student.photoUrl} 
                            alt={student.name} 
                            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px", border: "2px solid rgba(255,255,255,0.1)" }} 
                        />

                        {/* Info */}
                        <h3 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "white" }}>{student.name}</h3>
                        
                        <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
                            <span style={{ fontSize: "11px", background: "rgba(255, 42, 109, 0.1)", color: "#ff2a6d", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(255, 42, 109, 0.3)" }}>
                                {student.regNo}
                            </span>
                            <span style={{ fontSize: "11px", background: "rgba(5, 217, 232, 0.1)", color: "#05d9e8", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(5, 217, 232, 0.3)" }}>
                                {student.major}
                            </span>
                        </div>

                        {/* Action Button */}
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
                // Empty State
                <div style={{ gridColumn: "1 / -1", textAlign: "center", marginTop: "50px", color: "#6c757d" }}>
                    <Search size={40} style={{ marginBottom: "10px", opacity: 0.5 }} />
                    <h3>No match found</h3>
                    <p>Try searching for a different name.</p>
                </div>
            )}
        </div>
      </div>

    </div>
  );
};

export default Find;