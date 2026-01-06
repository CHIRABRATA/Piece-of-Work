import React, { useState, useEffect } from "react";
import CardStack from "../components/Cards/CardStack";
import LightRays from "../components/effects/LightRays";
import { Check, X, Settings2 } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/mainContext";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
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
                const list = snap.docs
                    .map(d => ({
                        uid: d.id,
                        name: d.data().Name || d.data().name || "Unknown Student",
                        branch: d.data().branch || d.data().DEPT || "",
                        batch: d.data().batch || "",
                        bio: d.data().BIO || d.data().bio || "",
                        photoUrl: d.data().photoURL || d.data().photoUrl || "",
                    }))
                    .filter(u => u.uid !== authUser?.uid);
                
                setUsers(list);
                setAvailableBatches([...new Set(list.map(u => u.batch).filter(Boolean))].sort());
                setAvailableBranches([...new Set(list.map(u => u.branch).filter(Boolean))].sort());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
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
        try {
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
            // Mobile: use 100dvh to avoid browser bar cutting off content. Desktop: use your original calc.
            height: isMobile ? "calc(100dvh - 80px)" : "calc(100vh - 100px)", 
            padding: "10px",
            position: "relative",
            overflow: "hidden"
        }}>
            
            {/* NOTIFICATION */}
            {notification && (
                <div style={{
                    position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
                    background: "rgba(10, 10, 20, 0.95)", border: "1px solid #05d9e8",
                    padding: "12px 20px", borderRadius: "12px", zIndex: 10000, display: "flex", gap: "10px"
                }}>
                    {notification.type === "success" ? <Check color="#05d9e8" /> : <X color="#ff2a6d" />}
                    <span style={{ color: "white" }}>{notification.msg}</span>
                </div>
            )}

            {/* MAIN DISCOVERY AREA */}
            <div className="dashboard-card" style={{ 
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                position: "relative", 
                // Mobile: remove minHeight to let it shrink if needed. Desktop: keep your 500px.
                minHeight: isMobile ? "auto" : "500px",
                marginTop: isMobile ? "0px" : "-10px", 
                overflow: "hidden", 
                zIndex: 1
            }}>
                {/* Mobile Sidebar Toggle - Floating on top right so it doesn't push cards down */}
                {isMobile && (
                    <div style={{ position: "absolute", top: "15px", right: "15px", zIndex: 50 }}>
                        <button onClick={() => setShowSidebar(true)} style={{ background: "#05d9e8", border: "none", borderRadius: "10px", padding: "10px", color: "black", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                            <Settings2 size={20} />
                        </button>
                    </div>
                )}

                {/* Card Stack Area */}
                <div style={{ 
                    flex: 1, 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    zIndex: 5,
                    // Mobile: No margin top needed since button floats. Desktop: keep your 30px.
                    marginTop: isMobile ? "0px" : "30px",
                    width: "100%",
                    height: "100%"
                }}>
                    {loading ? (
                        <p style={{ color: "#aaa" }}>Finding students...</p>
                    ) : filteredUsers.length > 0 ? (
                        <CardStack users={filteredUsers} onSwipeDown={sendFriendRequest} onSwipeUp={() => {}} />
                    ) : (
                        <p style={{ color: "#777" }}>No users found</p>
                    )}
                </div>

                {/* LightRays */}
                <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                    <LightRays key={isMobile ? "mobile-view" : "desktop-view"} raysColor="#ff2a6d" />
                </div>
            </div>

            {/* SIDEBAR (Filters & Matches) */}
            <div style={{ 
                width: isMobile ? "100%" : "350px",
                position: isMobile ? "fixed" : "relative",
                top: 0, right: 0, bottom: 0,
                zIndex: 1000,
                display: (isMobile && !showSidebar) ? "none" : "flex",
                flexDirection: "column",
                gap: "20px",
                background: isMobile ? "#0a0a14" : "transparent",
                padding: "20px",
                overflowY: "auto",
                // Mobile animation or safe area handling
                paddingTop: isMobile ? "40px" : "20px"
            }}>
                {isMobile && (
                    <button onClick={() => setShowSidebar(false)} style={{ alignSelf: "flex-end", color: "#05d9e8", background: "none", border: "none", fontSize: "16px", marginBottom: "10px", fontWeight: "bold" }}>
                        ✕ Close Filters
                    </button>
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

                <div className="dashboard-card" style={{ padding: "15px", flex: 1, minHeight: isMobile ? "300px" : "auto" }}>
                    <h3 style={{ color: "white", fontSize: "14px", marginBottom: "10px" }}>Top Matches</h3>
                    {matchingUsers.map((u, i) => (
                        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px" }}>
                            <img src={u.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: "35px", height: "35px", borderRadius: "50%", border: "1px solid #05d9e8", objectFit: "cover" }} alt="" />
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