import { Home, Calendar, Plane, Hotel, Wallet, Info } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/',          label: '首頁',   icon: Home },
  { path: '/timeline',  label: '行程',   icon: Calendar },
  { path: '/flights',   label: '機票',   icon: Plane },
  { path: '/hotels',    label: '住宿',   icon: Hotel },
  { path: '/budget',    label: '預算',   icon: Wallet },
  { path: '/tips',      label: '注意',   icon: Info },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-50">
      <div className="max-w-lg mx-auto flex justify-around items-center py-2">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
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