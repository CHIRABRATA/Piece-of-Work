import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../conf/firebase";
import { loginStudent, logoutStudent } from "../services/Authservice.js";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // NEW: State to handle interactive messages like "Session Revoked! 😏"
  const [statusMsg, setStatusMsg] = useState(null); 

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const storedReg = localStorage.getItem("userRegNo");
        
        if (storedReg) {
          unsubscribeSnapshot = onSnapshot(doc(db, "valid_students", storedReg), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // THE KILL SWITCH: If Admin revokes access
              if (data.is_registered === false) {
                 setStatusMsg("Session Revoked by Admin! 😏"); // Interactive emoji msg
                 setTimeout(() => {
                    logout(); // Wait 2 seconds so they see the msg, then kick
                 }, 2000);
              }
            }
          });
        }
      } else {
        setUser(null);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // 1. IMPROVED LOGIN: Now ensures local storage is set for the listener
  const login = async (email, password, regNo) => {
    // Logic remains: check DB -> check registered -> Login
    const userCredential = await loginStudent(email, password, regNo);
    localStorage.setItem("userRegNo", regNo); // Crucial for the Snapshot listener
    return userCredential;
  };

  // 2. IMPROVED LOGOUT: Cleans up local data
  const logout = async () => {
    localStorage.removeItem("userRegNo");
    await logoutStudent();
  };

  const value = {
    user,
    loading,
    statusMsg, // Expose this so your UI can show the emoji alert
    setStatusMsg,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 3. INTERACTIVE OVERLAY: Shows if statusMsg is present */}
      {statusMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-red-500/20 border border-red-500 backdrop-blur-lg text-red-200 px-6 py-4 rounded-2xl shadow-2xl animate-bounce">
          {statusMsg}
        </div>
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
};