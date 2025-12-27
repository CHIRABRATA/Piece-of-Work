// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../conf/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { loginStudent, logoutStudent } from "../services/Authservice"

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRegNo, setUserRegNo] = useState(localStorage.getItem("userRegNo")); // Persist RegNo
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        if (userRegNo) {
          unsubscribeSnapshot = onSnapshot(doc(db, "valid_students", userRegNo), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.is_registered === false) {
                logout(); 
                alert("Session revoked by Administrator.");
              }
            }
          });
        }
      } else {
        setUser(null);
        unsubscribeSnapshot(); 
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, [userRegNo]);

  const login = async (email, password, regNo) => {
    await loginStudent(email, password, regNo);
    localStorage.setItem("userRegNo", regNo); 
    setUserRegNo(regNo);
  };

  const logout = async () => {
    await logoutStudent(userRegNo);
    localStorage.removeItem("userRegNo");
    setUserRegNo(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);