import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../conf/firebase";
import { loginStudent, logoutStudent, signupStudent } from "../services/Authservice.js";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null); // Stores Role and Volunteer status
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    let unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // 1. Listen to User Role & Volunteer Status
        onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
          if (docSnap.exists()) setUserData(docSnap.data());
        });

        // 2. The Kill Switch Logic
        const storedReg = localStorage.getItem("userRegNo");
        if (storedReg) {
          onSnapshot(doc(db, "valid_students", storedReg), (docSnap) => {
            if (docSnap.exists() && docSnap.data().is_registered === false) {
              setStatusMsg("Session Revoked by Admin! 😏");
              setTimeout(() => { logout(); setStatusMsg(null); }, 2000);
            }
          });
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  const signup = async (email, password, regNo) => {
    const res = await signupStudent(email, password, regNo);
    localStorage.setItem("userRegNo", regNo);
    return res;
  };

  const login = async (email, password, regNo) => {
    const res = await loginStudent(email, password, regNo);
    localStorage.setItem("userRegNo", regNo);
    return res;
  };

  const logout = async () => {
    await logoutStudent(user?.uid);
    localStorage.removeItem("userRegNo");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, statusMsg, login, signup, logout }}>
      {statusMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-red-500/20 border border-red-500 backdrop-blur-lg text-red-200 px-6 py-4 rounded-2xl animate-bounce">
          {statusMsg}
        </div>
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
};