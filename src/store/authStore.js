import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'

function toUserProfile(user) {
  if (!user) {
    return null
  }

  return {
    uid: user.uid,
    name: user.displayName || 'Traveler',
    email: user.email || '',
    photoURL: user.photoURL || '',
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: '',
  isConfigured: isFirebaseConfigured,

  startAuthListener: () => {
    if (!auth) {
      set({
        user: null,
        loading: false,
        error: 'Firebase is not configured yet.',
      })
      return () => {}
    }

    return onAuthStateChanged(
      auth,
      (firebaseUser) => {
        set({
          user: toUserProfile(firebaseUser),
          loading: false,
          error: '',
        })
      },
      () => {
        set({
          user: null,
          loading: false,
          error: 'Could not check your sign-in status.',
        })
      }
    )
  },

  signInWithGoogle: async () => {
    if (!auth) {
      set({ error: 'Add your Firebase web config before using Google sign-in.' })
      return
    }

    set({ error: '' })

    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        set({ error: 'Sign-in was cancelled.' })
        return
      }

      set({ error: error.message || 'Google sign-in failed.' })
    }
  },

  logOut: async () => {
    if (!auth) {
      set({ user: null })
      return
    }

    await signOut(auth)
  },
}))
