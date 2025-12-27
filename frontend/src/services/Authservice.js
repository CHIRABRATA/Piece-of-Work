import { auth, db } from "../conf/firebase";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail, // <--- Import this
  signOut 
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const loginStudent = async (email, password, regNo) => {
  // 1. Check if Registration Number exists in Firestore (The Admin Pre-check)
  const docRef = doc(db, "valid_students", regNo);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Registration number not found! Contact Admin.");
  }
  
  const studentData = docSnap.data();

  // 2. Prevent login if already marked as registered (active session)
  if (studentData.is_registered === true) {
    throw new Error("This registration is already logged in elsewhere.");
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
    
    throw err;
  }

  // 4. Success: Update Firestore & LocalStorage
  await updateDoc(docRef, {
    is_registered: true,
    email: email,
    lastLogin: serverTimestamp(),
  });

  // Critical for the App.jsx listener to know which student to watch
  localStorage.setItem("userRegNo", regNo);

  return { email, regNo };
};

export const logoutStudent = async () => {
  const storedReg = localStorage.getItem("userRegNo");
  
  if (storedReg) {
    // Mark session as inactive in DB
    const docRef = doc(db, "valid_students", storedReg);
    try {
        await updateDoc(docRef, { is_registered: false });
    } catch (e) {
        console.error("Error updating logout status", e);
    }
  }
  
  await signOut(auth);
  localStorage.removeItem("userRegNo");
};