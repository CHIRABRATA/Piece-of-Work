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

/**
 * Updates the user's online status in the users collection
 * @param {string} uid - The user's authentication ID
 * @param {boolean} isOnline - Whether the user is online
 */
export const updateUserOnlineStatus = async (uid, isOnline) => {
  if (!uid) return;
  try {
    const userDoc = doc(db, "users", uid);
    await updateDoc(userDoc, {
      isOnline: isOnline,
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating online status:", error);
  }
};

// --- LOGIN FUNCTION ---
export const loginStudent = async (email, password, regNo) => {
  const docRef = doc(db, "valid_students", regNo);
  const docSnap = await getDoc(docRef);

  // 1. Check if Registration Number exists
  if (!docSnap.exists()) {
    throw new Error("Registration number not found! Contact Admin.😒");
  }

  const studentData = docSnap.data();

  // 2. Security: Verify that the email matches the one registered to this RegNo
  if (studentData.email && studentData.email !== email) {
    throw new Error("This Registration Number is linked to a different email.😏");
  }

  // 3. Authenticate with Firebase
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // 4. Update session status
  await updateDoc(docRef, {
    is_registered: true,
    lastLogin: serverTimestamp(),
  });

  // 5. Update online status in users collection
  await updateUserOnlineStatus(userCredential.user.uid, true);

  localStorage.setItem("userRegNo", regNo);
  return { email, regNo };
};

// --- SIGN UP FUNCTION ---
export const signupStudent = async (email, password, regNo) => {
  const docRef = doc(db, "valid_students", regNo);
  const docSnap = await getDoc(docRef);

  // 1. Verify RegNo exists in Admin list
  if (!docSnap.exists()) {
    throw new Error("Your Registration Number is not authorized to join.😒");
  }

  // 2. Prevent double registration
  if (docSnap.data().email) {
    throw new Error("This Registration Number is already registered! Please Log In.");
  }

  // 3. Create Firebase Auth Account
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // 4. Link the email to the RegNo in Firestore
  await updateDoc(docRef, {
    email: email,
    is_registered: true,
    lastLogin: serverTimestamp(),
  });

  // 5. Update online status in users collection
  await updateUserOnlineStatus(userCredential.user.uid, true);

  localStorage.setItem("userRegNo", regNo);
  return { email, regNo };
};

// --- LOGOUT FUNCTION ---
export const logoutStudent = async (uid) => {
  const storedReg = localStorage.getItem("userRegNo");
  if (storedReg) {
    const docRef = doc(db, "valid_students", storedReg);
    try {
      await updateDoc(docRef, { is_registered: false });
    } catch (e) {
      console.error("Error updating logout status", e);
    }
  }
  
  // Update online status to false
  if (uid) {
    await updateUserOnlineStatus(uid, false);
  }
  
  await signOut(auth);
  localStorage.removeItem("userRegNo");
};