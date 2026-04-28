import { CalendarDays, FileText, Share2, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../lib/i18n'

const steps = [
  {
    icon: CalendarDays,
    titleKey: 'onboarding.stepPlanTitle',
    bodyKey: 'onboarding.stepPlanBody',
  },
  {
    icon: FileText,
    titleKey: 'onboarding.stepImportTitle',
    bodyKey: 'onboarding.stepImportBody',
  },
  {
    icon: Share2,
    titleKey: 'onboarding.stepShareTitle',
    bodyKey: 'onboarding.stepShareBody',
  },
  {
    icon: Smartphone,
    titleKey: 'onboarding.stepInstallTitle',
    bodyKey: 'onboarding.stepInstallBody',
  },
]

export default function OnboardingModal({ onClose }) {
  const { t } = useTranslation()
  const [stepIndex, setStepIndex] = useState(0)
  const step = steps[stepIndex]
  const Icon = step.icon
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === steps.length - 1

  const goBack = () => {
    setStepIndex((current) => Math.max(0, current - 1))
  }

  const goNext = () => {
    if (isLastStep) {
      onClose()
      return
    }

    setStepIndex((current) => Math.min(steps.length - 1, current + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/55 px-4 py-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
                {t('onboarding.eyebrow')}
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight">
                {t('onboarding.title')}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/15 p-2 text-white active:bg-white/25"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Icon size={24} />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400">
                {t('onboarding.stepCount', {
                  current: stepIndex + 1,
                  total: steps.length,
                })}
              </p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">
                {t(step.titleKey)}
              </h3>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-gray-500">
            {t(step.bodyKey)}
          </p>

          <div className="mt-6 flex items-center gap-2">
            {steps.map((item, index) => (
              <button
                key={item.titleKey}
                type="button"
                onClick={() => setStepIndex(index)}
                className={`h-2 flex-1 rounded-full ${
                  index === stepIndex ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-label={t('onboarding.goToStep', { step: index + 1 })}
              />
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirstStep}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              {t('common.back')}
            </button>

            <button
              type="button"
              onClick={goNext}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:bg-blue-700"
            >
              {isLastStep ? t('onboarding.finish') : t('common.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
