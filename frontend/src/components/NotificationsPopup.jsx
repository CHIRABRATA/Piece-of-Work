import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../conf/firebase";
import { useAuth } from "../context/mainContext";
import { useNavigate } from "react-router-dom";
import { Bell, X } from "lucide-react";

const NotificationPopup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
        collection(db, "friend_requests"), 
        where("to", "==", user.uid), 
        where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
            setCount(snap.size);
            setShow(true);
        } else {
            setShow(false);
        }
    });

    return () => unsub();
  }, [user]);

  if (!show) return null;

  return (
    <div style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        background: "rgba(10, 10, 20, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(5, 217, 232, 0.3)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(5, 217, 232, 0.2)",
        padding: "16px 20px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        gap: "15px",
        zIndex: 1000,
        minWidth: "300px",
        animation: "slideIn 0.3s ease-out"
    }}>
        {/* ICON */}
        <div style={{
            background: "linear-gradient(135deg, #05d9e8 0%, #0056ff 100%)",
            width: "40px", height: "40px", borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 10px rgba(5, 217, 232, 0.3)"
        }}>
            <Bell size={20} color="white" />
        </div>

        {/* TEXT CONTENT (Clickable) */}
        <div 
            onClick={() => navigate("/requests")} 
            style={{ flex: 1, cursor: "pointer" }}
        >
            <h4 style={{ color: "white", margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700" }}>New Connection!</h4>
            <p style={{ color: "#aaa", margin: 0, fontSize: "12px" }}>
                You have <span style={{ color: "#05d9e8", fontWeight: "bold" }}>{count}</span> pending request{count > 1 ? 's' : ''}.
            </p>
        </div>

        {/* CLOSE BUTTON */}
        <button 
            onClick={(e) => { e.stopPropagation(); setShow(false); }}
            style={{
                background: "transparent",
                border: "none",
                color: "#666",
                cursor: "pointer",
                padding: "5px",
                display: "flex",
                alignItems: "center",
                transition: "color 0.2s"
            }}
            onMouseOver={(e) => e.target.style.color = "white"}
            onMouseOut={(e) => e.target.style.color = "#666"}
        >
            <X size={18} />
        </button>
    </div>
  );
};

export default NotificationPopup;