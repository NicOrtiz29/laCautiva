import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCfUlYtvz16RS2TNIUglzk2ULxQ24Px52I",
  authDomain: "lacautiva-35ad9.firebaseapp.com",
  projectId: "lacautiva-35ad9",
  storageBucket: "lacautiva-35ad9.firebasestorage.app",
  messagingSenderId: "910754418427",
  appId: "1:910754418427:web:94c72abfcd00b4aa572a5e",
  measurementId: "G-1753ZPGD85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics only in browser
if (typeof window !== 'undefined') {
  getAnalytics(app);
}

export default app; 