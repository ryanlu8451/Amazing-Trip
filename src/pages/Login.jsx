import { Loader2, Mail, Plane, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const {
    error,
    isConfigured,
    signInWithGoogle,
  } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 px-5 py-10 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
          <Plane size={30} className="text-blue-600" />
        </div>

        <p className="text-blue-500 text-sm font-semibold tracking-wide">
          AMAZING TRIP
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          Sign in to plan and share trips
        </h1>
        <p className="text-sm text-gray-500 mt-3">
          Use your Google account to access your travel plans. This also prepares the app for future trip sharing with other users.
        </p>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl bg-gray-50 p-4 flex gap-3">
            <ShieldCheck size={18} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Secure Google login
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Firebase Authentication handles Gmail and Google account sign-in.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50 p-4 flex gap-3">
            <Mail size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Ready for sharing
              </p>
              <p className="text-xs text-gray-500 mt-1">
                User email and profile data can later power invite links and permissions.
              </p>
            </div>
          </div>
        </div>

        {!isConfigured && (
          <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Firebase setup needed
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Copy `.env.example` to `.env.local`, paste your Firebase web config, and enable Google as a sign-in provider in Firebase Console.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={!isConfigured}
          className="mt-6 w-full bg-gray-950 text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isConfigured ? (
            <>
              <Mail size={17} />
              Continue with Google
            </>
          ) : (
            <>
              <Loader2 size={17} />
              Waiting for Firebase config
            </>
          )}
        </button>
      </div>
    </div>
  )
}
