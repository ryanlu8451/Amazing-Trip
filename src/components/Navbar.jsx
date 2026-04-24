import { Home, Calendar, Plane, Hotel, Wallet, Info } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/',          label: 'Home',     icon: Home },
  { path: '/timeline',  label: 'Plan',     icon: Calendar },
  { path: '/flights',   label: 'Flights',  icon: Plane },
  { path: '/hotels',    label: 'Stays',    icon: Hotel },
  { path: '/budget',    label: 'Budget',   icon: Wallet },
  { path: '/tips',      label: 'Tips',     icon: Info },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="max-w-lg mx-auto flex justify-around items-center rounded-[1.6rem] bg-white/95 px-2 py-2 shadow-2xl shadow-slate-950/20 border border-white pointer-events-auto backdrop-blur">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-2xl transition-all ${
                active
                  ? 'text-slate-950 bg-slate-100'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
