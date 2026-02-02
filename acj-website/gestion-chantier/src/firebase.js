// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // Ajout de l'import
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Ta configuration (NE COPIE PAS CA, PRENDS LA TIENNE SUR LE SITE FIREBASE)
const firebaseConfig = {
  apiKey: "AIzaSyDenNqzjp-ayqGHJzSWJJD8FXXjICHAKys",
  authDomain: "gestion-chantier-98183.firebaseapp.com",
  projectId: "gestion-chantier-98183",
  storageBucket: "gestion-chantier-98183.firebasestorage.app",
  messagingSenderId: "470223541867",
  appId: "1:470223541867:web:49f9a6189ceee0f628c32e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// --- ACTIVATION DU CACHE HORS-LIGNE ---
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Persistance échouée : Probablement plusieurs onglets ouverts.');
    } else if (err.code == 'unimplemented') {
      console.log('Le navigateur ne supporte pas la persistance.');
    }
  });
// --------------------------------------


export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();