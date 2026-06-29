import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBIhgS63shGfab3GWlsiE93fsgIbev81sI",
  authDomain: "uvgrid.firebaseapp.com",
  projectId: "uvgrid",
  storageBucket: "uvgrid.firebasestorage.app",
  messagingSenderId: "439671485169",
  appId: "1:439671485169:web:d153db7cbfbfac56b8af50",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
