import React, { useState, useEffect } from "react";
import { useAuth } from "../context/mainContext";
import { db } from "../conf/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { Check, X, MessageCircle, UserMinus, Search, Users as UsersIcon, Clock } from "lucide-react"; // Changed Trash2 to UserMinus
import { useNavigate } from "react-router-dom";

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Context menu / modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(null);

  // Group selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Temporary groups persisted in Firestore; no local list

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

  const openContextMenu = (friend) => {
    setModalTarget(friend);
    setModalOpen(true);
  };

  const closeContextMenu = () => {
    setModalOpen(false);
    setModalTarget(null);
  };

  const startIndividualMessage = () => {
    if (!modalTarget) return;
    try {
      handleMessage(modalTarget);
    } catch {
      setError("Failed to open chat");
      setTimeout(() => setError(""), 2000);
    } finally {
      closeContextMenu();
    }
  };

  const addToGroup = () => {
    if (!modalTarget) return;
    setSelectionMode(true);
    setSelectedIds(prev => {
      if (prev.includes(modalTarget.targetId)) return prev;
      return [...prev, modalTarget.targetId];
    });
    closeContextMenu();
  };

  const toggleSelect = (friend) => {
    if (!selectionMode) return openContextMenu(friend);
    setSelectedIds(prev => prev.includes(friend.targetId) ? prev.filter(id => id !== friend.targetId) : [...prev, friend.targetId]);
  };

  const createGroup = () => {
    if (selectedIds.length < 2) return;
    (async () => {
      try {
        const name = `Temp Group (${selectedIds.length})`;
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        const docRef = await addDoc(collection(db, "chatroom"), {
          type: "group",
          name,
          participants: [user.uid, ...selectedIds],
          createdAt: serverTimestamp(),
          expiresAt: expires
        });
        navigate('/chat', { state: { openChatId: docRef.id } });
        setSelectionMode(false);
        setSelectedIds([]);
      } catch {
        setError("Failed to create group");
        setTimeout(() => setError(""), 2000);
      }
    })();
  };

  // Group expiration handled in Chat by filtering expiresAt

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

      {loading && (
        <div role="status" aria-live="polite" style={{ background: "rgba(255,255,255,0.06)", color: "#aaa", padding: "10px", borderRadius: "10px", marginBottom: "10px" }}>
          Loading...
        </div>
      )}
      {error && (
        <div role="status" aria-live="polite" style={{ background: "#ff2a6d", color: "white", padding: "10px", borderRadius: "10px", marginBottom: "10px" }}>
          {error}
        </div>
      )}

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
            <>
              {/* Slider view */}
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }} aria-label="Connections slider" role="list">
                {acceptedRequests.map(req => (
                  <button
                    key={`${req.id}-slide`}
                    onClick={() => toggleSelect(req)}
                    aria-label={`Open actions for ${req.name}`}
                    style={{
                      minWidth: "140px",
                      background: selectedIds.includes(req.targetId) ? "rgba(5, 217, 232, 0.15)" : "rgba(255,255,255,0.06)",
                      border: selectedIds.includes(req.targetId) ? "1px solid #05d9e8" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "16px",
                      padding: "12px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <img src={req.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={req.name} style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.1)" }} />
                      {selectionMode && selectedIds.includes(req.targetId) && (
                        <div style={{ position: "absolute", right: -4, bottom: -4, background: "#05d9e8", width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "black", fontWeight: "900", border: "2px solid #13141f" }}>
                          ✓
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{req.name}</div>
                    <div style={{ fontSize: "11px", color: "#aaa" }}>{req.bio}</div>
                  </button>
                ))}
              </div>

              {/* Vertical list with actions */}
              {acceptedRequests.map(req => (
                <div key={req.id} style={{ ...rowStyle, position: "relative" }}>
                    <div style={userGroupStyle}>
                        <img src={req.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={avatarStyle} alt={req.name} />
                        <div>
                            <div style={nameStyle}>{req.name}</div>
                            <div style={bioStyle}>{req.bio}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => openContextMenu(req)} style={{ ...messageBtnStyle, background: "#2A2B36", color: "white" }} title="Actions" aria-haspopup="dialog">
                            <UsersIcon style={iconSize} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleMessage(req)} style={messageBtnStyle} title="Message">
                            <MessageCircle style={iconSize} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => handleUnfriend(req.id)} style={unfriendBtnStyle} title="Unfriend">
                            <UserMinus style={iconSize} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
              ))}

              {/* Create Group Floating Bar */}
              {selectionMode && (
                <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#0b0c15", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "12px", zIndex: 50 }}>
                  <span style={{ fontSize: "12px", color: "#aaa" }}>Selected: {selectedIds.length}</span>
                  <button onClick={() => setSelectionMode(false)} style={{ ...baseBtn, width: "auto", height: "36px", background: "#2A2B36", color: "white", padding: "0 12px" }}>Cancel</button>
                  <button onClick={createGroup} disabled={selectedIds.length < 2} style={{ ...baseBtn, width: "auto", height: "36px", background: selectedIds.length >= 2 ? "#05D9E8" : "rgba(5,217,232,0.2)", color: selectedIds.length >= 2 ? "black" : "#aaa", padding: "0 12px", fontWeight: "700" }}>
                    Create Group
                  </button>
                </div>
              )}

              {/* Temporary groups now persisted and shown in Chat; no local list */}
            </>
        )}
      </div>

      {/* Context Menu Modal */}
      {modalOpen && modalTarget && (
        <div role="dialog" aria-modal="true" aria-label="Actions" onClick={closeContextMenu} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "90%", maxWidth: "360px", background: "#0b0c15", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <img src={modalTarget.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={modalTarget.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
              <div>
                <div style={{ color: "white", fontWeight: "800" }}>{modalTarget.name}</div>
                <div style={{ color: "#aaa", fontSize: "12px" }}>{modalTarget.bio}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={startIndividualMessage} style={{ ...baseBtn, width: "100%", height: "42px", background: "#05D9E8", color: "black", fontWeight: "800" }}>
                Individual Message
              </button>
              <button onClick={addToGroup} style={{ ...baseBtn, width: "100%", height: "42px", background: "#ff2a6d", color: "white", fontWeight: "800" }}>
                Add to Group
              </button>
              <button onClick={closeContextMenu} style={{ ...baseBtn, width: "100%", height: "38px", background: "rgba(255,255,255,0.06)", color: "white" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
