import React, { useState, useEffect } from "react";
import { BookOpen, Hash } from "lucide-react";

/**
 * Default "WhatsApp-style" Avatar
 */
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const ProfileCard = ({ user = {}, active }) => {
  // Use state to manage image source so we can switch to default on error
  const [imgSrc, setImgSrc] = useState(user.photoUrl || DEFAULT_AVATAR);

  // Reset image when user changes
  useEffect(() => {
    setImgSrc(user.photoUrl || DEFAULT_AVATAR);
  }, [user]);

  // Check if we are currently showing the default image
  const isDefault = imgSrc === DEFAULT_AVATAR;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: active
          ? "0px 0px 40px rgba(0, 212, 255, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2)"
          : "0px 10px 20px rgba(0,0,0,0.5)",
        border: active
          ? "1px solid rgba(0, 212, 255, 0.5)"
          : "1px solid rgba(255,255,255,0.1)",
        transition: "all 0.3s ease",
        backgroundColor: "#0a0b1e",
      }}
    >
      {/* ================= IMAGE LAYER ================= */}
      <img
        src={imgSrc}
        onError={() => setImgSrc(DEFAULT_AVATAR)}
        alt="profile"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          
          // --- FIX: Dynamic Object Fit & Background ---
          // If real photo: Cover the card.
          // If default: Contain (fit inside) and add padding.
          objectFit: isDefault ? "contain" : "cover",
          
          // Add padding for default icon so it doesn't touch edges
          padding: isDefault ? "50px" : "0px",
          
          // If default, show a Gray Background (WhatsApp style) to fill the empty space
          backgroundColor: isDefault ? "#cfd8dc" : "transparent",
          
          zIndex: 0,
        }}
      />

      {/* ================= DARK OVERLAY ================= */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(10,11,30,0) 50%, rgba(10,11,30,0.9) 100%)",
          zIndex: 1,
        }}
      />

      {/* ================= STATUS BADGE ================= */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          display: "flex",
          gap: 6,
          alignItems: "center",
          background: "rgba(0,0,0,0.6)",
          padding: "6px 12px",
          borderRadius: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            background: "#00ff88",
            borderRadius: "50%",
            boxShadow: "0 0 10px #00ff88",
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>
          Online
        </span>
      </div>

      {/* ================= CONTENT ================= */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          padding: "24px",
          boxSizing: "border-box",
          zIndex: 2,
        }}
      >
        {/* Name & Year */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: "800",
              color: "#fff",
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}
          >
            {user.name || "Student"}
          </h1>
          <span
            style={{
              fontSize: "20px",
              color: "#00d4ff",
              fontWeight: "600",
            }}
          >
            {user.year || ""}
          </span>
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          {user.regNo && (
            <Badge
              icon={<Hash size={14} />}
              text={user.regNo}
              color="#ff007f"
            />
          )}
          {user.major && (
            <Badge
              icon={<BookOpen size={14} />}
              text={user.major}
              color="#00d4ff"
            />
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(6px)",
              padding: "12px",
              borderRadius: "16px",
              borderLeft: "3px solid #ff007f",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "rgba(255,255,255,0.85)",
                lineHeight: "1.5",
                fontStyle: "italic",
              }}
            >
              “{user.bio}”
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= BADGE ================= */

const Badge = ({ icon, text, color }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background:
        color === "#ff007f"
          ? "rgba(255,0,127,0.15)"
          : "rgba(0,212,255,0.15)",
      padding: "6px 12px",
      borderRadius: "12px",
      border: `1px solid ${color}`,
      color,
      fontSize: "13px",
      fontWeight: "600",
    }}
  >
    {icon}
    {text}
  </div>
);

export default ProfileCard;