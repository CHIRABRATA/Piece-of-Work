import React, { useState, useEffect } from "react";
import { Search, Hash, Send, MoreVertical, MessageSquare, ArrowLeft } from "lucide-react"; 
import { useLocation } from "react-router-dom"; 

// Data
const INITIAL_CONTACTS = [
  { id: "p1", name: "Aisha Rahman", lastMsg: "Are you going to the hackathon?", time: "10:30 AM", unread: 2, photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80", online: true },
  { id: "p2", name: "Rahul Verma", lastMsg: "Yeah, the code is pushed.", time: "Yesterday", unread: 0, photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80", online: false },
];

const INITIAL_PUBLIC_CHANNELS = [
  { id: "c1", name: "General Campus", topic: "Everything campus related" },
  { id: "c2", name: "Tech Talk", topic: "Code, AI & Hackathons" },
  { id: "c3", name: "Events & Fests", topic: "Weekend plans?" },
];

const Chat = () => {
  const [activeTab, setActiveTab] = useState("private");
  const [contacts, setContacts] = useState(INITIAL_CONTACTS); 
  const [channels, setChannels] = useState(INITIAL_PUBLIC_CHANNELS); 
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const location = useLocation(); 

  // Listener for Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- FIXED NAVIGATION HANDLER ---
  useEffect(() => {
    const state = location.state;
    if (!state) return;

    // CASE 1: Start Private Chat (from Find/Requests)
    if (state.selectedUser) {
        const newUser = state.selectedUser;
        setActiveTab("private");

        // Create the chat object format
        const chatObject = {
            id: String(newUser.uid), // Ensure ID matches what you send
            name: newUser.name,
            lastMsg: "Start a conversation",
            time: "Now",
            unread: 0,
            photoUrl: newUser.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            online: true 
        };

        // Update contacts list if not already there
        setContacts(prev => {
            const exists = prev.find(c => String(c.id) === String(newUser.uid));
            if (exists) return prev; 
            return [chatObject, ...prev];
        });

        // FORCE OPEN THE CHAT
        setSelectedChat(chatObject);
    }

    // CASE 2: Join Public Channel
    if (state.joinPublicChannel) {
        const group = state.joinPublicChannel;
        setActiveTab("public");
        setChannels(prev => {
            const exists = prev.find(c => c.id === group.id);
            if (exists) return prev;
            return [...prev, group];
        });
        setSelectedChat(group);
    }
    
    // Clear state so refresh doesn't re-trigger
    window.history.replaceState({}, document.title);
  }, [location.state]);

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

                <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "#666", overflowY: "auto", minHeight: 0 }}>
                      <div style={{ textAlign: "center", marginTop: "auto", marginBottom: "auto" }}>
                            <p style={{ color: "#aaa" }}>
                                {activeTab === 'private' ? `Start conversation with ${selectedChat.name}` : `Welcome to #${selectedChat.name}`}
                            </p>
                      </div>
                </div>

                <div style={{ padding: "20px", background: "rgba(0,0,0,0.2)" }}>
                    <div style={{ display: "flex", gap: "15px", alignItems: "center", background: "#0b0c15", padding: "5px 5px 5px 20px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <input 
                            type="text" placeholder="Type a message..."
                            value={messageInput} onChange={(e) => setMessageInput(e.target.value)}
                            style={{ flex: 1, background: "transparent", border: "none", color: "white", outline: "none", fontSize: "15px" }} 
                        />
                        <button style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#05d9e8", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
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