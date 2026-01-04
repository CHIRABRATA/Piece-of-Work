import { db } from "../conf/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/**
 * Fetches the user profile from Firestore.
 * @param {string} uid - The user's authenticaiton ID.
 * @returns {Promise<Object|null>} The user data or null if not found.
 */
export const getUserProfile = async (uid) => {
    if (!uid) return null;
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting user profile:", error);
        throw error;
    }
};

/**
 * Updates or creates a user profile in Firestore.
 * Performs a merge update, so unrelated fields are not overwritten.
 * @param {string} uid - The user's authentication ID.
 * @param {Object} data - The data fields to update.
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, data) => {
    if (!uid) return;
    try {
        const docRef = doc(db, "users", uid);
        await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
    }
};
