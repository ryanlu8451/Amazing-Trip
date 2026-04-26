import { AlertTriangle, Loader2, Mail, Plane } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getBrowserEnvironment, getExternalBrowserName } from '../lib/browser'
import { useTranslation } from '../lib/i18n'
import { LANGUAGE_OPTIONS, useSettingsStore } from '../store/settingsStore'

export default function Login() {
  const {
    error,
    isConfigured,
    signInWithGoogle,
  } = useAuthStore()
  const { language, t } = useTranslation()
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const browser = getBrowserEnvironment()
  const externalBrowserName = getExternalBrowserName()
  const currentUrl = window.location.href

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 px-5 py-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <div className="rounded-full bg-white/15 p-1 flex gap-1 backdrop-blur">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLanguage(option.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  language === option.value
                    ? 'bg-white text-blue-700'
                    : 'text-white/80'
                }`}
              >
                {option.value === 'zh-TW' ? '中文' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
            <Plane size={30} className="text-blue-600" />
          </div>

          <p className="text-blue-500 text-sm font-semibold tracking-wide">
            AMAZING TRIP
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {t('login.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-3 leading-6">
            {t('login.simpleSubtitle')}
          </p>

          {browser.isEmbeddedBrowser && (
            <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <div className="flex gap-3">
                <AlertTriangle size={19} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {t('login.openExternal', { browser: externalBrowserName })}
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    {t('login.embeddedWarning')}
                  </p>
                  <p className="text-xs text-amber-800 mt-2 break-all">
                    {currentUrl}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isConfigured && (
            <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-sm font-semibold text-amber-800">
                {t('login.firebaseNeededTitle')}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {t('login.firebaseNeededBody')}
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
            disabled={!isConfigured || browser.isEmbeddedBrowser}
            className="mt-6 w-full bg-gray-950 text-white rounded-2xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isConfigured && !browser.isEmbeddedBrowser ? (
              <>
                <Mail size={17} />
                {t('login.continue')}
              </>
            ) : (
              <>
                <Loader2 size={17} />
                {t('login.waiting')}
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4 leading-5">
            {t('login.googleOnlyNote')}
          </p>
        </div>
        <p className="text-xs text-white/70 text-center mt-4 leading-5">
          {t('login.termsNote')}
        </p>
      </div>
    </div>
  )
}
