import React, { useState, useEffect } from "react";
import CardStack from "../components/Cards/CardStack";
import LightRays from "../components/effects/LightRays";
import { Search } from "lucide-react";
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

    // 1. Fetch Users
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1000);
        window.addEventListener("resize", handleResize);

        const fetchUsers = async () => {
            try {
                const snap = await getDocs(collection(db, "users"));
                const list = snap.docs
                    .map(d => ({
                        uid: d.id,
                        name: d.data().Name,
                        major: d.data().DEPT?.toUpperCase(),
                        bio: d.data().BIO || "",
                        photoUrl: d.data().photoURL || "",
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

    // 2. Send Request Logic
    const sendFriendRequest = async (targetUser) => {
        if (!authUser || !targetUser?.uid) return;
        
        const requestId = `${authUser.uid}_${targetUser.uid}`;
        const reverseId = `${targetUser.uid}_${authUser.uid}`;

        try {
            // Check reverse
            const reverseSnap = await getDoc(doc(db, "friend_requests", reverseId));
            if (reverseSnap.exists()) {
                alert("They already sent you a request! Check your Requests page.");
                return;
            }

            // Send Request
            await setDoc(doc(db, "friend_requests", requestId), {
                from: authUser.uid,
                to: targetUser.uid,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            console.log("Request sent to:", targetUser.name);
        } catch (err) {
            console.error("Error sending request:", err);
        }
    };

    return (
        <div style={{
            display: isMobile ? "flex" : "grid",
            flexDirection: "column",
            gridTemplateColumns: "1fr 350px",
            gap: "20px",
            height: "100%",
            padding: "20px"
        }}>
            {/* MAIN DISCOVERY AREA */}
            <div className="dashboard-card" style={{ position: "relative", paddingTop: "30px", overflow: "hidden", minHeight: "600px" }}>
                <div style={{ padding: "0 30px", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", background: "#0b0c15", padding: "10px", borderRadius: "8px", maxWidth: "300px" }}>
                        <Search size={16} color="#666" />
                        <input placeholder="Reg No or Name" style={{ background: "transparent", border: "none", color: "white", marginLeft: "10px", outline: "none" }} />
                    </div>
                </div>

                <div style={{ transform: "scale(0.9)", display: "flex", justifyContent: "center", height: "500px" }}>
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

            {/* SIDEBAR - GROUPS ONLY (Requests moved to separate page) */}
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