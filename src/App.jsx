import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Timeline from './pages/Timeline'
import Flights from './pages/Flights'
import Hotels from './pages/Hotels'
import Budget from './pages/Budget'
import SettingsPage from './pages/Tips'
import TripSettings from './pages/TripSettings'
import Invite from './pages/Invite'
import Login from './pages/Login'
import { useAuthStore } from './store/authStore'
import { useTripCloudSync } from './hooks/useTripCloudSync'
import { useTranslation } from './lib/i18n'

function App() {
  const {
    loading,
    user,
    startAuthListener,
  } = useAuthStore()
  const { t } = useTranslation()

  useTripCloudSync(user)

  useEffect(() => {
    const unsubscribe = startAuthListener()
    return unsubscribe
  }, [startAuthListener])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-800 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-xl px-6 py-5 text-center">
          <p className="text-blue-500 text-sm font-semibold tracking-wide">
            AMAZING TRIP
          </p>
          <p className="text-gray-500 text-sm mt-2">{t('app.checkingSignIn')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <div className="pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/tips" element={<SettingsPage />} />
          <Route path="/trip-settings" element={<TripSettings />} />
          <Route path="/invite/:tripId" element={<Invite />} />
        </Routes>
      </div>

      <Navbar />
    </BrowserRouter>
  )
}

export default App
