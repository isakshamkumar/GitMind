// Import the functions you need from the SDKs you need
import { getStorage } from "firebase/storage";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBL_kflc1NIEj8LwhK9Zb2b8FOwxPrvjKk",
    authDomain: "dionysus-68f20.firebaseapp.com",
    projectId: "dionysus-68f20",
    storageBucket: "dionysus-68f20.firebasestorage.app",
    messagingSenderId: "613136820353",
    appId: "1:613136820353:web:fb6ed0a0bed45fda558580"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);