import { create } from 'zustand'
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { getBrowserEnvironment } from '../lib/browser'

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

    setPersistence(auth, browserLocalPersistence).catch(() => {
      set({ error: 'Could not enable persistent sign-in for this browser.' })
    })

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

    const browser = getBrowserEnvironment()

    if (browser.isEmbeddedBrowser) {
      set({
        error: 'Google blocks sign-in inside this in-app browser. Please open Amazing Trip in Safari or Chrome, then try again.',
      })
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

      if (error.code === 'auth/unauthorized-domain') {
        set({
          error: 'This domain is not authorized in Firebase Authentication.',
        })
        return
      }

      if (error.code === 'auth/internal-error') {
        set({
          error: 'Google sign-in could not start. Please refresh the page and try again in Safari or Chrome. If this continues, make sure amazing-trip-f5732.web.app is added in Firebase Authentication authorized domains.',
        })
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
