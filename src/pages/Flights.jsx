import { useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  ListFilter,
  Lock,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  ShieldCheck,
  Ticket,
  Trash2,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import { canEditTrip } from '../lib/tripCloud'
import { useTranslation } from '../lib/i18n'
import EditModal from '../components/EditModal'
import { InputField, SelectField } from '../components/InputField'

const emptyFlight = {
  direction: 'outbound',
  airline: '',
  code: '',
  fromCity: '',
  fromAirport: '',
  depTime: '',
  toCity: '',
  toAirport: '',
  arrTime: '',
  date: '',
  arrDate: '',
  duration: '',
  seat: 'Economy',
  terminal: '',
  gate: '',
  bookingRef: '',
  currency: 'CAD',
  price: '',
  status: 'confirmed',
  isHidden: false,
  isCompleted: false,
  note: '',
}

const DIRECTION_OPTIONS = [
  { value: 'outbound', label: 'Outbound' },
  { value: 'return', label: 'Return' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'domestic', label: 'Domestic' },
]

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
]

const SEAT_OPTIONS = [
  { value: 'Economy', label: 'Economy' },
  { value: 'Premium Economy', label: 'Premium Economy' },
  { value: 'Business', label: 'Business' },
  { value: 'First Class', label: 'First Class' },
]

const CURRENCY_OPTIONS = [
  { value: 'CAD', label: 'CAD' },
  { value: 'USD', label: 'USD' },
  { value: 'TWD', label: 'TWD' },
  { value: 'JPY', label: 'JPY' },
  { value: 'EUR', label: 'EUR' },
]

const AIRPORT_TIPS = [
  {
    icon: '🛂',
    title: 'Documents',
    desc: 'Keep passport, visa, PR card, and booking confirmation easy to access.',
  },
  {
    icon: '🧳',
    title: 'Baggage',
    desc: 'Double-check carry-on size, checked baggage allowance, and restricted items.',
  },
  {
    icon: '⏰',
    title: 'Timing',
    desc: 'Arrive 2–3 hours before international flights, especially during busy seasons.',
  },
]

function getDirectionLabel(direction, t) {
  const legacyDirection = {
    去程: t('flights.direction.outbound'),
    回程: t('flights.direction.return'),
    轉機: t('flights.direction.transfer'),
  }

  if (legacyDirection[direction]) {
    return legacyDirection[direction]
  }

  const option = DIRECTION_OPTIONS.find((item) => item.value === direction)
  return option ? t(`flights.direction.${option.value}`) : t('flights.flight')
}

