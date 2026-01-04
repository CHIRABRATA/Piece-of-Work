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
  await signInWithEmailAndPassword(auth, email, password);

  // 4. Update session status
  await updateDoc(docRef, {
    is_registered: true,
    lastLogin: serverTimestamp(),
  });

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
  await createUserWithEmailAndPassword(auth, email, password);

  // 4. Link the email to the RegNo in Firestore
  await updateDoc(docRef, {
    email: email,
    is_registered: true,
    lastLogin: serverTimestamp(),
  });

  localStorage.setItem("userRegNo", regNo);
  return { email, regNo };
};

// --- LOGOUT FUNCTION ---
export const logoutStudent = async () => {
  const storedReg = localStorage.getItem("userRegNo");
  if (storedReg) {
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