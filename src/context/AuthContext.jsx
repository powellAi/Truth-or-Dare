import { createContext, useContext, useEffect, useState } from "react"
import { auth } from "../firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const register = async (email, password, username) => {
    const strongPassword = /^(?=.*[0-9])(?=.*[!@#$%^&*])(.{8,})$/
    if (!strongPassword.test(password)) {
      throw new Error("Password must be 8+ characters with a number and special character.")
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, { displayName: username })
      return result
    } catch (err) {
      console.error("Register error:", err.code, err.message)
      throw err
    }
  }

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      console.error("Login error:", err.code, err.message)
      throw err
    }
  }

  const logout = () => {
    return signOut(auth)
  }

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error("Google error:", err.code, err.message)
      throw err
    }
  }

  const updateDisplayName = async (newName) => {
    await updateProfile(auth.currentUser, { displayName: newName })
    setCurrentUser(prev => ({ ...prev, displayName: newName }))
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        })
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = {
    currentUser,
    register,
    login,
    logout,
    loginWithGoogle,
    updateDisplayName,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
