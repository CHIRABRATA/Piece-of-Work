import React, { useState, useEffect } from "react";
import CardStack from "../components/Cards/CardStack";
import LightRays from "../components/effects/LightRays";
import { Check, X, Settings2, Activity, Heart, Users, ShieldCheck } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/mainContext";
import { collection, getDocs, doc, setDoc, getDoc, serverTimestamp, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../conf/firebase";

const Discovery = () => {
    const navigate = useNavigate();
    const { user: authUser, userData } = useAuth();
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [viewMode, setViewMode] = useState("social");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null); 

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

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Users with Role and Verification data
                const userSnap = await getDocs(collection(db, "users"));
                const userList = userSnap.docs.map(d => {
                    const data = d.data();
                    const rawPhoto = data.photoURL || data.photoUrl;
                    return {
                        uid: d.id,
                        name: data.Name || data.name || "Unknown Student",
                        branch: data.branch || data.DEPT || "",
                        batch: data.batch || "",
                        bio: data.BIO || data.bio || "",
                        role: data.role || "student", // Pass role for badge
                        regNo: data.regNo || "",     // Pass regNo for verified tick
                        photoUrl: (rawPhoto && rawPhoto.trim() !== "") ? rawPhoto : DEFAULT_AVATAR, 
                    };
                }).filter(u => u.uid !== authUser?.uid);
                setUsers(userList);

                const activitySnap = await getDocs(collection(db, "activities"));
                const activityList = activitySnap.docs.map(d => ({
                    uid: d.id,
                    ...d.data(),
                    isActivity: true 
                }));
                setActivities(activityList);

                setAvailableBatches([...new Set(userList.map(u => u.batch).filter(Boolean))].sort());
                setAvailableBranches([...new Set(userList.map(u => u.branch).filter(Boolean))].sort());
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };

        if (authUser) fetchData();
        return () => window.removeEventListener("resize", handleResize);
    }, [authUser]);

    const showNotification = (msg, type) => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSwipeAction = async (item) => {
        if (!authUser) return;
        if (item.isActivity) {
            try {
                await updateDoc(doc(db, "activities", item.uid), {
                    volunteer_list: arrayUnion(authUser.uid)
                });
                showNotification(`Applied for ${item.event_title}!`, "success");
            } catch (err) { console.error(err); }
        } else {
            const requestId = `${authUser.uid}_${item.uid}`;
            try {
                await setDoc(doc(db, "friend_requests", requestId), {
                    from: authUser.uid,
                    to: item.uid,
                    status: "pending",
                    createdAt: serverTimestamp(),
                });
                showNotification(`Request sent to ${item.name}!`, "success");
            } catch (err) { console.error(err); }
        }
    };

    const handleSwipeReject = (item) => { console.log(`Skipped ${item.name || item.event_title}`); };

    const filteredItems = viewMode === "social" 
        ? users.filter(u => (!selectedBatch || u.batch === selectedBatch) && (!selectedBranch || u.branch === selectedBranch))
        : activities;

    return (
        <div style={{
            display: "flex", flexDirection: isMobile ? "column" : "row",
            gap: "20px", height: isMobile ? "100dvh" : "calc(100vh - 100px)", 
            padding: "10px", position: "relative", overflow: "hidden"
        }}>
            
            {/* NOTIFICATION */}
            {notification && (
                <div style={{
                    position: "fixed", bottom: "30px", right: "30px",
                    background: "rgba(10, 10, 20, 0.95)", backdropFilter: "blur(12px)",
                    border: "1px solid rgba(5, 217, 232, 0.3)",
                    padding: "16px 20px", borderRadius: "16px",
                    display: "flex", alignItems: "center", gap: "15px",
                    zIndex: 10000, minWidth: "300px"
                }}>
                    <div style={{
                        background: notification.type === "success" ? "linear-gradient(135deg, #05d9e8 0%, #0056ff 100%)" : "#ff2a6d",
                        width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        {notification.type === "success" ? <Check size={20} color="white" /> : <X size={20} color="white" />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: "white", margin: 0, fontSize: "14px", fontWeight: "600" }}>{notification.msg}</p>
                    </div>
                </div>
            )}

            {/* MAIN DISCOVERY AREA */}
            <div className="dashboard-card" style={{ 
                flex: 1, display: "flex", flexDirection: "column", position: "relative", 
                height: "100%", overflow: "hidden", zIndex: 1
            }}>
                {/* MODE TOGGLE */}
                <div style={{ 
                    position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", 
                    zIndex: 50, display: "flex", background: "rgba(0,0,0,0.4)", padding: "5px", borderRadius: "15px", backdropFilter: "blur(10px)"
                }}>
                    <button 
                        onClick={() => setViewMode("social")}
                        style={{ 
                            padding: "8px 20px", borderRadius: "12px", border: "none", cursor: "pointer",
                            background: viewMode === "social" ? "#05d9e8" : "transparent",
                            color: viewMode === "social" ? "black" : "white", fontWeight: "bold", transition: "0.3s"
                        }}
                    >Social</button>
                    <button 
                        onClick={() => setViewMode("volunteer")}
                        style={{ 
                            padding: "8px 20px", borderRadius: "12px", border: "none", cursor: "pointer",
                            background: viewMode === "volunteer" ? "#ff2a6d" : "transparent",
                            color: viewMode === "volunteer" ? "white" : "white", fontWeight: "bold", transition: "0.3s"
                        }}
                    >Volunteer</button>
                </div>

                <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5, width: "100%", height: "100%" }}>
                    {loading ? <p style={{ color: "#aaa" }}>Loading Campus...</p> : 
                     filteredItems.length > 0 ? (
                        <CardStack 
                            users={filteredItems} 
                            onSwipeDown={handleSwipeAction} 
                            onSwipeUp={handleSwipeReject} 
                        />
                     ) : 
                     <p style={{ color: "#777" }}>No {viewMode === "social" ? "students" : "activities"} found</p>}
                </div>
                
                <LightRays raysColor={viewMode === "social" ? "#05d9e8" : "#ff2a6d"} />
            </div>

            {/* SIDEBAR */}
            {!isMobile && (
                <div style={{ width: "350px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div className="dashboard-card" style={{ padding: "15px" }}>
                        <h3 style={{ color: "white", fontSize: "14px", marginBottom: "10px" }}>Active Filters</h3>
                        <select onChange={(e) => setSelectedBranch(e.target.value)} className="w-full bg-[#111] text-white p-2 rounded-lg mb-2">
                            <option value="">All Branches</option>
                            {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select onChange={(e) => setSelectedBatch(e.target.value)} className="w-full bg-[#111] text-white p-2 rounded-lg">
                            <option value="">All Batches</option>
                            {availableBatches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>

                    <div className="dashboard-card" style={{ padding: "15px", flex: 1 }}>
                        <h3 style={{ color: "white", fontSize: "14px", marginBottom: "15px" }}>
                           {viewMode === "social" ? "Top Peer Matches" : "Recent Club Posts"}
                        </h3>
                    </div>
                </div>
            )}

            {/* Lead Dashboard FAB */}
            {userData?.role === "club_lead" && (
                <button 
                    onClick={() => navigate("/club-leader")}
                    className="fixed bottom-24 right-8 bg-blue-600 p-4 rounded-full shadow-2xl z-50 animate-pulse"
                >
                    <Settings2 color="white" />
                </button>
            )}
        </div>
    );
};

export default Discovery;