import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyB2BIfL41WyDTFX-FV9ArZl2kB0GJNIG14",
  authDomain: "truth-or-dare-46a9e.firebaseapp.com",
  projectId: "truth-or-dare-46a9e",
  storageBucket: "truth-or-dare-46a9e.firebasestorage.app",
  messagingSenderId: "410442463021",
  appId: "1:410442463021:web:80a9ed95cb715cb089c5a4",
  measurementId: "G-5QGRC0G3WV"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
