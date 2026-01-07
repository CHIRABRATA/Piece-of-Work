import React, { useState, useEffect } from "react";
import { useAuth } from "../context/mainContext";
import { db } from "../conf/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import {
  Check,
  X,
  MessageCircle,
  UserMinus,
  Search,
  Users as UsersIcon,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const processSnapshot = async (snapshot) => {
      const promises = snapshot.docs.map(async (requestDoc) => {
        const data = requestDoc.data();
        const targetId = data.from === user.uid ? data.to : data.from;

        try {
          const userSnap = await getDoc(doc(db, "users", targetId));
          const userData = userSnap.exists() ? userSnap.data() : {};
          return {
            id: requestDoc.id,
            ...data,
            targetId,
            name: userData.name || "Unknown",
            photo: userData.photoUrl || "",
            bio: userData.bio || "Student",
            isOnline: userData.isOnline || false,
          };
        } catch (e) {
          return { id: requestDoc.id, ...data, targetId, name: "Unknown" };
        }
      });

      return await Promise.all(promises);
    };

    // Pending 
    const qPending = query(collection(db, "friend_requests"), where("to", "==", user.uid), where("status", "==", "pending"));
    const unsubPending = onSnapshot(qPending, async (snap) => {
      const data = await processSnapshot(snap);
      setPendingRequests(data);
      setLoading(false);
    });

    // Accepted
    const qAcceptedTo = query(collection(db, "friend_requests"), where("to", "==", user.uid), where("status", "==", "accepted"));
    const qAcceptedFrom = query(collection(db, "friend_requests"), where("from", "==", user.uid), where("status", "==", "accepted"));

    const handleAcceptedUpdate = async () => {
        // Since we have two queries for accepted, we'll let onSnapshot trigger updates
        // To be more efficient in production, consider a single "friends" collection
    };

    const unsubTo = onSnapshot(qAcceptedTo, async (snap) => {
        const data = await processSnapshot(snap);
        setAcceptedRequests(prev => {
            const others = prev.filter(p => p.to !== user.uid);
            return [...others, ...data];
        });
    });

    const unsubFrom = onSnapshot(qAcceptedFrom, async (snap) => {
        const data = await processSnapshot(snap);
        setAcceptedRequests(prev => {
            const others = prev.filter(p => p.from !== user.uid);
            return [...others, ...data];
        });
    });

    return () => { unsubPending(); unsubTo(); unsubFrom(); };
  }, [user]);

  // ... (Keep handleAccept, handleReject, handleUnfriend, handleMessage same as your original)
  const handleAccept = async (req) => {
    try {
      await updateDoc(doc(db, "friend_requests", req.id), { status: "accepted" });
      const { createChat } = await import("../services/chatService");
      await createChat(user.uid, req.targetId);
    } catch (e) { setError("Failed to accept"); }
  };

  const handleReject = async (id) => await deleteDoc(doc(db, "friend_requests", id));
  const handleUnfriend = async (id) => window.confirm("Remove connection?") && await deleteDoc(doc(db, "friend_requests", id));
  
  const handleMessage = (friend) => {
    navigate("/chat", { state: { selectedUser: { uid: friend.targetId, name: friend.name, photoURL: friend.photo } } });
  };

  const toggleSelect = (friend) => {
    setSelectionMode(true);
    setSelectedIds(prev =>
      prev.includes(friend.targetId) ? prev.filter(id => id !== friend.targetId) : [...prev, friend.targetId]
    );
  };

  const createGroup = async () => {
    if (selectedIds.length < 1) return;
    try {
      const ref = await addDoc(collection(db, "chatroom"), {
        type: "group",
        name: `Group (${selectedIds.length + 1})`,
        participants: [user.uid, ...selectedIds],
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 3600000)
      });
      navigate("/chat", { state: { openChatId: ref.id } });
      setSelectionMode(false);
      setSelectedIds([]);
    } catch { setError("Group failed"); }
  };

  return (
    <div style={containerStyle}>
        <style>
            {`
            @media (max-width: 600px) {
                .request-row { flex-direction: column; gap: 15px; }
                .action-buttons { width: 100%; justify-content: flex-end; }
                .tab-text { font-size: 14px; }
            }
            `}
        </style>

      <div style={tabContainer}>
        <button 
            onClick={() => setActiveTab("pending")} 
            style={{...tabStyle, borderBottom: activeTab === "pending" ? "3px solid #ff2a6d" : "none", color: activeTab === "pending" ? "#ff2a6d" : "white"}}
        >
          Pending ({pendingRequests.length})
        </button>
        <button 
            onClick={() => setActiveTab("connections")} 
            style={{...tabStyle, borderBottom: activeTab === "connections" ? "3px solid #05d9e8" : "none", color: activeTab === "connections" ? "#05d9e8" : "white"}}
        >
          Connections
        </button>
      </div>

      <div style={searchBox}>
        <Search size={18} />
        <input placeholder={`Search ${activeTab}...`} style={searchInput} />
      </div>

      {loading && <div style={{textAlign: 'center', opacity: 0.6}}>Loading...</div>}

      {(activeTab === "pending" ? pendingRequests : acceptedRequests).map(req => (
        <div key={req.id} className="request-row" style={row}>
          <div style={userBox}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={req.photo || defaultAvatar} style={avatar} alt="profile" />
              {req.isOnline && <div style={onlineBadge} />}
            </div>
            <div style={{overflow: "hidden"}}>
              <div style={{ fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{req.name}</div>
              <div style={{ fontSize: 12, color: activeTab === 'pending' ? "#ff2a6d" : "#aaa" }}>
                {activeTab === 'pending' ? "Wants to connect" : req.bio}
              </div>
            </div>
          </div>

          <div className="action-buttons" style={{ display: "flex", gap: 8 }}>
            {activeTab === "pending" ? (
              <>
                <button onClick={() => handleAccept(req)} style={{...iconBtn, background: "#00e074"}}><Check size={20}/></button>
                <button onClick={() => handleReject(req.id)} style={{...iconBtn, background: "#ff2a6d"}}><X size={20}/></button>
              </>
            ) : (
              <>
                <button 
                    onClick={() => toggleSelect(req)} 
                    style={{...iconBtn, background: selectedIds.includes(req.targetId) ? "#05d9e8" : "#2a2b36"}}
                >
                    <Plus size={20} />
                </button>
                <button onClick={() => handleMessage(req)} style={{...iconBtn, background: "#05d9e8"}}><MessageCircle size={20}/></button>
                <button onClick={() => handleUnfriend(req.id)} style={{...iconBtn, background: "#2a2b36", color: "#ff2a6d"}}><UserMinus size={20}/></button>
              </>
            )}
          </div>
        </div>
      ))}

      {selectionMode && (
        <div style={groupBar}>
          <span style={{fontSize: 14}}>Selected: {selectedIds.length}</span>
          <div style={{display: 'flex', gap: 10}}>
            <button onClick={createGroup} disabled={selectedIds.length < 1} style={groupBtn}>Create</button>
            <button onClick={() => {setSelectionMode(false); setSelectedIds([])}} style={cancelBtn}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- RESPONSIVE STYLES ---------- */

const containerStyle = {
    padding: "20px 15px",
    maxWidth: "800px",
    margin: "auto",
    color: "white",
    minHeight: "100vh"
};

const tabContainer = {
    display: "flex", 
    gap: 10, 
    marginBottom: 20,
    borderBottom: "1px solid #2a2b36"
};

const tabStyle = {
    flex: 1,
    padding: "12px 5px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s"
};

const row = {
    background: "#161722",
    padding: "12px 15px",
    borderRadius: "12px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid #2a2b36"
};

const userBox = { display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 };
const avatar = { width: 45, height: 45, borderRadius: "50%", objectFit: "cover", background: "#2a2b36" };
const onlineBadge = { position: "absolute", bottom: 2, right: 2, width: 10, height: 10, background: "#00ff88", borderRadius: "50%", border: "2px solid #161722" };

const iconBtn = { 
    padding: "8px", 
    borderRadius: "8px", 
    border: "none", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    color: "white"
};

const searchBox = {
    background: "#0b0c15",
    padding: "10px 15px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    border: "1px solid #2a2b36"
};

const searchInput = {
    background: "none",
    border: "none",
    color: "white",
    outline: "none",
    width: "100%"
};

const groupBar = {
    position: "fixed",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#161722",
    padding: "12px 20px",
    borderRadius: "50px",
    display: "flex",
    alignItems: "center",
    gap: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    border: "1px solid #05d9e8",
    width: "90%",
    maxWidth: "400px",
    justifyContent: "space-between",
    zIndex: 100
};

const groupBtn = { background: "#05d9e8", border: "none", padding: "5px 15px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" };
const cancelBtn = { background: "none", border: "1px solid #ff2a6d", color: "#ff2a6d", padding: "5px 15px", borderRadius: "20px", cursor: "pointer" };

const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default Requests;