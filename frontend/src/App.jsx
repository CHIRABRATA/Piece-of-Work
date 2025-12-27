import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regNo, setRegNo] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Step 1: Real-time listener for Admin Force-Logout
  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get the RegNo we stored during login to identify this student's doc
        const storedReg = localStorage.getItem("userRegNo");
        
        if (storedReg) {
          unsubscribeSnapshot = onSnapshot(doc(db, "valid_students", storedReg), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              // 🚨 If Admin sets is_registered to false, boot the user out
              if (data.is_registered === false) {
                handleLogout("Access revoked by Admin.");
              }
            }
          });
        }
      } else {
        setUser(null);
        unsubscribeSnapshot();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  // 🔹 Step 2: Logic to Join / Login
  const handleJoin = async () => {
    if (!regNo || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // 1. Check if Registration Number exists in Firestore (The Admin Pre-check)
      const docRef = doc(db, "valid_students", regNo);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert("Registration number not found! Contact Admin.");
        setLoading(false);
        return;
      }

      const studentData = docSnap.data();

      // 2. Prevent login if already marked as registered (active session)
      if (studentData.is_registered === true) {
        alert("This registration is already logged in elsewhere.");
        setLoading(false);
        return;
      }

      // 3. Authenticate with Firebase Auth
      try {
        // Try to log in
        await signInWithEmailAndPassword(auth, email, password);
      } catch (authError) {
        // If user doesn't exist, create account (First time join)
        if (authError.code === "auth/user-not-found" || authError.code === "auth/invalid-credential") {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw authError;
        }
      }

      // 4. Success: Update Firestore & LocalStorage
      await updateDoc(docRef, {
        is_registered: true,
        email: email,
        lastLogin: serverTimestamp(),
      });

      localStorage.setItem("userRegNo", regNo);
      alert("Welcome to Campus Connect!");

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    setLoading(false);
  };

  // 🔹 Step 3: Logout Logic
  const handleLogout = async (msg = "Logged out successfully") => {
    try {
      const storedReg = localStorage.getItem("userRegNo");
      if (storedReg) {
        await updateDoc(doc(db, "valid_students", storedReg), {
          is_registered: false
        });
      }
      await signOut(auth);
      localStorage.removeItem("userRegNo");
      alert(msg);
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔹 Step 4: UI Rendering
  return (
    <div style={{ padding: "50px", fontFamily: "Arial, sans-serif", backgroundColor: "#121212", color: "white", minHeight: "100vh" }}>
      {!user ? (
        <div style={{ maxWidth: "400px", margin: "auto" }}>
          <h2>Campus Connect Login</h2>
          <p>Admin must add your Reg No first.</p>
          <input
            style={inputStyle}
            placeholder="College Registration Number"
            value={regNo}
            onChange={e => setRegNo(e.target.value)}
          />
          <input
            style={inputStyle}
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button 
            disabled={loading}
            style={btnStyle} 
            onClick={handleJoin}
          >
            {loading ? "Verifying..." : "Join Website"}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <h2>Welcome to the Portal</h2>
          <p>Logged in as: {user.email}</p>
          <button style={{ ...btnStyle, backgroundColor: "red" }} onClick={() => handleLogout()}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// Simple Styles
const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "5px",
  border: "1px solid #444",
  backgroundColor: "#222",
  color: "white"
};

const btnStyle = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold"
};

export default App;