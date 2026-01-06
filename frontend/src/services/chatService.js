import { db } from "../conf/firebase";
import {
    doc,
    setDoc,
    addDoc,
    collection,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    orderBy,
    getDoc,
    limit,
    Timestamp
} from "firebase/firestore";

/**
 * Generates a deterministic chatId from two UIDs.
 */
export const getChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join("_");
};

/**
 * Creates a chat thread if it doesn't already exist.
 */
export const createChat = async (uid1, uid2) => {
    const chatId = getChatId(uid1, uid2);
    const chatRef = doc(db, "chats", chatId);

    try {
        // We use setDoc with merge: true to initialize if not exists
        // This is safer than getDoc if rules are strict on path existence
        await setDoc(chatRef, {
            users: [uid1, uid2],
            updatedAt: serverTimestamp(),
            // We only want to set createdAt if it's new
            // But since this is a deterministic ID, we can initialize it simple
        }, { merge: true });

        // Ensure createdAt exists if it was just created (not perfect with merge but works for state)
        const snap = await getDoc(chatRef);
        if (snap.exists() && !snap.data().createdAt) {
            await setDoc(chatRef, { createdAt: serverTimestamp() }, { merge: true });
        }

        console.log("Chat initialized/found:", chatId);
        return chatId;
    } catch (err) {
        console.error("Error in createChat service:", err);
        throw err;
    }
};

/**
 * Creates a NEW group chat.
 */
export const createGroupChat = async (groupName, userIds, creatorId, isEphemeral = false) => {
    // Create a reference with an auto-generated ID (random)
    const chatRef = doc(collection(db, "chats"));
    const chatId = chatRef.id;

    try {
        const chatData = {
            type: isEphemeral ? "ephemeral_group" : "group",
            groupName,
            users: userIds,
            createdBy: creatorId,
            admins: [creatorId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: `Group "${groupName}" created`
        };

        if (isEphemeral) {
            // 1 hour expiry
            // We use Timestamp.fromDate because serverTimestamp() is not resolved immediately client-side for calculations if needed, 
            // but strictly for storage it is fine. 
            // Requirements said: "expiresAt = serverTimestamp + 1 hour" isn't directly possible with serverTimestamp token math in simple setDoc.
            // We will use Client side Date for expiresAt to be easier, or we calculate it. 
            // User Request: "Set expiresAt = serverTimestamp + 1 hour"
            // Firestore doesn't support "serverTimestamp() + duration" efficiently in one go without cloud functions.
            // The user said "Expiry Logic (Frontend-Only)".
            // So I will use `Timestamp.fromDate(new Date(Date.now() + 3600000))` which is close enough to server time for this usecase.
            chatData.expiresAt = Timestamp.fromDate(new Date(Date.now() + 3600000));
        }

        await setDoc(chatRef, chatData);

        console.log("Group Chat created:", chatId);
        return chatId;
    } catch (err) {
        console.error("Error in createGroupChat service:", err);
        throw err;
    }
};

/**
 * Sends a message in a chat thread.
 */
export const sendMessage = async (chatId, senderId, text) => {
    if (!text.trim()) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatRef = doc(db, "chats", chatId);

    await addDoc(messagesRef, {
        senderId,
        text,
        createdAt: serverTimestamp()
    });

    await setDoc(chatRef, {
        lastMessage: text,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

/**
 * Real-time listener for user's chats.
 */
export const getChatsListener = (uid, callback) => {
    const q = query(
        collection(db, "chats"),
        where("users", "array-contains", uid)
    );

    return onSnapshot(q, (snapshot) => {
        const chats = [];
        const now = new Date();

        snapshot.docs.forEach(doc => {
            const data = doc.data();
            // Filter expired ephemeral groups
            if (data.type === "ephemeral_group" && data.expiresAt) {
                const expiresVal = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt.seconds * 1000); // Handle Firestore Timestamp
                if (expiresVal < now) {
                    return; // Skip expired chat
                }
            }
            chats.push({
                id: doc.id,
                ...data
            });
        });
        callback(chats);
    }, (error) => {
        console.error("Error in getChatsListener:", error);
        if (error.message.includes("index")) {
            console.warn("CRITICAL: A composite index is required for this query. Check the browser console for a Firebase link to create it.");
        }
    });
};

/**
 * Real-time listener for messages in a chat.
 */
export const getMessagesListener = (chatId, callback) => {
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};
