import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileCard from "./ProfileCard";

const CardStack = ({ users, onSwipeDown, onSwipeUp }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle Resize to switch card sizes dynamically
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Infinite Loop logic
  const actualUserIndex = currentIndex % users.length;
  
  // Grab the next 3 users for the stack visual
  const visibleUsers = [
    users[actualUserIndex],
    users[(currentIndex + 1) % users.length],
    users[(currentIndex + 2) % users.length]
  ];

  const handleDragEnd = (event, info) => {
    const threshold = 50; 
    
    if (info.offset.y > threshold) {
      onSwipeDown(visibleUsers[0]);
      setCurrentIndex((prev) => prev + 1);
    } else if (info.offset.y < -threshold) {
      onSwipeUp(visibleUsers[0]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div style={{ 
        position: "relative", 
        width: "100%", 
        // Adjust container height based on screen size so it doesn't push layout
        height: isMobile ? "500px" : "600px", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
    }}>
      <AnimatePresence>
        {visibleUsers.reverse().map((user, index) => {
          const isTop = index === 2; 
          
          return (
            <motion.div
              key={user.uid + currentIndex}
              drag={isTop ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={handleDragEnd}
              
              initial={{ scale: 0.9, y: -50, opacity: 0 }}
              
              animate={{ 
                scale: isTop ? 1 : 0.95 - (2-index)*0.05, 
                y: isTop ? 0 : -30 * (2-index),
                zIndex: index, 
                opacity: 1 
              }}
              
              exit={{ 
                y: isTop ? (Math.random() > 0.5 ? 200 : -200) : 0, 
                opacity: 0, 
                transition: { duration: 0.2 }
              }}
              
              style={{
                position: "absolute",
                // --- RESPONSIVE CARD SIZES ---
                // Desktop: 370px x 550px (Your original perfect size)
                // Mobile:  320px x 480px (Smaller to prevent overflow)
                width: isMobile ? "320px" : "370px",
                height: isMobile ? "480px" : "550px",
                maxWidth: "90vw", // Safety net for very small screens
                margin : "20px",
                cursor: isTop ? "grab" : "default",
              }}
            >
              <ProfileCard user={user} active={isTop} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default CardStack;