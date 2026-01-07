import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../conf/firebase";
// Import the signupStudent service
import { loginStudent, logoutStudent, signupStudent } from "../services/Authservice.js";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
              
              // THE KILL SWITCH
              // Only trigger if the user is authenticated but the DB says registered is false
              if (data.is_registered === false) {
                 setStatusMsg("Session Revoked by Admin! 😏");
                 setTimeout(() => {
                   logout(); 
                   setStatusMsg(null); // Clear msg after logout
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

  // SIGNUP LOGIC
  const signup = async (email, password, regNo) => {
    const userCredential = await signupStudent(email, password, regNo);
    localStorage.setItem("userRegNo", regNo);
    return userCredential;
  };

  // LOGIN LOGIC
  const login = async (email, password, regNo) => {
    const userCredential = await loginStudent(email, password, regNo);
    localStorage.setItem("userRegNo", regNo); 
    return userCredential;
  };

  // LOGOUT LOGIC
  const logout = async () => {
    // We get the regNo before clearing it to update Firestore
    await logoutStudent(user?.uid);
    localStorage.removeItem("userRegNo");
    setUser(null);
  };

  const value = {
    user,
    loading,
    statusMsg,
    setStatusMsg,
    login,
    signup, // Now defined!
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {statusMsg && (
        <div className="fixed top-5 right-5 z-[100] bg-red-500/20 border border-red-500 backdrop-blur-lg text-red-200 px-6 py-4 rounded-2xl shadow-2xl animate-bounce">
          {statusMsg}
        </div>
      )}
      {!loading && children}
    </AuthContext.Provider>
  );
};