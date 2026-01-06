import React, { useState, useEffect } from "react";
import CardStack from "../components/Cards/CardStack";
import LightRays from "../components/effects/LightRays";
import { Search, Check, X } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/mainContext";
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../conf/firebase";

const PUBLIC_GROUPS = [
    { id: "c1", name: "General Campus", members: 358 },
    { id: "c2", name: "Tech Talk", members: 120 },
    { id: "c3", name: "Events & Fests", members: 85 },
    { id: "c4", name: "Gaming Club", members: 64 },
];

const Discovery = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
    const [loading, setLoading] = useState(true);
    
    // Notification State
    const [notification, setNotification] = useState(null); 

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1000);
        window.addEventListener("resize", handleResize);

        const fetchUsers = async () => {
            try {
                const snap = await getDocs(collection(db, "users"));
                const list = snap.docs
                    .map(d => ({
                        uid: d.id,
                        name: d.data().Name || d.data().name || "Unknown Student",
                        major: d.data().DEPT?.toUpperCase() || d.data().branch || "STUDENT",
                        bio: d.data().BIO || d.data().bio || "",
                        photoUrl: d.data().photoURL || d.data().photoUrl || "",
                    }))
                    .filter(u => u.uid !== authUser?.uid);
                setUsers(list);
            } catch (err) {
                console.error("Fetch users error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (authUser) fetchUsers();
        return () => window.removeEventListener("resize", handleResize);
    }, [authUser]);

    const sendFriendRequest = async (targetUser) => {
        if (!authUser || !targetUser?.uid) return;
        
        const requestId = `${authUser.uid}_${targetUser.uid}`;
        const reverseId = `${targetUser.uid}_${authUser.uid}`;

        try {
            const reverseSnap = await getDoc(doc(db, "friend_requests", reverseId));
            if (reverseSnap.exists()) {
                showNotification("Request pending!", "error");
                return;
            }

            await setDoc(doc(db, "friend_requests", requestId), {
                from: authUser.uid,
                to: targetUser.uid,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            // FIXED: Use the fallback name we created in fetchUsers
            showNotification(`Request sent to ${targetUser.name}!`, "success");

        } catch (err) {
            console.error("Error sending request:", err);
        }
    };

    const showNotification = (msg, type) => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <div style={{
            display: isMobile ? "flex" : "grid",
            flexDirection: "column",
            gridTemplateColumns: "1fr 350px",
            gap: "20px",
            height: "100%",
            padding: "5px",
            position: "relative"
        }}>
            
            {/* --- EXACT REPLICA OF YOUR NOTIFICATION POPUP --- */}
            {notification && (
                <div style={{
                    position: "fixed",
                    bottom: "30px",
                    right: "20%",
                    background: "rgba(10, 10, 20, 0.95)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(5, 217, 232, 0.3)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(5, 217, 232, 0.2)",
                    padding: "16px 20px",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    zIndex: 10000,
                    minWidth: "300px",
                    animation: "slideIn 0.3s ease-out"
                }}>
                    {/* ICON (Green for Success, Red for Error) */}
                    <div style={{
                        background: notification.type === "success" 
                            ? "linear-gradient(135deg, #05d9e8 0%, #0056ff 100%)" 
                            : "linear-gradient(135deg, #ff2a6d 0%, #ff5e62 100%)",
                        width: "40px", height: "40px", borderRadius: "12px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 10px rgba(5, 217, 232, 0.3)"
                    }}>
                        {notification.type === "success" ? <Check size={20} color="white" /> : <X size={20} color="white" />}
                    </div>

                    {/* TEXT CONTENT */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: "white", margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>
                            {notification.type === "success" ? "Success!" : "Notice"}
                        </h4>
                        <p style={{ color: "#aaa", margin: 0, fontSize: "12px" }}>
                            {notification.msg}
                        </p>
                    </div>

                    {/* CLOSE BUTTON */}
                    <button 
                        onClick={() => setNotification(null)}
                        style={{ background: "transparent", border: "none", color: "#666", cursor: "pointer", padding: "5px", display: "flex", alignItems: "center", transition: "color 0.2s" }}
                        onMouseOver={(e) => e.target.style.color = "white"}
                        onMouseOut={(e) => e.target.style.color = "#666"}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* MAIN DISCOVERY AREA */}
            <div className="dashboard-card" style={{ 
                position: "relative", 
                // paddingTop: "30px", 
                // overflow: "hidden", 
                height: "650px", 
                height: "100%",
                display: "flex",
                flexDirection: "column"
            }}>
                <div style={{ padding: "0 30px",  }}>
                    <div style={{ display: "flex", alignItems: "center", background: "#0b0c15", padding: "10px", borderRadius: "8px", maxWidth: "300px" }}>
                        <Search size={16} color="#666" />
                        <input placeholder="Reg No or Name" style={{ background: "transparent", border: "none", color: "white", marginLeft: "10px", outline: "none" }} />
                    </div>
                </div>

                <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "40px" }}>
                    {loading ? (
                        <p style={{ color: "#aaa" }}>Finding students...</p>
                    ) : users.length > 0 ? (
                        <CardStack
                            users={users}
                            onSwipeDown={sendFriendRequest}
                            onSwipeUp={(u) => console.log("Skipped:", u.name)}
                        />
                    ) : (
                        <p style={{ color: "#777" }}>No more users to discover</p>
                    )}
                </div>
                <LightRays raysColor="#ff2a6d" />
            </div>

            {/* SIDEBAR */}
            <div className="dashboard-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                    <h3 style={{ color: "white", marginBottom: "15px" }}>Connect Rooms</h3>
                    {PUBLIC_GROUPS.map(g => (
                        <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                            <div>
                                <div style={{ color: "white", fontSize: "15px" }}>{g.name}</div>
                                <div style={{ color: "#777", fontSize: "12px" }}>{g.members} members</div>
                            </div>
                            <button onClick={() => navigate("/chat")} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "5px 15px", borderRadius: "20px", cursor: "pointer" }}>
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