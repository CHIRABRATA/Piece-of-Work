import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileCard from "./ProfileCard";

const CardStack = ({ users, onSwipeDown, onSwipeUp }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX 1: Infinite Loop logic
  // If we run out of users, we just wrap around to the start (for the demo)
  const actualUserIndex = currentIndex % users.length;
  
  // We grab the next 3 users for the stack visual
  const visibleUsers = [
    users[actualUserIndex],
    users[(currentIndex + 1) % users.length],
    users[(currentIndex + 2) % users.length]
  ];

  const handleDragEnd = (event, info) => {
    const threshold = 50; // FIX 2: Sensitive Threshold (Easier to swipe)
    
    if (info.offset.y > threshold) {
      // Swipe Down
      onSwipeDown(visibleUsers[0]);
      setCurrentIndex((prev) => prev + 1);
    } else if (info.offset.y < -threshold) {
      // Swipe Up
      onSwipeUp(visibleUsers[0]);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "600px", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <AnimatePresence>
        {visibleUsers.reverse().map((user, index) => {
          // Logic: visibleUsers has 3 items. 
          // index 2 is the top card (because we reversed it)
          const isTop = index === 2; 
          
          return (
            <motion.div
              key={user.uid + currentIndex} // Unique key forces re-render for loop
              drag={isTop ? "y" : false} // Only top card is draggable
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.6} // FIX 3: Rubbery feel
              onDragEnd={handleDragEnd}
              
              // Initial State (Behind)
              initial={{ scale: 0.9, y: -50, opacity: 0 }}
              
              // Animate into position
              animate={{ 
                scale: isTop ? 1 : 0.95 - (2-index)*0.05, 
                y: isTop ? 0 : -30 * (2-index),
                zIndex: index, 
                opacity: 1 
              }}
              
              // Exit Animation (Swipe away)
              exit={{ 
                y: isTop ? (Math.random() > 0.5 ? 200 : -200) : 0, 
                opacity: 0, 
                transition: { duration: 0.2 }
              }}
              
              style={{
                position: "absolute",
                width: "370px", // FIX 4: Wider card for Desktop
                maxWidth: "90vw",
                height: "550px",
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