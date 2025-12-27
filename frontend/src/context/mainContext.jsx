import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../conf/firebase";
import { loginStudent, logoutStudent } from "../services/authService"; // Import the service

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    // 1. Listen for Auth State (Login/Logout)
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // 2. THE KILL SWITCH: Listen to this specific student's DB record
        const storedReg = localStorage.getItem("userRegNo");
        
        if (storedReg) {
          unsubscribeSnapshot = onSnapshot(doc(db, "valid_students", storedReg), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // If Admin sets is_registered: false, kick them out immediately
              if (data.is_registered === false) {
                 logout(); // Auto-logout
                 alert("Session Revoked by Admin.");
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

  // Wrapper functions to expose to components
  const login = async (email, password, regNo) => {
    await loginStudent(email, password, regNo);
  };

  const logout = async () => {
    await logoutStudent();
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};