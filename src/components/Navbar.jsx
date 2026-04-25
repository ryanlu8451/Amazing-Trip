import { Home, Calendar, Plane, Hotel, Wallet, Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../lib/i18n'

export default function Navbar() {
  const location = useLocation()
  const { t } = useTranslation()

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/timeline', label: t('nav.timeline'), icon: Calendar },
    { path: '/flights', label: t('nav.flights'), icon: Plane },
    { path: '/hotels', label: t('nav.hotels'), icon: Hotel },
    { path: '/budget', label: t('nav.budget'), icon: Wallet },
    { path: '/settings', label: t('nav.settings'), icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center py-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path || (path === '/settings' && location.pathname === '/tips')
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
                active
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
