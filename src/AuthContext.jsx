import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from './firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          setUserDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        } catch {
          setUserDoc(null)
        }
      } else {
        setUserDoc(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    try {
      const snap = await getDoc(doc(db, 'users', result.user.uid))
      if (snap.exists()) {
        setUserDoc({ id: snap.id, ...snap.data() })
      }
    } catch {
      setUserDoc(null)
    }
    return result
  }

  const logout = async () => {
    await signOut(auth)
    setUserDoc(null)
  }

  const setRole = async (role) => {
    if (!user) return
    const data = {
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      role,
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', user.uid), data, { merge: true })
    setUserDoc({ id: user.uid, ...data, createdAt: new Date() })
  }

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