function getStatusStyle(status) {
  if (status === 'confirmed') {
    return 'bg-green-100 text-green-700'
  }

  if (status === 'cancelled') {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-amber-100 text-amber-700'
}

function getStatusLabel(status, t) {
  if (status === 'confirmed') {
    return t('common.confirmed')
  }

  if (status === 'cancelled') {
    return t('common.cancelled')
  }

  return t('common.pending')
}

function formatDisplayDate(date, t) {
  if (!date) {
    return t('common.noDate')
  }

  const parsedDate = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return parsedDate.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function calculateDuration(date, depTime, arrDate, arrTime) {
  if (!date || !depTime || !arrTime) {
    return ''
  }

  const departure = new Date(`${date}T${depTime}`)
  let arrival = new Date(`${arrDate || date}T${arrTime}`)

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime())) {
    return ''
  }

  if (!arrDate && arrival <= departure) {
    arrival = new Date(arrival.getTime() + 24 * 60 * 60 * 1000)
  }

  const totalMinutes = Math.round((arrival - departure) / 60000)

  if (totalMinutes < 0) {
    return ''
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h`
  }

  return `${minutes}m`
}

function getFlightDuration(flight) {
  const calculatedDuration = calculateDuration(
    flight.date,
    flight.depTime,
    flight.arrDate,
    flight.arrTime
  )

  return calculatedDuration || flight.duration || ''
}

function getFlightArrivalDateTime(flight) {
  if (!flight.date) {
    return null
  }

  const arrivalDate = flight.arrDate || flight.date
  let arrival = new Date(`${arrivalDate}T${flight.arrTime || '23:59'}`)

  if (
    !flight.arrDate &&
    flight.depTime &&
    flight.arrTime &&
    flight.arrTime <= flight.depTime
  ) {
    arrival = new Date(arrival.getTime() + 24 * 60 * 60 * 1000)
  }

  if (Number.isNaN(arrival.getTime())) {
    return null
  }

  return arrival
}

function isFlightPast(flight) {
  const arrival = getFlightArrivalDateTime(flight)

  if (!arrival) {
    return false
  }

  return arrival < new Date()
}

function sortFlightsByDate(flights) {
  return [...flights].sort((a, b) => {
    const dateA = a.date ? new Date(`${a.date}T${a.depTime || '00:00'}`) : new Date(0)
    const dateB = b.date ? new Date(`${b.date}T${b.depTime || '00:00'}`) : new Date(0)

    return dateA - dateB
  })
}

function isRequiredFlightInfoMissing(form) {
  return (
    !form.airline ||
    !form.code ||
    !form.fromCity ||
    !form.fromAirport ||
    !form.toCity ||
    !form.toAirport ||
    !form.date ||
    !form.depTime ||
    !form.arrTime
  )
}

function getTripConfirmedFlightCount(trip) {
  return trip.flights?.filter((flight) => flight.status === 'confirmed').length || 0
}

function getTripFlightTotal(trip) {
  return (trip.flights || []).reduce(
    (sum, flight) => sum + Number(flight.price || 0),
    0
  )
}

function getCurrencyLabel(flights) {
  const currencies = [
    ...new Set(
      flights
        .filter((flight) => Number(flight.price || 0) > 0)
        .map((flight) => flight.currency || 'CAD')
    ),
  ]

  if (currencies.length === 0) {
    return 'CAD'
  }

  if (currencies.length === 1) {
    return currencies[0]
  }

  return 'Mixed'
}

function shouldShowFlight(flight, showHiddenFlights, showCompletedFlights) {
  if (flight.isHidden && !showHiddenFlights) {
    return false
  }

  if (flight.isCompleted && !showCompletedFlights) {
    return false
  }

  return true
}

function formatMoney(amount, currency) {
  if (amount === '' || amount === null || amount === undefined || Number(amount) <= 0) {
    return 'Not set'
  }

  return `${currency || 'CAD'} ${Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`
}

function formatTripTotal(amount, currencyLabel) {
  if (currencyLabel === 'Mixed') {
    return 'Mixed'
  }

  return `${currencyLabel} ${Number(amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`
}

export default function Flights() {
  const {
    trips,
    activeTripId,
    setActiveTrip,
    addFlight,
    updateFlight,
    deleteFlight,
  } = useTripStore()

  const { user } = useAuthStore()
  const { t } = useTranslation()

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyFlight)
  const [error, setError] = useState('')
  const [showTripPicker, setShowTripPicker] = useState(false)
  const [showListOptions, setShowListOptions] = useState(false)
  const [showHiddenFlights, setShowHiddenFlights] = useState(false)
  const [showCompletedFlights, setShowCompletedFlights] = useState(false)
  const [openActionsFlightKey, setOpenActionsFlightKey] = useState('')

  const selectedTrip = trips.find((trip) => trip.id === activeTripId) || trips[0] || null
  const userCanEdit = canEditTrip(selectedTrip, user)
  const selectedFlights = sortFlightsByDate(selectedTrip?.flights || [])
  const visibleFlights = selectedFlights.filter((flight) =>
    shouldShowFlight(flight, showHiddenFlights, showCompletedFlights)
  )
  const hiddenFlightCount = selectedFlights.filter((flight) => flight.isHidden).length
  const completedFlightCount = selectedFlights.filter((flight) => flight.isCompleted).length
  const selectedFlightTotal = selectedTrip ? getTripFlightTotal(selectedTrip) : 0
  const selectedCurrencyLabel = getCurrencyLabel(selectedFlights)

  const selectTrip = (tripId) => {
    setActiveTrip(tripId)
    setShowTripPicker(false)
    setShowListOptions(false)
    setOpenActionsFlightKey('')
  }

  const openAdd = () => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setActiveTrip(selectedTrip.id)
    setForm(emptyFlight)
    setError('')
    setModal({
      mode: 'add',
      tripId: selectedTrip.id,
      flightId: '',
    })
  }

  const openEdit = (flight) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    const normalizedFlight = {
      ...emptyFlight,
      ...flight,
    }

    setActiveTrip(selectedTrip.id)
    setForm({
      ...normalizedFlight,
      duration: getFlightDuration(normalizedFlight),
    })
    setError('')
    setModal({
      mode: 'edit',
      tripId: selectedTrip.id,
      flightId: flight.id,
    })
    setOpenActionsFlightKey('')
  }

  const closeModal = () => {
    setModal(null)
    setForm(emptyFlight)
    setError('')
  }

  const updateForm = (key) => (value) => {
    setError('')

    setForm((currentForm) => {
      const updatedForm = {
        ...currentForm,
        [key]: value,
      }

      if (['date', 'depTime', 'arrDate', 'arrTime'].includes(key)) {
        updatedForm.duration = calculateDuration(
          updatedForm.date,
          updatedForm.depTime,
          updatedForm.arrDate,
          updatedForm.arrTime
        )
      }

      return updatedForm
    })
  }

  const save = () => {
    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    if (isRequiredFlightInfoMissing(form)) {
      setError(t('flights.required'))
      return
    }

    const calculatedDuration = calculateDuration(
      form.date,
      form.depTime,
      form.arrDate,
      form.arrTime
    )

    const savedFlight = {
      ...form,
      duration: calculatedDuration || form.duration || '',
      price: form.price === '' ? '' : Number(form.price),
      currency: form.currency || 'CAD',
      isHidden: Boolean(form.isHidden),
      isCompleted: Boolean(form.isCompleted),
    }

    setActiveTrip(modal.tripId)

    if (modal.mode === 'add') {
      addFlight(savedFlight)
    } else {
      updateFlight(modal.flightId, savedFlight)
    }

    closeModal()
  }

  const removeFlight = (flightId) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    const confirmed = window.confirm(t('flights.deleteConfirm'))

    if (confirmed) {
      setActiveTrip(selectedTrip.id)
      deleteFlight(flightId)
      setOpenActionsFlightKey('')
    }
  }

  const toggleFlightActions = (flightId) => {
    if (!selectedTrip) {
      return
    }

    const key = `${selectedTrip.id}-${flightId}`

    setOpenActionsFlightKey((currentKey) => (currentKey === key ? '' : key))
  }

  const toggleFlightHidden = (flight) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setActiveTrip(selectedTrip.id)
    updateFlight(flight.id, {
      ...emptyFlight,
      ...flight,
      isHidden: !flight.isHidden,
      duration: getFlightDuration(flight),
    })
    setOpenActionsFlightKey('')
  }

  const toggleFlightCompleted = (flight) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setActiveTrip(selectedTrip.id)
    updateFlight(flight.id, {
      ...emptyFlight,
      ...flight,
      isCompleted: !flight.isCompleted,
      duration: getFlightDuration(flight),
    })
    setOpenActionsFlightKey('')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-x-hidden">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 pt-12 pb-4 shadow-lg shadow-blue-900/10">
        <div className="max-w-lg mx-auto relative w-full">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm">{t('common.amazingTrip')}</p>
              <h1 className="text-white text-2xl font-bold mt-1">
                {t('flights.title')}
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                {t('flights.subtitle')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTripPicker(false)
                setShowListOptions((value) => !value)
              }}
              className="bg-white/20 text-white rounded-xl p-2 shrink-0"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
          {(showListOptions || showTripPicker) && (
            <button
              type="button"
              aria-label="Close open menu"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => {
                setShowListOptions(false)
                setShowTripPicker(false)
              }}
            />
          )}

          {showListOptions && (
            <div
              className="absolute right-0 top-14 z-50 w-60 max-w-[calc(100vw-2rem)] bg-white border border-gray-100 rounded-2xl shadow-xl p-2"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowHiddenFlights((value) => !value)}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-2">
                  {showHiddenFlights ? (
                    <Eye size={16} className="text-blue-500" />
                  ) : (
                    <EyeOff size={16} className="text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700">{t('flights.showHidden')}</span>
                </div>
                <span className="text-xs text-gray-400">{hiddenFlightCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCompletedFlights((value) => !value)}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-2">
                  <ListFilter size={16} className="text-green-500" />
                  <span className="text-sm text-gray-700">{t('flights.showCompleted')}</span>
                </div>
                <span className="text-xs text-gray-400">{completedFlightCount}</span>
              </button>

              <div className="border-t border-gray-100 mt-2 pt-2 px-3 py-2">
                <p className="text-xs text-gray-400">
                  Past-date flights appear faded automatically.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setShowListOptions(false)
              setShowTripPicker((value) => !value)
            }}
            className="mt-4 w-full bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="min-w-0">
              <p className="text-xs text-blue-100">{t('common.currentlyViewing')}</p>
              <p className="text-white text-sm font-semibold truncate mt-0.5">
                {selectedTrip
                  ? `${selectedTrip.coverEmoji || '🌍'} ${
                      selectedTrip.name || selectedTrip.destination || t('common.untitledTrip')
                    }`
                  : t('common.selectTrip')}
              </p>
            </div>

            <ChevronDown
              size={20}
              className={`text-white shrink-0 transition ${
                showTripPicker ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showTripPicker && (
            <div
              className="absolute left-0 right-0 top-full mt-3 z-50 bg-white rounded-2xl shadow-xl border border-blue-100 p-2 max-h-72 overflow-y-auto"
              onClick={(event) => event.stopPropagation()}
            >
              {trips.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm font-medium text-gray-500">
                    {t('common.noTripsAvailable')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('common.createTripFirst')}
                  </p>
                </div>
              ) : (
                trips.map((trip) => {
                  const isSelected = selectedTrip?.id === trip.id

                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => selectTrip(trip.id)}
                      className={`w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shrink-0">
                        {trip.coverEmoji || '🌍'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {trip.name || trip.destination || t('common.untitledTrip')}
                          </p>

                          {isSelected && (
                            <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {trip.destination || 'No destination'} ·{' '}
                          {(trip.flights || []).length} flight
                          {(trip.flights || []).length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-5 overflow-x-hidden">
        {!selectedTrip ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plane size={30} className="text-blue-500" />
            </div>

            <h2 className="font-semibold text-gray-800">No trip selected</h2>
            <p className="text-sm text-gray-400 mt-2">
              Create or select a trip first, then add flight bookings.
            </p>
          </div>
        ) : (
          <>
            {!userCanEdit && selectedTrip && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <Lock size={18} className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  {t('common.viewOnlyFlights', {
                    role: t(`common.${selectedTrip.memberRoles?.[user?.email?.toLowerCase()] || 'viewer'}`),
                  })}
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{t('common.selectedTrip')}</p>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl">{selectedTrip.coverEmoji || '🌍'}</span>

                    <div className="min-w-0">
                      <h2 className="font-bold text-gray-800 truncate">
                        {selectedTrip.name || selectedTrip.destination || t('common.untitledTrip')}
                      </h2>
                      <p className="text-xs text-gray-500 truncate">
                        {selectedTrip.destination || t('common.noDestination')}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    {selectedTrip.startDate || t('common.startDate')} →{' '}
                    {selectedTrip.endDate || t('common.endDate')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAdd}
                  disabled={!userCanEdit}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 shrink-0 ${
                    userCanEdit
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={14} />
                  {t('flights.flight')}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-2xl bg-blue-50 p-3">
                  <p className="text-xs text-blue-500">{t('flights.totalFlights')}</p>
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {selectedFlights.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-3">
                  <p className="text-xs text-green-500">{t('common.confirmed')}</p>
                  <p className="text-xl font-bold text-green-700 mt-1">
                    {getTripConfirmedFlightCount(selectedTrip)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('hotels.cost')}</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {formatTripTotal(selectedFlightTotal, selectedCurrencyLabel)}
                  </p>
                </div>
              </div>
            </div>

            {selectedFlights.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane size={30} className="text-blue-500" />
                </div>

                <h2 className="font-semibold text-gray-800">
                  {t('flights.noFlightsTitle')}
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  {t('flights.noFlightsBody')}
                </p>

                <button
                  type="button"
                  onClick={openAdd}
                  disabled={!userCanEdit}
                  className={`mt-5 rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 ${
                    userCanEdit
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={16} />
                  {t('flights.addFirst')}
                </button>
              </div>
            ) : visibleFlights.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <EyeOff size={30} className="text-gray-300 mx-auto mb-4" />
                <h2 className="font-semibold text-gray-800">{t('flights.noVisibleTitle')}</h2>
                <p className="text-sm text-gray-400 mt-2">
                  {t('flights.noVisibleBody')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleFlights.map((flight) => {
                  const actionKey = `${selectedTrip.id}-${flight.id}`
                  const isActionsOpen = openActionsFlightKey === actionKey
                  const isPast = isFlightPast(flight)
                  const isDimmed = flight.isCompleted || isPast
                  const duration = getFlightDuration(flight)

                  return (
                    <div
                      key={flight.id}
                      className={`rounded-2xl border overflow-hidden transition ${
                        flight.status === 'cancelled'
                          ? 'border-red-100'
                          : 'border-gray-100'
                      } ${isDimmed ? 'bg-gray-50 opacity-70' : 'bg-white'} ${
                        flight.isHidden ? 'opacity-50' : ''
                      }`}
                    >
                      {isActionsOpen && userCanEdit && (
                        <div className="grid grid-cols-4 text-xs font-semibold text-white">
                          <button
                            type="button"
                            onClick={() => openEdit(flight)}
                            className="bg-blue-500 py-3 flex flex-col items-center gap-1"
                          >
                            <Pencil size={15} />
                            {t('common.edit')}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleFlightHidden(flight)}
                            className="bg-slate-500 py-3 flex flex-col items-center gap-1"
                          >
                            {flight.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                            {flight.isHidden ? t('common.show') : t('common.hide')}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleFlightCompleted(flight)}
                            className="bg-green-500 py-3 flex flex-col items-center gap-1"
                          >
                            {flight.isCompleted ? (
                              <RotateCcw size={15} />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            {flight.isCompleted ? t('common.reopen') : t('common.done')}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeFlight(flight.id)}
                            className="bg-red-500 py-3 flex flex-col items-center gap-1"
                          >
                            <Trash2 size={15} />
                            {t('common.delete')}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between px-4 py-3 bg-white">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-blue-700 font-semibold text-sm">
                              {getDirectionLabel(flight.direction, t)}
                            </span>

                            {flight.isCompleted && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                {t('common.completed')}
                              </span>
                            )}

                            {isPast && !flight.isCompleted && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                {t('flights.pastDate')}
                              </span>
                            )}

                            {flight.isHidden && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {t('common.hidden')}
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDisplayDate(flight.date, t)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyle(
                              flight.status
                            )}`}
                          >
                            {getStatusLabel(flight.status, t)}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleFlightActions(flight.id)}
                            className="p-1 rounded-full hover:bg-gray-50"
                          >
                            <MoreHorizontal size={17} className="text-blue-500" />
                          </button>
                        </div>
                      </div>

                      <div className="px-4 py-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-center min-w-0">
                            <div className="text-2xl font-bold text-gray-800">
                              {flight.depTime || '--:--'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {flight.fromAirport || t('flights.originAirport')}
                            </div>
                            <div className="text-sm font-medium text-gray-600 truncate">
                              {flight.fromCity || t('flights.origin')}
                            </div>
                          </div>

                          <div className="flex flex-col items-center flex-1 px-4">
                            <div className="text-xs text-gray-400 mb-1">
                              {duration || t('flights.autoDuration')}
                            </div>

                            <div className="flex items-center w-full">
                              <div className="h-0.5 flex-1 bg-gray-200" />
                              <Plane size={17} className="text-blue-500 mx-2" />
                              <div className="h-0.5 flex-1 bg-gray-200" />
                            </div>

                            <div className="text-xs text-gray-400 mt-1">
                              {flight.code || t('flights.flightNo')}
                            </div>
                          </div>

                          <div className="text-center min-w-0">
                            <div className="text-2xl font-bold text-gray-800">
                              {flight.arrTime || '--:--'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              {flight.toAirport || t('flights.arrivalAirport')}
                            </div>
                            <div className="text-sm font-medium text-gray-600 truncate">
                              {flight.toCity || t('flights.arrival')}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Ticket size={14} />
                              <span className="text-xs">{t('flights.airline')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {flight.airline || t('common.notSet')}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <DollarSign size={14} />
                              <span className="text-xs">{t('flights.flightCost')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {formatMoney(flight.price, flight.currency)}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <ShieldCheck size={14} />
                              <span className="text-xs">{t('flights.seat')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {flight.seat || t('common.notSet')}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin size={14} />
                              <span className="text-xs">{t('flights.terminalGate')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {flight.terminal || 'TBD'}
                              {flight.gate ? ` · ${t('flights.gatePrefix')} ${flight.gate}` : ''}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <CalendarDays size={14} />
                              <span className="text-xs">{t('flights.arrivalDate')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {flight.arrDate || flight.date || t('common.notSet')}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Ticket size={14} />
                              <span className="text-xs">{t('flights.bookingRefShort')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {flight.bookingRef || t('common.notSet')}
                            </p>
                          </div>
                        </div>

                        {flight.note && (
                          <div className="mt-3 rounded-xl bg-amber-50 p-3">
                            <p className="text-xs font-medium text-amber-700 mb-1">
                              {t('flights.note')}
                            </p>
                            <p className="text-sm text-amber-800">{flight.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {selectedFlights.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} className="text-blue-500" />
                  <h2 className="font-semibold text-gray-800">{t('flights.airportChecklist')}</h2>
                </div>

                <div className="space-y-3">
                  {AIRPORT_TIPS.map((tip) => (
                    <div key={tip.title} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-xl">{tip.icon}</span>

                      <div>
                        <p className="text-sm font-medium text-gray-800">{t(`flights.tip.${tip.title.toLowerCase()}`)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t(`flights.tip.${tip.title.toLowerCase()}Body`)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <EditModal
          title={modal.mode === 'add' ? t('flights.addBooking') : t('flights.editBooking')}
          onClose={closeModal}
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <SelectField
            label={t('flights.direction')}
            value={form.direction}
            onChange={updateForm('direction')}
            options={DIRECTION_OPTIONS.map((option) => ({
              ...option,
              label: t(`flights.direction.${option.value}`),
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('flights.airline')}
              value={form.airline}
              onChange={updateForm('airline')}
              placeholder="Air Canada"
            />

            <InputField
              label={t('flights.flightNumber')}
              value={form.code}
              onChange={updateForm('code')}
              placeholder="AC123"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('flights.fromCity')}
              value={form.fromCity}
              onChange={updateForm('fromCity')}
              placeholder="Toronto"
            />

            <InputField
              label={t('flights.fromAirport')}
              value={form.fromAirport}
              onChange={updateForm('fromAirport')}
              placeholder="YYZ"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('flights.toCity')}
              value={form.toCity}
              onChange={updateForm('toCity')}
              placeholder="Tokyo"
            />

            <InputField
              label={t('flights.toAirport')}
              value={form.toAirport}
              onChange={updateForm('toAirport')}
              placeholder="NRT"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('flights.departureDate')}
              type="date"
              value={form.date}
              onChange={updateForm('date')}
            />

            <InputField
              label={t('flights.arrivalDate')}
              type="date"
              value={form.arrDate}
              onChange={updateForm('arrDate')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('flights.departureTime')}
              type="time"
              value={form.depTime}
              onChange={updateForm('depTime')}
            />

            <InputField
              label={t('flights.arrivalTime')}
              type="time"
              value={form.arrTime}
              onChange={updateForm('arrTime')}
            />
          </div>

          <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-blue-600 mb-1">
              {t('flights.autoDurationTitle')}
            </p>
            <p className="text-sm font-semibold text-blue-800">
              {form.duration || t('flights.durationHint')}
            </p>
            <p className="text-xs text-blue-500 mt-1">
              {t('flights.durationBody')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label={t('flights.currency')}
              value={form.currency}
              onChange={updateForm('currency')}
              options={CURRENCY_OPTIONS}
            />

            <InputField
              label={t('flights.flightCost')}
              type="number"
              value={form.price}
              onChange={updateForm('price')}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('flights.terminal')}
              value={form.terminal}
              onChange={updateForm('terminal')}
              placeholder="Terminal 1"
            />

            <InputField
              label={t('flights.gate')}
              value={form.gate}
              onChange={updateForm('gate')}
              placeholder="A12"
            />
          </div>

          <SelectField
            label={t('flights.seatClass')}
            value={form.seat}
            onChange={updateForm('seat')}
            options={SEAT_OPTIONS.map((option) => {
              const seatKey = {
                Economy: 'economy',
                'Premium Economy': 'premium',
                Business: 'business',
                'First Class': 'first',
              }[option.value]
              return {
                ...option,
                label: t(`flights.seat.${seatKey}`),
              }
            })}
          />

          <InputField
            label={t('flights.bookingRef')}
            value={form.bookingRef}
            onChange={updateForm('bookingRef')}
            placeholder="ABC123"
          />

          <SelectField
            label={t('flights.status')}
            value={form.status}
            onChange={updateForm('status')}
            options={STATUS_OPTIONS.map((option) => ({
              ...option,
              label: t(`common.${option.value}`),
            }))}
          />

          <InputField
            label={t('flights.note')}
            value={form.note}
            onChange={updateForm('note')}
            placeholder="Baggage, check-in reminder, meal request..."
          />

          <button
            type="button"
            onClick={save}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {modal.mode === 'add' ? t('flights.saveBooking') : t('common.saveChanges')}
          </button>
        </EditModal>
      )}
    </div>
  )
}
