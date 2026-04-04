import { useState, useEffect } from 'react'
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import type {User} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  uid:     string
  email:   string | null
  penName: string
}

// ── Auth instance ──────────────────────────────────────────────────────────

export const auth = getAuth()
const provider = new GoogleAuthProvider()

// ── useAuth hook ───────────────────────────────────────────────────────────

export function useAuth() {
  const [user,        setUser]        = useState<AuthUser | null>(null)
  const [firebaseUser,setFirebaseUser]= useState<User | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [needsPenName,setNeedsPenName]= useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setFirebaseUser(null)
        setNeedsPenName(false)
        setLoading(false)
        return
      }

      setFirebaseUser(fbUser)

      // Check if user has a pen name stored
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid))
      if (userDoc.exists() && userDoc.data().penName) {
        setUser({
          uid:     fbUser.uid,
          email:   fbUser.email,
          penName: userDoc.data().penName,
        })
        setNeedsPenName(false)
      } else {
        // New user — needs to set pen name
        setNeedsPenName(true)
      }

      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Sign in error:', err)
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setFirebaseUser(null)
    setNeedsPenName(false)
  }

  const savePenName = async (penName: string): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseUser) return { success: false, error: 'Not logged in' }

    const trimmed = penName.trim()
    if (!trimmed) return { success: false, error: 'Pen name cannot be empty' }
    if (trimmed.length < 2) return { success: false, error: 'Pen name must be at least 2 characters' }
    if (trimmed.length > 30) return { success: false, error: 'Pen name must be under 30 characters' }

    // Check uniqueness
    const q = query(collection(db, 'users'), where('penName', '==', trimmed))
    const existing = await getDocs(q)
    if (!existing.empty) {
      return { success: false, error: 'This pen name is already taken. Choose another.' }
    }

    // Save to Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      penName: trimmed,
      email:   firebaseUser.email,
      createdAt: new Date(),
    })

    setUser({
      uid:     firebaseUser.uid,
      email:   firebaseUser.email,
      penName: trimmed,
    })
    setNeedsPenName(false)

    return { success: true }
  }

  return {
    user, firebaseUser, loading,
    needsPenName, signInWithGoogle,
    signOut, savePenName,
  }
}
