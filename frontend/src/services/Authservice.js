// src/services/authService.js
import { auth, db } from "../conf/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";

// The "Safety Valve" - if session is older than this, force login (1 hour)
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; 

export const loginStudent = async (email, password, regNo) => {
  const docRef = doc(db, "valid_students", regNo);
  const docSnap = await getDoc(docRef);

  // 1. Check if RegNo exists in your whitelist
  if (!docSnap.exists()) {
    throw new Error("Registration number not found! Contact Admin.");
  }

  const studentData = docSnap.data();
  const now = Date.now();
  const lastLoginTime = studentData.lastLogin?.toMillis() || 0;

  // 2. Check for Active Session (with Time-Limit Fix)
  // We only block if they are marked active AND logged in recently.
  if (studentData.is_registered && (now - lastLoginTime < SESSION_TIMEOUT_MS)) {
    throw new Error("This account is currently active in another session.");
  }

  // 3. Perform Firebase Auth
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      // Create account if first time (Optional: remove this if you want stricter control)
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } else {
      throw err;
    }
  }

  // 4. Update Firestore to mark session as active
  await updateDoc(docRef, {
    email: email,
    is_registered: true, // Mark as active
    lastLogin: serverTimestamp()
  });

  return { user: userCredential.user, studentData };
};

export const logoutStudent = async (regNo) => {
  if (regNo) {
    // Mark session as inactive in DB
    const docRef = doc(db, "valid_students", regNo);
    await updateDoc(docRef, { is_registered: false });
  }
  await signOut(auth);
};