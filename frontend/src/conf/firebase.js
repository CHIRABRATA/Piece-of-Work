import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOycpIKBw37_G_mC-O_9jkIg7wyt205LY",
  authDomain: "campus-connect-429ae.firebaseapp.com",
  projectId: "campus-connect-429ae",
  storageBucket: "campus-connect-429ae.appspot.com",
  messagingSenderId: "646988887058",
  appId: "1:646988887058:web:1a0022b2bf4069cb7ad4cb"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
