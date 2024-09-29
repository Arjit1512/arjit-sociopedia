// src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDXglcMLVivQggakHk-ls4-C4igkA0O56g", // Replace with your actual API key
  authDomain: "sociopedia-arjit.firebaseapp.com", // Replace with your actual auth domain
  projectId: "sociopedia-arjit",
  storageBucket: "sociopedia-arjit.appspot.com", // Replace with your actual storage bucket
  messagingSenderId: "116809572717", // Replace with your actual messaging sender ID
  appId: "1:116809572717:web:8ae0bcfbd8bc2913d5a89f", // Replace with your actual app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
