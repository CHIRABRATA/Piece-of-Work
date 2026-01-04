import React, { useState, useEffect } from "react";
import { useAuth } from "../context/mainContext";
import { db } from "../conf/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { Check, X, MessageCircle, UserMinus, Search, User } from "lucide-react"; // Changed Trash2 to UserMinus
import { useNavigate } from "react-router-dom";

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // 1. Pending Requests (Incoming)
    const qPending = query(
        collection(db, "friend_requests"), 
        where("to", "==", user.uid), 
        where("status", "==", "pending")
    );

    // 2. Accepted Requests (Incoming)
    const qAccepted = query(
        collection(db, "friend_requests"), 
        where("to", "==", user.uid), 
        where("status", "==", "accepted")
    );

    const unsubPending = onSnapshot(qPending, (snap) => processSnapshot(snap, setPendingRequests));
    const unsubAccepted = onSnapshot(qAccepted, (snap) => processSnapshot(snap, setAcceptedRequests));

    const processSnapshot = async (snapshot, setState) => {
      const list = [];
      const promises = snapshot.docs.map(async (requestDoc) => {
        const reqData = requestDoc.data();
        const targetId = reqData.from === user.uid ? reqData.to : reqData.from;

        let name = "Unknown";
        let photo = "";
        let bio = "";

        try {
            const docSnap = await getDoc(doc(db, "users", targetId));
            if (docSnap.exists()) {
                const d = docSnap.data();
                name = d.Name || "Unknown";
                photo = d.photoURL || "";
                bio = d.BIO || "Student";
            }
        } catch (e) { console.error(e); }

        list.push({ id: requestDoc.id, ...reqData, targetId, name, photo, bio });
      });

      await Promise.all(promises);
      setState(list);
      setLoading(false);
    };

    return () => { unsubPending(); unsubAccepted(); };
  }, [user]);

  const handleAccept = async (id) => await updateDoc(doc(db, "friend_requests", id), { status: "accepted" });
  const handleReject = async (id) => await deleteDoc(doc(db, "friend_requests", id));
  
  const handleUnfriend = async (id) => {
      if(window.confirm("Remove this connection?")) await deleteDoc(doc(db, "friend_requests", id));
  };

  const handleMessage = (friend) => {
      navigate('/chat', { 
          state: { 
              selectedUser: {
                  uid: friend.targetId,
                  name: friend.name,
                  photoURL: friend.photo
              }
          } 
      });
  };

  // --- FORCE ICON SIZE STYLE ---
  const iconSize = { width: "20px", height: "20px", minWidth: "20px", flexShrink: 0 };

  return (
    <div style={{ padding: "30px", height: "100%", maxWidth: "800px", margin: "0 auto", color: "white", fontFamily: "sans-serif" }}>
      
      {/* TABS */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
        <button onClick={() => setActiveTab("pending")} style={{ ...tabStyle, background: activeTab === "pending" ? "#ff2a6d" : "rgba(255,255,255,0.05)", color: "white" }}>
            Pending Requests ({pendingRequests.length})
        </button>
        <button onClick={() => setActiveTab("connections")} style={{ ...tabStyle, background: activeTab === "connections" ? "#05d9e8" : "rgba(255,255,255,0.05)", color: activeTab === "connections" ? "black" : "white" }}>
            My Connections
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: "20px", background: "#0b0c15", padding: "12px 15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", color: "#666", display: "flex", alignItems: "center", gap: "10px" }}>
        <Search style={{ width: "20px", height: "20px" }} />
        <span>Search {activeTab}...</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        
        {/* PENDING LIST */}
        {activeTab === "pending" && (
            pendingRequests.length === 0 ? <div style={emptyStyle}>No new requests.</div> : 
            pendingRequests.map(req => (
                <div key={req.id} style={rowStyle}>
                    <div style={userGroupStyle}>
                        <img src={req.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={avatarStyle} />
                        <div>
                            <div style={nameStyle}>{req.name}</div>
                            <div style={{ fontSize: "13px", color: "#ff2a6d" }}>Wants to connect</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => handleAccept(req.id)} style={acceptBtnStyle} title="Accept">
                            <Check style={iconSize} strokeWidth={3} />
                        </button>
                        <button onClick={() => handleReject(req.id)} style={rejectBtnStyle} title="Reject">
                            <X style={iconSize} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            ))
        )}

        {/* CONNECTIONS LIST */}
        {activeTab === "connections" && (
            acceptedRequests.length === 0 ? <div style={emptyStyle}>No connections yet.</div> : 
            acceptedRequests.map(req => (
                <div key={req.id} style={rowStyle}>
                    <div style={userGroupStyle}>
                        <img src={req.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={avatarStyle} />
                        <div>
                            <div style={nameStyle}>{req.name}</div>
                            <div style={bioStyle}>{req.bio}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => handleMessage(req)} style={messageBtnStyle} title="Message">
                            <MessageCircle style={iconSize} strokeWidth={2.5} />
                        </button>
                        
                        {/* UNFRIEND BUTTON (UserMinus) */}
                        <button onClick={() => handleUnfriend(req.id)} style={unfriendBtnStyle} title="Unfriend">
                            <UserMinus style={iconSize} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

// --- STYLES ---
const tabStyle = { flex: 1, padding: "14px", borderRadius: "12px", fontWeight: "bold", fontSize: "15px", cursor: "pointer", border: "none", transition: "0.2s" };
const rowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#161722", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" };
const userGroupStyle = { display: "flex", alignItems: "center", gap: "15px" };
const avatarStyle = { width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" };
const nameStyle = { fontWeight: "bold", fontSize: "16px", color: "white" };
const bioStyle = { fontSize: "13px", color: "#aaa", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const emptyStyle = { textAlign: "center", padding: "60px", color: "#555", fontStyle: "italic" };

// BUTTONS
const baseBtn = { border: "none", borderRadius: "12px", width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

const acceptBtnStyle = { ...baseBtn, background: "#00E074", color: "black", boxShadow: "0 4px 12px rgba(0, 224, 116, 0.3)" };
const rejectBtnStyle = { ...baseBtn, background: "#FF2A6D", color: "white", boxShadow: "0 4px 12px rgba(255, 42, 109, 0.3)" };
const messageBtnStyle = { ...baseBtn, background: "#05D9E8", color: "black", boxShadow: "0 4px 12px rgba(5, 217, 232, 0.3)" };
const unfriendBtnStyle = { ...baseBtn, background: "#2A2B36", border: "1px solid #FF4444", color: "#FF4444" };

export default Requests;