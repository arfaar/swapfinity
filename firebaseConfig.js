// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBR4o2wYCX_2V9RMrIB44ZHUhBbOwjX5Iw",
  authDomain: "swapfinity-app.firebaseapp.com",
  projectId: "swapfinity-app",
  storageBucket: "swapfinity-app.firebasestorage.app",
  messagingSenderId: "1058442856691",
  appId: "1:1058442856691:web:2710e7387c1707e1898f86"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);

// export { auth };