import { MonitorSmartphone, PlusSquare, Share2 } from 'lucide-react'
import { useTranslation } from '../lib/i18n'

const installSteps = [
  {
    icon: MonitorSmartphone,
    titleKey: 'install.openTitle',
    bodyKey: 'install.openBody',
  },
  {
    icon: Share2,
    titleKey: 'install.iosTitle',
    bodyKey: 'install.iosBody',
  },
  {
    icon: PlusSquare,
    titleKey: 'install.androidTitle',
    bodyKey: 'install.androidBody',
  },
]

export default function InstallGuide({ compact = false }) {
  const { t } = useTranslation()

  return (
    <section className={compact ? '' : 'bg-white rounded-2xl shadow-sm p-5'}>
      <div className="flex items-start gap-3">
        <img
          src="/app-icon-192.png"
          alt=""
          className="h-14 w-14 rounded-2xl border border-gray-100 shadow-sm"
        />

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
            {t('install.eyebrow')}
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">
            {t('install.title')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {t('install.body')}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {installSteps.map((step) => {
          const Icon = step.icon

          return (
            <div key={step.titleKey} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
                <Icon size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {t(step.titleKey)}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {t(step.bodyKey)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
