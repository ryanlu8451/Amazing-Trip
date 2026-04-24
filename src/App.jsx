import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Timeline from './pages/Timeline'
import Flights from './pages/Flights'
import Hotels from './pages/Hotels'
import Budget from './pages/Budget'
import Tips from './pages/Tips'
import TripSettings from './pages/TripSettings'

function App() {
  return (
    <BrowserRouter>
      <div className="pb-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/trip-settings" element={<TripSettings />} />
        </Routes>
      </div>

      <Navbar />
    </BrowserRouter>
  )
}

export default App