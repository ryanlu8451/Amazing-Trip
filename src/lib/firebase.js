import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

function getAuthDomain(projectId, authDomain) {
  const currentHostname =
    typeof window === 'undefined' ? '' : window.location.hostname

  // 如果在 Firebase Hosting 上，使用當前主機名
  if (
    projectId &&
    (currentHostname === `${projectId}.web.app` ||
      currentHostname === `${projectId}.firebaseapp.com`)
  ) {
    return currentHostname
  }

  // 本地開發環境
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
    if (projectId) {
      return `${projectId}.firebaseapp.com`
    }
  }

  // 使用環境變數中的 authDomain，或回退到預設值
  if (!authDomain && projectId) {
    return `${projectId}.firebaseapp.com`
  }

  return authDomain
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

firebaseConfig.authDomain = getAuthDomain(
  firebaseConfig.projectId,
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
)

// 診斷信息（開發模式）
if (import.meta.env.DEV) {
  console.log('[Firebase Config Debug]', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    currentHostname: typeof window === 'undefined' ? 'N/A' : window.location.hostname,
  })
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})
