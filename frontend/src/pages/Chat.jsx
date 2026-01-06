import React, { useState, useEffect, useRef } from "react";
import { Search, Send, MessageSquare, ArrowLeft, Loader2, UserPlus, Users, AlertCircle, Clock } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/mainContext";
import { db } from "../conf/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  getChatsListener,
  getMessagesListener,
  sendMessage,
  createChat,
  createGroupChat,
  getChatId
} from "../services/chatService";

const Chat = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [activeView, setActiveView] = useState("chats"); // "chats" or "friends"
  const [chats, setChats] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorStatus, setErrorStatus] = useState("");
  // Group Chat State
  const [groupName, setGroupName] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [memberMap, setMemberMap] = useState({});

  const messagesEndRef = useRef(null);

  // Resize Listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 1. Subscribe to user's chats
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = getChatsListener(user.uid, async (chatList) => {
      try {
        const enhancedChats = await Promise.all(chatList.map(async (chat) => {
          try {
            let name = "Unknown User";
            let photoUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

            if (chat.type === "group" || chat.type === "ephemeral_group") {
              name = chat.groupName || "Unnamed Group";
              // Default group icon
              photoUrl = "https://cdn-icons-png.flaticon.com/512/166/166258.png";
            } else {
              if (!chat.users || !Array.isArray(chat.users)) return null;

              const otherId = chat.users.find(uid => uid !== user.uid);

              if (otherId && typeof otherId === 'string' && otherId.trim()) {
                const userDoc = await getDoc(doc(db, "users", otherId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  name = userData.name || userData.Name || "Unknown User";
                  photoUrl = userData.photoUrl || userData.photoURL || photoUrl;
                }
              }
            }
            return { ...chat, name, photoUrl };
          } catch (innerErr) {
            console.error("Error processing chat item:", chat.id, innerErr);
            return null;
          }
        }));

        // Filter valid chats
        const validChats = enhancedChats.filter(c => c !== null);

        // Manual sort locally to avoid index requirement
        validChats.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
        setChats(validChats);
      } catch (err) {
        console.error("Error updating chats:", err);
        setErrorStatus("Failed to load chat list.");
      } finally {
        setInitialLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Fetch friends for the "Start Chat" view
  useEffect(() => {
    if (!user?.uid) return;

    const fetchFriends = async () => {
      try {
        const q = query(
          collection(db, "friend_requests"),
          where("status", "==", "accepted"),
          where("to", "==", user.uid)
        );
        const q2 = query(
          collection(db, "friend_requests"),
          where("status", "==", "accepted"),
          where("from", "==", user.uid)
        );

        const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
        const friendUids = new Set();
        [...snap1.docs, ...snap2.docs].forEach(d => {
          const data = d.data();
          friendUids.add(data.from === user.uid ? data.to : data.from);
        });

        const friendList = await Promise.all([...friendUids].map(async (uid) => {
          const uDoc = await getDoc(doc(db, "users", uid));
          if (uDoc.exists()) {
            const d = uDoc.data();
            return { uid, name: d.Name || d.name || "Unknown", photoUrl: d.photoURL || d.photoUrl || "" };
          }
          return { uid, name: "Unknown", photoUrl: "" };
        }));

        setFriends(friendList);
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    };

    fetchFriends();
  }, [user]);

  // 3. Subscribe to messages when a chat is selected
  useEffect(() => {
    if (!selectedChat?.id) {
      setMessages([]);
      return;
    }

    const unsubscribe = getMessagesListener(selectedChat.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // 3.5 Fetch Group Members for names
  useEffect(() => {
    if (selectedChat?.type === "group" && selectedChat.users) {
      const fetchMembers = async () => {
        const map = {};
        await Promise.all(selectedChat.users.map(async (uid) => {
          if (uid === user.uid) return;
          // Check friends explicitly first
          const friend = friends.find(f => f.uid === uid);
          if (friend) {
            map[uid] = friend;
          } else {
            const snap = await getDoc(doc(db, "users", uid));
            if (snap.exists()) {
              const d = snap.data();
              map[uid] = { name: d.name || d.Name || "User", photoUrl: d.photoURL || d.photoUrl };
            }
          }
        }));
        setMemberMap(map);
      };
      fetchMembers();
    } else {
      setMemberMap({});
    }
  }, [selectedChat, friends, user]);

  // 4. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Send
  const handleSend = async () => {
    if (!messageInput.trim() || !selectedChat?.id || !user?.uid) return;

    // Redundant guard for expiry
    if (selectedChat.type === "ephemeral_group" && selectedChat.expiresAt) {
      const expiresVal = selectedChat.expiresAt.toDate ? selectedChat.expiresAt.toDate() : new Date(selectedChat.expiresAt.seconds * 1000);
      if (new Date() > expiresVal) {
        setErrorStatus("This chat has expired.");
        return;
      }
    }

    try {
      await sendMessage(selectedChat.id, user.uid, messageInput);
      setMessageInput("");
    } catch (err) {
      console.error("Error sending message:", err);
      setErrorStatus("Message failed to send.");
      setTimeout(() => setErrorStatus(""), 3000);
    }
  };

  // Start Chat with a friend
  const startChatWithFriend = async (friend) => {
    try {
      setActionLoading(true);
      setErrorStatus("");
      console.log("Starting chat with:", friend.name);

      const chatId = await createChat(user.uid, friend.uid);

      const existing = chats.find(c => c.id === chatId);
      if (existing) {
        setSelectedChat(existing);
      } else {
        setSelectedChat({
          id: chatId,
          name: friend.name,
          photoUrl: friend.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          users: [user.uid, friend.uid]
        });
      }
      setActiveView("chats");
    } catch (err) {
      console.error("Error starting chat:", err);
      setErrorStatus("Could not open chat. Please check your connection.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create Group Chat
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setErrorStatus("Please enter a group name");
      return;
    }
    if (selectedGroupUsers.length < 2) {
      setErrorStatus("Select at least 2 friends");
      return;
    }

    try {
      setActionLoading(true);
      // Include self
      const allUserIds = [user.uid, ...selectedGroupUsers];

      const chatId = await createGroupChat(groupName, allUserIds, user.uid, isEphemeral);

      // Reset
      setGroupName("");
      setSelectedGroupUsers([]);
      setIsEphemeral(false);
      setActiveView("chats");
      // Optional: Auto-select new group (might need delay for listener to pick it up, or just wait for user)
    } catch (err) {
      console.error("Failed to create group", err);
      setErrorStatus("Failed to create group.");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleGroupUser = (uid) => {
    if (selectedGroupUsers.includes(uid)) {
      setSelectedGroupUsers(prev => prev.filter(id => id !== uid));
    } else {
      setSelectedGroupUsers(prev => [...prev, uid]);
    }
  };

  // Navigation from Requests
  useEffect(() => {
    const state = location.state;
    if (state?.selectedUser) {
      startChatWithFriend({ uid: state.selectedUser.uid, name: state.selectedUser.name, photoUrl: state.selectedUser.photoURL });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const showList = !isMobile || (isMobile && !selectedChat);
  const showChatWindow = !isMobile || (isMobile && selectedChat);

  const filteredItems = (activeView === "chats" ? chats : friends).filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: isMobile ? "flex" : "grid",
      gridTemplateColumns: "350px 1fr",
      gap: "20px",
      height: "calc(100vh - 120px)",
      width: "100%",
      overflow: "hidden"
    }}>

      {/* LEFT: Sidebar */}
      {showList && (
        <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>

          {/* Header */}
          <div style={{ padding: "20px 20px 10px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "15px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "900", color: "white", margin: 0, letterSpacing: "1px" }}>
                {activeView === "chats" ? "CHATS" : activeView === "create_group" ? "NEW GROUP" : "FRIENDS"}
              </h2>
              <div style={{ display: 'flex', gap: '5px' }}>
                {activeView !== "create_group" && (
                  <button
                    title="Create Group"
                    onClick={() => setActiveView("create_group")}
                    style={{ background: "transparent", border: "1px solid rgba(5, 217, 232, 0.5)", color: "#05d9e8", padding: "5px 8px", borderRadius: "10px", cursor: "pointer" }}
                  >
                    <Users size={14} />
                  </button>
                )}
                <button
                  disabled={actionLoading}
                  onClick={() => setActiveView(activeView === "chats" ? "friends" : "chats")}
                  style={{ background: "rgba(5, 217, 232, 0.1)", border: "1px solid #05d9e8", color: "#05d9e8", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", cursor: actionLoading ? "not-allowed" : "pointer", fontWeight: "700" }}
                >
                  {activeView === "chats" ? "+ New Chat" : "View Chats"}
                </button>
              </div>
            </div>

            {activeView !== "create_group" && (
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#6c757d" }} />
                <input
                  type="text"
                  placeholder={activeView === "chats" ? "Search chats..." : "Search friends..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 10px 10px 35px", color: "white", outline: "none", fontSize: "14px" }}
                />
              </div>
            )}
          </div>

          {/* Error Notification */}
          {errorStatus && (
            <div style={{ padding: "10px 20px", background: "rgba(255, 42, 109, 0.1)", color: "#ff2a6d", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertCircle size={14} /> {errorStatus}
            </div>
          )}

          {/* List Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
            {activeView === "create_group" ? (
              <div style={{ padding: "10px" }}>
                <input
                  type="text"
                  placeholder="Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", marginBottom: "20px", fontSize: "16px" }}
                />
                <div style={{ marginBottom: "10px", fontSize: "14px", color: "#aaa" }}>Select Members ({selectedGroupUsers.length}):</div>
                {friends.map(f => (
                  <div
                    key={f.uid}
                    onClick={() => toggleGroupUser(f.uid)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px", marginBottom: "5px", borderRadius: "8px", cursor: "pointer",
                      background: selectedGroupUsers.includes(f.uid) ? "rgba(5, 217, 232, 0.2)" : "transparent",
                      border: selectedGroupUsers.includes(f.uid) ? "1px solid #05d9e8" : "1px solid transparent"
                    }}
                  >
                    <img src={f.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: 30, height: 30, borderRadius: "50%" }} />
                    <span style={{ color: "white", flex: 1 }}>{f.name}</span>
                    {selectedGroupUsers.includes(f.uid) && <span style={{ color: "#05d9e8" }}>✓</span>}
                  </div>

                ))}

                <div style={{ marginTop: "15px", marginBottom: "5px", display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "10px" }}>
                  <input
                    type="checkbox"
                    id="ephemeralCheck"
                    checked={isEphemeral}
                    onChange={(e) => setIsEphemeral(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#05d9e8", cursor: "pointer" }}
                  />
                  <label htmlFor="ephemeralCheck" style={{ color: "white", fontSize: "14px", cursor: "pointer", flex: 1 }}>
                    <span style={{ fontWeight: "bold", color: "#05d9e8" }}>Ephemeral Mode</span>
                    <div style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>Disappears after 1 hour</div>
                  </label>
                </div>

                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || selectedGroupUsers.length < 2 || actionLoading}
                  style={{ width: "100%", padding: "12px", marginTop: "20px", borderRadius: "10px", background: "#05d9e8", border: "none", color: "black", fontWeight: "bold", cursor: "pointer", opacity: (!groupName.trim() || selectedGroupUsers.length < 2) ? 0.5 : 1 }}
                >
                  Create {isEphemeral ? "Ephemeral " : ""}Group
                </button>
              </div>
            ) : initialLoading && chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-blue-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <span className="text-sm">Loading contacts...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: "center", color: "#6c757d", marginTop: "40px", padding: "20px" }}>
                {activeView === "chats" ? (
                  <>
                    <MessageSquare size={48} style={{ margin: "0 auto 15px", opacity: 0.1 }} />
                    <p>No active conversations.</p>
                    <button onClick={() => setActiveView("friends")} style={{ color: "#05d9e8", fontSize: "14px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Message a friend</button>
                  </>
                ) : (
                  <>
                    <Users size={48} style={{ margin: "0 auto 15px", opacity: 0.1 }} />
                    <p>No friends found.</p>
                    <a href="/find" style={{ color: "#ff2a6d", fontSize: "14px", textDecoration: "underline" }}>Discover people</a>
                  </>
                )}
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id || item.uid}
                  onClick={() => {
                    if (actionLoading) return;
                    activeView === "chats" ? setSelectedChat(item) : startChatWithFriend(item);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: "15px", padding: "12px",
                    borderRadius: "16px", cursor: actionLoading ? "wait" : "pointer", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: selectedChat?.id === item.id ? "rgba(5, 217, 232, 0.15)" : "transparent",
                    marginBottom: "4px",
                    border: selectedChat?.id === item.id ? "1px solid rgba(5, 217, 232, 0.3)" : "1px solid transparent",
                    opacity: actionLoading ? 0.6 : 1
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <img src={item.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={item.name} style={{ width: "50px", height: "50px", borderRadius: "14px", objectFit: "cover", background: "#333" }} />
                    {item.lastMessage && <div style={{ position: "absolute", top: -2, right: -2, width: 12, height: 12, background: "#05d9e8", borderRadius: "50%", border: "3px solid #13141f" }} />}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: "700", fontSize: "16px", color: "white", marginBottom: "2px" }}>{item.name}</div>
                    <div style={{ fontSize: "13px", color: "#6c757d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeView === "chats" ? (item.lastMessage || "Start a conversation...") : "Tab to message"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Local Action Loader Overlay */}
          {actionLoading && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, backdropFilter: "blur(2px)" }}>
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-blue-400 mb-2" size={40} />
                <span className="text-white font-bold text-sm">Opening Chat...</span>
              </div>
            </div>
          )}
        </div>
      )
      }

      {/* RIGHT: Window */}
      {
        showChatWindow && (
          <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(13, 14, 27, 0.7)" }}>
            {selectedChat ? (
              <>
                {/* Header */}
                <div style={{ padding: "15px 25px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                    {isMobile && (
                      <button onClick={() => setSelectedChat(null)} style={{ background: "transparent", border: "none", color: "white", padding: 0, cursor: "pointer" }}>
                        <ArrowLeft size={24} />
                      </button>
                    )}
                    <img src={selectedChat.photoUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: "45px", height: "45px", borderRadius: "12px", objectFit: "cover" }} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px", color: "white", fontWeight: "800" }}>{selectedChat.name}</h3>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: "12px", color: "#00ff88", fontWeight: "600" }}>Real-time Enabled</span>
                      </div>
                      {selectedChat.type === "ephemeral_group" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", color: "#ff2a6d", fontSize: "11px", fontWeight: "700" }}>
                          <Clock size={12} />
                          <span>Expires: {selectedChat.expiresAt?.toDate ? selectedChat.expiresAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Soon"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Body */}
                <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", scrollbarWidth: "thin" }}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-30">
                      <MessageSquare size={80} className="mb-4" />
                      <p className="text-xl font-bold">Say Hello to {selectedChat.name}!</p>
                      <p className="text-sm">Start your conversation below</p>
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isMine = m.senderId === user?.uid;
                      const senderProfile = !isMine && selectedChat.type === "group" ? memberMap[m.senderId] : null;
                      return (
                        <div
                          key={m.id || idx}
                          style={{
                            alignSelf: isMine ? "flex-end" : "flex-start",
                            maxWidth: "70%",
                            background: isMine ? "linear-gradient(135deg, #05d9e8 0%, #00b4d8 100%)" : "rgba(255,255,255,0.08)",
                            color: isMine ? "black" : "white",
                            padding: "12px 18px",
                            borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                            boxShadow: isMine ? "0 4px 15px rgba(5, 217, 232, 0.2)" : "none",
                            position: "relative"
                          }}
                        >
                          {senderProfile && (
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#05d9e8", marginBottom: "4px" }}>
                              {senderProfile.name}
                            </div>
                          )}
                          <div style={{ fontSize: "15px", lineHeight: "1.4", fontWeight: isMine ? "600" : "400" }}>{m.text}</div>
                          <div style={{ fontSize: "10px", marginTop: "4px", textAlign: isMine ? "right" : "left", opacity: 0.5 }}>
                            {m.createdAt?.toMillis ? new Date(m.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area (Only if not expired) */}
                {!(selectedChat.type === "ephemeral_group" && selectedChat.expiresAt && (selectedChat.expiresAt.toDate ? selectedChat.expiresAt.toDate() : new Date(selectedChat.expiresAt.seconds * 1000)) < new Date()) && (
                  <div style={{ padding: "20px 30px", background: "rgba(0,0,0,0.3)" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "#0b0c15", padding: "8px 8px 8px 20px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)" }}>
                      <input
                        type="text"
                        placeholder="Message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSend()}
                        style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: "16px" }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={!messageInput.trim()}
                        style={{ width: "45px", height: "45px", borderRadius: "15px", background: messageInput.trim() ? "#05d9e8" : "#333", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                      >
                        <Send size={20} color={messageInput.trim() ? "black" : "#666"} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Expired Overlay/Blocker */}
                {selectedChat.type === "ephemeral_group" && selectedChat.expiresAt && (() => {
                  const expiresVal = selectedChat.expiresAt.toDate ? selectedChat.expiresAt.toDate() : new Date(selectedChat.expiresAt.seconds * 1000);
                  if (new Date() > expiresVal) {
                    return (
                      <div style={{ padding: "20px", background: "rgba(255, 42, 109, 0.1)", borderTop: "1px solid rgba(255, 42, 109, 0.3)", color: "#ff2a6d", textAlign: "center", fontWeight: "bold" }}>
                        <AlertCircle size={20} style={{ marginBottom: "5px", display: "inline-block", verticalAlign: "middle", marginRight: "8px" }} />
                        Cannot send message. This chat has expired.
                      </div>
                    );
                  }
                  return null;
                })()}
              </>
            ) : (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6c757d", padding: "40px", textAlign: "center" }}>
                <div style={{ position: "relative", marginBottom: "30px" }}>
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                  <MessageSquare size={100} style={{ opacity: 0.1, position: "relative" }} />
                </div>
                <h2 style={{ margin: "0 0 10px 0", color: "white", fontSize: "24px", fontWeight: "900" }}>Your Inbox</h2>
                <p style={{ opacity: 0.5, maxWidth: "300px", lineHeight: "1.6" }}>
                  Select a conversation from the left or start a new message with one of your connections.
                </p>
                <button
                  onClick={() => setActiveView("friends")}
                  className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all transform hover:scale-105"
                >
                  Start Messaging
                </button>
              </div>
            )
            }
          </div >
        )}
    </div >
  );
};

export default Chat;
