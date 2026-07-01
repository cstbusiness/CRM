import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration loaded from firebase-applet-config.json
const firebaseConfig = {
  projectId: "coral-thinker-vfbwx",
  appId: "1:414980138861:web:2ab9ea87f43afceedc5c64",
  apiKey: "AIzaSyBlvXK3yDKJ9SRkNBU8RQboqjuEiB6L3Iw",
  authDomain: "coral-thinker-vfbwx.firebaseapp.com",
  storageBucket: "coral-thinker-vfbwx.firebasestorage.app",
  messagingSenderId: "414980138861"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific databaseId if provided
const db = getFirestore(app, "ai-studio-43170534-b265-49e3-82b6-fa88661ecb3c");

export { app, db };
