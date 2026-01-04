import React, { useState, useEffect, useRef } from "react";
import { Search, Hash, Send, MoreVertical, MessageSquare, ArrowLeft } from "lucide-react"; 
import { useLocation } from "react-router-dom"; 
import { useAuth } from "../context/mainContext";
import { db } from "../conf/firebase";
import { collection, query, where, onSnapshot, addDoc, getDoc, doc, serverTimestamp, orderBy, deleteDoc, getDocs } from "firebase/firestore";

const Chat = () => {
  const [activeTab, setActiveTab] = useState("private");
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]); 
  const [channels, setChannels] = useState([]); 
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [messages, setMessages] = useState([]);
  const expiryTimersRef = useRef({});

  const location = useLocation(); 

  // Listener for Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Subscribe to chatrooms where current user participates
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "chatroom"), where("participants", "array-contains", user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const priv = [];
      const grp = [];
      const now = Date.now();
      const timers = expiryTimersRef.current;
      const rooms = await Promise.all(snap.docs.map(async d => {
        const data = d.data();
        let name = data.name || "anonymous";
        let photoUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
        let online = true;
        if (data.type === "direct") {
          const otherId = (data.participants || []).find(p => p !== user.uid);
          if (otherId) {
            try {
              const sDoc = await getDoc(doc(db, "users", otherId));
              if (sDoc.exists()) {
                const s = sDoc.data();
                name = s.Name || name;
                photoUrl = s.photoURL || photoUrl;
              }
            } catch (e) { console.error(e); }
          }
        }
        return { id: d.id, ...data, name, photoUrl, online };
      }));
      rooms.forEach(r => {
        const expMs = r.expiresAt ? (r.expiresAt.toMillis ? r.expiresAt.toMillis() : r.expiresAt) : null;
        const isExpired = expMs ? expMs <= now : false;
        if (r.type === "group") {
          if (!isExpired) {
            grp.push({ id: r.id, name: r.name, topic: "Temporary group", photoUrl: "", online: true });
            if (expMs && !timers[r.id]) {
              const delay = Math.max(expMs - now, 0);
              timers[r.id] = setTimeout(async () => {
                try {
                  await deleteDoc(doc(db, "chatroom", r.id));
                } catch (e) { console.error(e); }
                delete timers[r.id];
              }, delay);
            }
          }
        } else {
          priv.push({ id: r.id, name: r.name, lastMsg: "Start a conversation", time: "Now", unread: 0, photoUrl: r.photoUrl, online: r.online });
        }
      });
      setContacts(priv);
      setChannels(grp);
    });
    return () => {
      unsub();
      const timers = expiryTimersRef.current;
      Object.values(timers).forEach(t => clearTimeout(t));
      expiryTimersRef.current = {};
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!selectedChat?.id) return;
    const q = query(collection(db, "chatroom", selectedChat.id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setMessages(list);
    });
    return () => unsub();
  }, [selectedChat]);

  const sendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !selectedChat?.id || !user?.uid) return;
    try {
      await addDoc(collection(db, "chatroom", selectedChat.id, "messages"), {
        senderUid: user.uid,
        text,
        createdAt: serverTimestamp()
      });
      setMessageInput("");
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!user?.uid) return;
    const interval = setInterval(async () => {
      try {
        const q = query(collection(db, "chatroom"), where("participants", "array-contains", user.uid));
        const snap = await getDocs(q);
        const now = Date.now();
        const deletions = snap.docs.filter(d => {
          const data = d.data();
          if (data.type !== "group") return false;
          const exp = data.expiresAt;
          const expMs = exp?.toMillis ? exp.toMillis() : exp;
          return expMs && expMs <= now;
        });
        await Promise.all(deletions.map(d => deleteDoc(doc(db, "chatroom", d.id))));
      } catch (e) { console.error(e); }
    }, 60000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  // Navigation handler: open chat by id or create/open direct
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    // CASE 1: Start Private Chat (create/open direct)
    if (state.selectedUser) {
        const newUser = state.selectedUser;
        (async () => {
          if (!user?.uid) return;
          let targetRoom = null;
          // Find existing direct room
          const q = query(collection(db, "chatroom"), where("participants", "array-contains", user.uid));
          const snap = await new Promise(resolve => onSnapshot(q, s => resolve(s)));
          snap.forEach(d => {
            const data = d.data();
            if (data.type === "direct" && Array.isArray(data.participants) && data.participants.includes(newUser.uid)) {
              targetRoom = { id: d.id, data };
            }
          });
          if (!targetRoom) {
            const docRef = await addDoc(collection(db, "chatroom"), {
              type: "direct",
              participants: [user.uid, newUser.uid],
              name: newUser.name,
              createdAt: serverTimestamp()
            });
            targetRoom = { id: docRef.id, data: { type: "direct", name: newUser.name } };
          }
          setSelectedChat({ id: targetRoom.id, name: newUser.name, photoUrl: newUser.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png", online: true });
        })();
    }

    // CASE 2: Open chatroom by id (group)
    if (state.openChatId) {
        (async () => {
          try {
            const dSnap = await getDoc(doc(db, "chatroom", state.openChatId));
            if (dSnap.exists()) {
              const r = dSnap.data();
              setSelectedChat({ id: dSnap.id, name: r.name || "Group", topic: "Temporary group", photoUrl: "", online: true });
              setActiveTab("public");
            }
          } catch (e) { console.error(e); }
        })();
    }
    
    // Clear state so refresh doesn't re-trigger
    window.history.replaceState({}, document.title);
  }, [location.state, user?.uid]);

  const chatList = activeTab === "private" ? contacts : channels;
  const showList = !isMobile || (isMobile && !selectedChat);
  const showChatWindow = !isMobile || (isMobile && selectedChat);

  return (
    <div style={{ 
        display: isMobile ? "flex" : "grid", 
        gridTemplateColumns: "320px 1fr", 
        gap: "20px", 
        height: "100%", 
        paddingBottom: "20px", 
        boxSizing: "border-box",
        width: "100%"
    }}>
      
      {/* --- LEFT COLUMN: LIST --- */}
      {showList && (
          <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, flex: 1, width: "100%" }}>
            
            {/* Tabs */}
            <div style={{ display: "flex", padding: "15px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <TabButton label="Private" isActive={activeTab === "private"} onClick={() => { setActiveTab("private"); setSelectedChat(null); }} />
                <div style={{ width: "10px" }} />
                <TabButton label="Public Channels" isActive={activeTab === "public"} onClick={() => { setActiveTab("public"); setSelectedChat(null); }} />
            </div>

            {/* Search */}
            <div style={{ padding: "15px" }}>
                  <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "10px" }}>
                      <Search size={18} color="#6c757d" style={{ marginRight: "10px" }} />
                      <input type="text" placeholder={`Search ${activeTab}...`} style={{ background: "transparent", border: "none", color: "white", outline: "none", width: "100%" }} />
                  </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "15px", display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
                {chatList.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => setSelectedChat(item)}
                        style={{ 
                            display: "flex", alignItems: "center", gap: "12px", padding: "12px", 
                            borderRadius: "12px", cursor: "pointer", transition: "all 0.2s",
                            background: selectedChat?.id === String(item.id) ? "rgba(5, 217, 232, 0.1)" : "rgba(255,255,255,0.03)",
                            border: selectedChat?.id === String(item.id) ? "1px solid #05d9e8" : "1px solid transparent"
                        }}
                    >
                        {activeTab === "private" ? (
                            <>
                              <div style={{ position: "relative", minWidth: "45px" }}>
                                 <img src={item.photoUrl} alt={item.name} style={{ width: "45px", height: "45px", borderRadius: "50%", objectFit: "cover" }} />
                                 {item.online && <div style={{ position: "absolute", bottom: 2, right: 2, width: 10, height: 10, background: "#00ff88", borderRadius: "50%", border: "2px solid #13141f" }} />}
                              </div>
                              <div style={{ flex: 1, overflow: "hidden" }}>
                                  <div style={{ fontWeight: "600", fontSize: "15px", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                                  <div style={{ fontSize: "13px", color: "#aaa" }}>{item.lastMsg}</div>
                              </div>
                            </>
                        ) : (
                            <>
                              <div style={{ minWidth: "45px", height: "45px", borderRadius: "12px", background: "rgba(255, 42, 109, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff2a6d" }}>
                                  <Hash size={24} />
                              </div>
                              <div>
                                 <div style={{ fontWeight: "600", fontSize: "15px", color: activeTab === 'public' ? '#ff2a6d' : 'white' }}>{item.name}</div>
                              </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* --- RIGHT COLUMN: CHAT WINDOW --- */}
      {showChatWindow && (
          <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, flex: 1, width: "100%" }}>
            {selectedChat ? (
              <>
                <div style={{ padding: "15px 25px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        
                        {/* BACK BUTTON (Mobile Only) */}
                        {isMobile && (
                            <button 
                                onClick={() => setSelectedChat(null)}
                                style={{ background: "transparent", border: "none", color: "white", padding: 0, cursor: "pointer", marginRight: "5px" }}
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}

                        {activeTab === 'private' ? (
                             <img src={selectedChat.photoUrl} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                        ) : (
                             <Hash size={24} color="#ff2a6d" />
                        )}
                        <div>
                            <h3 style={{ margin: 0, fontSize: "18px", color: "white" }}>{selectedChat.name}</h3>
                            <span style={{ fontSize: "12px", color: selectedChat.online ? "#00ff88" : "#aaa" }}>
                                {activeTab === 'private' ? (selectedChat.online ? 'Online' : 'Offline') : selectedChat.topic}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "20px", color: "#05d9e8" }}>
                        <MoreVertical size={20} style={{ cursor: "pointer" }} />
                    </div>
                </div>

                <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", color: "white", overflowY: "auto", minHeight: 0, gap: "10px" }}>
                      {messages.length === 0 ? (
                        <div style={{ textAlign: "center", marginTop: "auto", marginBottom: "auto", color: "#aaa" }}>
                          {activeTab === 'private' ? `Start conversation with ${selectedChat.name}` : `Welcome to #${selectedChat.name}`}
                        </div>
                      ) : (
                        messages.map(m => {
                          const mine = m.senderUid === user?.uid;
                          return (
                            <div key={m.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "70%", background: mine ? "#05d9e8" : "rgba(255,255,255,0.08)", color: mine ? "black" : "white", padding: "10px 14px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px" }}>
                              {m.text}
                            </div>
                          );
                        })
                      )}
                </div>

                <div style={{ padding: "20px", background: "rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center", background: "#0b0c15", padding: "5px 5px 5px 20px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <input 
                            type="text" placeholder="Type a message..."
                            value={messageInput} onChange={(e) => setMessageInput(e.target.value)}
                            style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: "15px" }} 
                        />
                        <button onClick={sendMessage} style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#05d9e8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Send size={20} color="black" />
                        </button>
                    </div>
                </div>
              </>
            ) : (
              // Empty State 
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6c757d" }}>
                  <MessageSquare size={60} style={{ marginBottom: "20px", opacity: 0.5 }} />
                  <h2 style={{ margin: 0, color: "white" }}>Select a Conversation</h2>
              </div>
            )}
          </div>
      )}
    </div>
  );
};

const TabButton = ({ label, isActive, onClick }) => (
    <button onClick={onClick} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s", background: isActive ? "rgba(255, 42, 109, 0.1)" : "transparent", color: isActive ? "#ff2a6d" : "#6c757d", borderBottom: isActive ? "3px solid #ff2a6d" : "3px solid transparent" }}>
        {label}
    </button>
)

export default Chat;
