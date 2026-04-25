import { CheckCircle2, Globe2, Info, Languages } from 'lucide-react'
import { useState } from 'react'
import { translate, useTranslation } from '../lib/i18n'
import { LANGUAGE_OPTIONS, useSettingsStore } from '../store/settingsStore'

export default function SettingsPage() {
  const { language, t } = useTranslation()
  const setLanguage = useSettingsStore((state) => state.setLanguage)
  const [message, setMessage] = useState('')

  const selectLanguage = (nextLanguage) => {
    setLanguage(nextLanguage)
    setMessage(translate(nextLanguage, 'settings.saved'))
  }

  const currentLanguage =
    LANGUAGE_OPTIONS.find((option) => option.value === language) || LANGUAGE_OPTIONS[0]

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-x-hidden">
      <div className="bg-gradient-to-br from-slate-800 to-blue-700 px-6 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-blue-100 text-sm font-medium tracking-wide">
            AMAZING TRIP
          </p>
          <h1 className="text-white text-2xl font-bold mt-1">
            {t('settings.title')}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Languages size={22} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                {t('settings.languageTitle')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('settings.languageBody')}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 mb-4">
            <p className="text-xs text-gray-400">
              {t('settings.currentLanguage')}
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1">
              {currentLanguage.nativeLabel}
            </p>
          </div>

          <div className="space-y-3">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.value === language

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectLanguage(option.value)}
                  className={`w-full rounded-2xl border p-4 text-left flex items-center justify-between gap-3 transition ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-100 bg-white active:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <Globe2 size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {option.nativeLabel}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {option.label}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {message && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Info size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-800">
                {t('settings.aboutTitle')}
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-6">
                {t('settings.aboutBody')}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800">
            {t('settings.todoTitle')}
          </h2>
          <div className="mt-4 space-y-3">
            {[t('settings.todoShare'), t('settings.todoLogin')].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                <CheckCircle2 size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
