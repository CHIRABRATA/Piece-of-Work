import React, { useState, useEffect } from "react";
import CardStack from "../components/Cards/CardStack";
import LightRays from "../components/effects/LightRays";
import { Check, X, Settings2, Search } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/mainContext";
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../conf/firebase";

const Discovery = () => {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null); 

    // Filter states
    const [matchBatch, setMatchBatch] = useState(false);
    const [matchBranch, setMatchBranch] = useState(false);
    const [matchBio, setMatchBio] = useState(false);
    
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false); 

    const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setShowSidebar(false);
        };
        window.addEventListener("resize", handleResize);

        const fetchUsers = async () => {
            try {
                const snap = await getDocs(collection(db, "users"));
                const list = snap.docs.map(d => {
                    const data = d.data();
                    const rawPhoto = data.photoURL || data.photoUrl;
                    const finalPhoto = (rawPhoto && rawPhoto.trim() !== "") ? rawPhoto : DEFAULT_AVATAR;
                    return {
                        uid: d.id,
                        name: data.Name || data.name || "Unknown Student",
                        branch: data.branch || data.DEPT || "",
                        batch: data.batch || "",
                        bio: data.BIO || data.bio || "",
                        photoUrl: finalPhoto, 
                    };
                }).filter(u => u.uid !== authUser?.uid);
                
                setUsers(list);
                setAvailableBatches([...new Set(list.map(u => u.batch).filter(Boolean))].sort());
                setAvailableBranches([...new Set(list.map(u => u.branch).filter(Boolean))].sort());
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };

        if (authUser) fetchUsers();
        return () => window.removeEventListener("resize", handleResize);
    }, [authUser]);

    const showNotification = (msg, type) => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

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
            showNotification(`Request sent to ${targetUser.name}!`, "success");
        } catch (err) { console.error(err); }
    };

    const filteredUsers = users.filter(u => {
        const batchMatch = !selectedBatch || u.batch === selectedBatch;
        const branchMatch = !selectedBranch || u.branch === selectedBranch;
        return batchMatch && branchMatch;
    });

    const matchingUsers = users.filter(u => 
        (matchBatch && u.batch === authUser?.batch) ||
        (matchBranch && u.branch === authUser?.branch) ||
        (matchBio && u.bio)
    ).slice(0, 5);

    return (
        <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "20px",
            height: isMobile ? "100dvh" : "calc(100vh - 100px)", 
            padding: "10px",
            position: "relative",
            overflow: "hidden"
        }}>
            
            {/* NOTIFICATION */}
            {notification && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px",
                    background: "rgba(10, 10, 20, 0.95)", backdropFilter: "blur(12px)",
                    border: "1px solid rgba(5, 217, 232, 0.3)",
                    padding: "16px 20px", borderRadius: "16px",
                    display: "flex", alignItems: "center", gap: "15px",
                    zIndex: 10000, minWidth: "300px", animation: "slideIn 0.3s ease-out"
                }}>
                    <div style={{
                        background: notification.type === "success" ? "linear-gradient(135deg, #05d9e8 0%, #0056ff 100%)" : "linear-gradient(135deg, #ff2a6d 0%, #ff5e62 100%)",
                        width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        {notification.type === "success" ? <Check size={20} color="white" /> : <X size={20} color="white" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: "white", margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>{notification.type === "success" ? "Success!" : "Notice"}</h4>
                        <p style={{ color: "#aaa", margin: 0, fontSize: "12px" }}>{notification.msg}</p>
                    </div>
                    <button onClick={() => setNotification(null)} style={{ background: "transparent", border: "none", color: "#666" }}><X size={18} /></button>
                </div>
            )}

            {/* MAIN DISCOVERY AREA */}
            <div className="dashboard-card" style={{ 
                flex: 1, display: "flex", flexDirection: "column", position: "relative", 
                height: "100%", minHeight: 0, marginTop: isMobile ? "0px" : "-10px", 
                overflow: "hidden", zIndex: 1
            }}>
                {/* Mobile Sidebar Toggle - Floating */}
                {isMobile && (
                    <div style={{ position: "absolute", top: "15px", right: "15px", zIndex: 50 }}>
                        <button onClick={() => setShowSidebar(true)} style={{ background: "#05d9e8", border: "none", borderRadius: "10px", padding: "10px", color: "black", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                            <Settings2 size={20} />
                        </button>
                    </div>
                )}

                {/* Card Stack */}
                <div style={{ 
                    flex: 1, display: "flex", justifyContent: "center", alignItems: "center", 
                    zIndex: 5, width: "100%", height: "100%", 
                    paddingBottom: isMobile ? "60px" : "0px" 
                }}>
                    {loading ? <p style={{ color: "#aaa" }}>Finding students...</p> : 
                     filteredUsers.length > 0 ? <CardStack users={filteredUsers} onSwipeDown={sendFriendRequest} onSwipeUp={() => {}} /> : 
                     <p style={{ color: "#777" }}>No users found</p>}
                </div>
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                    <LightRays key={isMobile ? "mobile-view" : "desktop-view"} raysColor="#ff2a6d" />
                </div>
            </div>

            {/* --- RESPONSIVE SIDEBAR --- */}
            <div style={{ 
                // Mobile: Fixed Full Screen Overlay
                // Desktop: Relative Column
                position: isMobile ? "fixed" : "relative",
                top: 0, left: 0, 
                width: isMobile ? "100%" : "350px",
                height: isMobile ? "100%" : "auto",
                zIndex: 2000, // Top of everything on mobile
                background: isMobile ? "#0a0a14" : "transparent", // Solid bg for mobile
                
                // Show/Hide logic
                display: (isMobile && !showSidebar) ? "none" : "flex",
                flexDirection: "column",
                gap: "20px",
                padding: "20px",
                overflowY: "auto",
                transition: "all 0.3s ease"
            }}>
                {/* Mobile Header / Close Button */}
                {isMobile && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <h2 style={{ margin: 0, color: "white", fontSize: "20px" }}>Filters</h2>
                        <button onClick={() => setShowSidebar(false)} style={{ color: "#05d9e8", background: "none", border: "none", padding: "10px" }}>
                            <X size={24} />
                        </button>
                    </div>
                )}

                <div className="dashboard-card" style={{ padding: "15px" }}>
                    <h3 style={{ color: "white", fontSize: "14px", marginBottom: "10px" }}>Branch & Batch</h3>
                    <select onChange={(e) => setSelectedBranch(e.target.value)} style={{ width: "100%", background: "#111", color: "white", padding: "8px", borderRadius: "8px", border: "1px solid #333", marginBottom: "10px" }}>
                        <option value="">All Branches</option>
                        {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <select onChange={(e) => setSelectedBatch(e.target.value)} style={{ width: "100%", background: "#111", color: "white", padding: "8px", borderRadius: "8px", border: "1px solid #333" }}>
                        <option value="">All Batches</option>
                        {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                <div className="dashboard-card" style={{ padding: "15px" }}>
                    <h3 style={{ color: "white", fontSize: "14px", marginBottom: "10px" }}>Quick Match</h3>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {['Batch', 'Branch', 'Bio'].map(label => {
                            const active = label === 'Batch' ? matchBatch : label === 'Branch' ? matchBranch : matchBio;
                            return (
                                <button key={label} onClick={() => {
                                    if(label === 'Batch') setMatchBatch(!matchBatch);
                                    if(label === 'Branch') setMatchBranch(!matchBranch);
                                    if(label === 'Bio') setMatchBio(!matchBio);
                                }} style={{
                                    padding: "6px 12px", borderRadius: "20px", fontSize: "12px",
                                    border: "1px solid #05d9e8", cursor: "pointer",
                                    background: active ? "#05d9e8" : "transparent",
                                    color: active ? "black" : "#05d9e8",
                                    transition: "0.3s"
                                }}>{label}</button>
                            );
                        })}
                    </div>
                </div>

                <div className="dashboard-card" style={{ padding: "15px", flex: 1 }}>
                    <h3 style={{ color: "white", fontSize: "14px", marginBottom: "10px" }}>Top Matches</h3>
                    {matchingUsers.map((u, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                            <img src={u.photoUrl} style={{ width: "35px", height: "35px", borderRadius: "50%", border: "1px solid #05d9e8", objectFit: "cover" }} alt="" />
                            <div style={{ overflow: "hidden" }}>
                                <div style={{ color: "white", fontSize: "13px", fontWeight: "600", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{u.name}</div>
                                <div style={{ color: "#666", fontSize: "10px" }}>{u.branch}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Discovery;