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
  Users as UsersIcon
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;

    const processSnapshot = async (snapshot, setState) => {
      const list = [];

      const promises = snapshot.docs.map(async (requestDoc) => {
        const data = requestDoc.data();
        const targetId = data.from === user.uid ? data.to : data.from;

        let name = "Unknown";
        let photo = "";
        let bio = "Student";
        let isOnline = false;

        try {
          const userSnap = await getDoc(doc(db, "users", targetId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            name = u.name || "Unknown";
            photo = u.photoUrl || "";
            bio = u.bio || "Student";
            isOnline = u.isOnline || false;
          }
        } catch (e) {
          console.error(e);
        }

        list.push({
          id: requestDoc.id,
          ...data,
          targetId,
          name,
          photo,
          bio,
          isOnline
        });
      });

      await Promise.all(promises);
      setState(list);
      setLoading(false);
    };

    // Pending (incoming only)
    const qPending = query(
      collection(db, "friend_requests"),
      where("to", "==", user.uid),
      where("status", "==", "pending")
    );

    // Accepted (incoming)
    const qAcceptedTo = query(
      collection(db, "friend_requests"),
      where("to", "==", user.uid),
      where("status", "==", "accepted")
    );

    // Accepted (outgoing)
    const qAcceptedFrom = query(
      collection(db, "friend_requests"),
      where("from", "==", user.uid),
      where("status", "==", "accepted")
    );

    const unsubPending = onSnapshot(qPending, snap =>
      processSnapshot(snap, setPendingRequests)
    );

    const unsubAcceptedTo = onSnapshot(qAcceptedTo, snap =>
      processSnapshot(snap, setAcceptedRequests)
    );

    const unsubAcceptedFrom = onSnapshot(qAcceptedFrom, snap =>
      processSnapshot(snap, setAcceptedRequests)
    );

    return () => {
      unsubPending();
      unsubAcceptedTo();
      unsubAcceptedFrom();
    };
  }, [user]);

  const handleAccept = async (req) => {
    try {
      await updateDoc(doc(db, "friend_requests", req.id), {
        status: "accepted"
      });

      const { createChat } = await import("../services/chatService");
      await createChat(user.uid, req.targetId);
    } catch (e) {
      setError("Failed to accept request");
      setTimeout(() => setError(""), 2000);
    }
  };

  const handleReject = async (id) => {
    await deleteDoc(doc(db, "friend_requests", id));
  };

  const handleUnfriend = async (id) => {
    if (window.confirm("Remove this connection?")) {
      await deleteDoc(doc(db, "friend_requests", id));
    }
  };

  const handleMessage = (friend) => {
    navigate("/chat", {
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

  const addToGroup = () => {
    if (!modalTarget) return;
    setSelectionMode(true);
    setSelectedIds(prev =>
      prev.includes(modalTarget.targetId)
        ? prev
        : [...prev, modalTarget.targetId]
    );
    closeContextMenu();
  };

  const toggleSelect = (friend) => {
    if (!selectionMode) return openContextMenu(friend);
    setSelectedIds(prev =>
      prev.includes(friend.targetId)
        ? prev.filter(id => id !== friend.targetId)
        : [...prev, friend.targetId]
    );
  };

  const createGroup = async () => {
    if (selectedIds.length < 2) return;

    try {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const ref = await addDoc(collection(db, "chatroom"), {
        type: "group",
        name: `Temp Group (${selectedIds.length})`,
        participants: [user.uid, ...selectedIds],
        createdAt: serverTimestamp(),
        expiresAt
      });

      navigate("/chat", { state: { openChatId: ref.id } });
      setSelectionMode(false);
      setSelectedIds([]);
    } catch {
      setError("Failed to create group");
      setTimeout(() => setError(""), 2000);
    }
  };

  const iconSize = { width: 20, height: 20 };

  return (
    <div style={{ padding: 30, maxWidth: 800, margin: "auto", color: "white" }}>
      <div style={{ display: "flex", gap: 15, marginBottom: 25 }}>
        <button onClick={() => setActiveTab("pending")} style={tabStyle}>
          Pending ({pendingRequests.length})
        </button>
        <button onClick={() => setActiveTab("connections")} style={tabStyle}>
          Connections
        </button>
      </div>

      <div style={searchBox}>
        <Search size={18} /> Search {activeTab}...
      </div>

      {loading && <div style={info}>Loading...</div>}
      {error && <div style={errorBox}>{error}</div>}

      {activeTab === "pending" &&
        pendingRequests.map(req => (
          <div key={req.id} style={row}>
            <div style={userBox}>
              <div style={{ position: "relative" }}>
                <img src={req.photo || defaultAvatar} style={avatar} />
                {req.isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", background: "#00ff88", borderRadius: "50%", border: "2px solid #161722" }} />}
              </div>
              <div>
                <b>{req.name}</b>
                <div style={{ fontSize: 12, color: "#ff2a6d" }}>
                  Wants to connect
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleAccept(req)} style={acceptBtn}>
                <Check style={iconSize} />
              </button>
              <button onClick={() => handleReject(req.id)} style={rejectBtn}>
                <X style={iconSize} />
              </button>
            </div>
          </div>
        ))}

      {activeTab === "connections" &&
        acceptedRequests.map(req => (
          <div key={req.id} style={row}>
            <div style={userBox}>
              <div style={{ position: "relative" }}>
                <img src={req.photo || defaultAvatar} style={avatar} />
                {req.isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", background: "#00ff88", borderRadius: "50%", border: "2px solid #161722" }} />}
              </div>
              <div>
                <b>{req.name}</b>
                <div style={{ fontSize: 12, color: "#aaa" }}>{req.bio}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => toggleSelect(req)} style={iconBtn}>
                <UsersIcon size={20} />
              </button>
              <button onClick={() => handleMessage(req)} style={msgBtn}>
                <MessageCircle size={20} />
              </button>
              <button onClick={() => handleUnfriend(req.id)} style={removeBtn}>
                <UserMinus size={20} />
              </button>
            </div>
          </div>
        ))}

      {selectionMode && (
        <div style={groupBar}>
          Selected: {selectedIds.length}
          <button onClick={createGroup} disabled={selectedIds.length < 2}>
            Create Group
          </button>
          <button onClick={() => setSelectionMode(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

/* ---------- STYLES ---------- */

const defaultAvatar =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const tabStyle = {
  flex: 1,
  padding: 14,
  borderRadius: 12,
  fontWeight: "bold",
  cursor: "pointer"
};

const row = {
  background: "#161722",
  padding: 15,
  borderRadius: 16,
  marginBottom: 12,
  display: "flex",
  justifyContent: "space-between"
};

const userBox = { display: "flex", gap: 15, alignItems: "center" };
const avatar = { width: 50, height: 50, borderRadius: "50%" };

const acceptBtn = { background: "#00e074", borderRadius: 10 };
const rejectBtn = { background: "#ff2a6d", borderRadius: 10 };
const msgBtn = { background: "#05d9e8", borderRadius: 10 };
const removeBtn = { background: "#2a2b36", borderRadius: 10, color: "red" };
const iconBtn = { background: "#2a2b36", borderRadius: 10 };

const searchBox = {
  background: "#0b0c15",
  padding: 12,
  borderRadius: 12,
  display: "flex",
  gap: 10,
  marginBottom: 20
};

const groupBar = {
  position: "fixed",
  bottom: 20,
  left: "50%",
  transform: "translateX(-50%)",
  background: "#0b0c15",
  padding: 12,
  borderRadius: 14,
  display: "flex",
  gap: 10
};

const info = { color: "#aaa", marginBottom: 10 };
const errorBox = { background: "#ff2a6d", padding: 10 };

export default Requests;
