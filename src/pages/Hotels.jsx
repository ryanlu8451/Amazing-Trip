import { useState } from 'react'
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardPaste,
  CreditCard,
  Link as LinkIcon,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  Wifi,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import { canEditTrip } from '../lib/tripCloud'
import { useTranslation } from '../lib/i18n'
import EditModal from '../components/EditModal'
import { InputField, SelectField } from '../components/InputField'

const emptyHotel = {
  name: '',
  area: '',
  checkIn: '',
  checkOut: '',
  rooms: 1,
  roomCapacity: '2',
  pricePerNight: '',
  currency: 'CAD',
  phone: '',
  address: '',
  wifi: '',
  mapUrl: '',
  bookingRef: '',
  status: 'confirmed',
  notes: '',
  totalCost: 0,
}

const ROOM_CAPACITY_OPTIONS = [
  { value: '1', label: '1-person room' },
  { value: '2', label: '2-person room' },
  { value: '3', label: '3-person room' },
  { value: '4', label: '4-person room' },
  { value: '5', label: '5-person room' },
  { value: '6', label: '6-person room' },
]

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'pending', label: 'Pending' },
  { value: 'cancelled', label: 'Cancelled' },
]

const CURRENCY_OPTIONS = [
  { value: 'CAD', label: 'CAD' },
  { value: 'USD', label: 'USD' },
  { value: 'TWD', label: 'TWD' },
  { value: 'JPY', label: 'JPY' },
  { value: 'EUR', label: 'EUR' },
]

function getNights(hotel) {
  if (!hotel.checkIn || !hotel.checkOut) {
    return 0
  }

  const checkInDate = new Date(`${hotel.checkIn}T00:00:00`)
  const checkOutDate = new Date(`${hotel.checkOut}T00:00:00`)

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return 0
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / 86400000)

  return nights > 0 ? nights : 0
}

function getHotelTotal(hotel) {
  const nights = getNights(hotel)
  const rooms = Number(hotel.rooms || 0)
  const pricePerNight = Number(hotel.pricePerNight || 0)

  if (pricePerNight <= 0 && Number(hotel.totalCost || 0) > 0) {
    return Number(hotel.totalCost || 0)
  }

  return nights * rooms * pricePerNight
}

function formatMoney(amount, currency) {
  if (amount === '' || amount === null || amount === undefined || Number(amount) <= 0) {
    return `${currency || 'CAD'} 0`
  }

  return `${currency || 'CAD'} ${Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`
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

function isDateRangeValid(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return true
  }

  return new Date(`${checkOut}T00:00:00`) > new Date(`${checkIn}T00:00:00`)
}

function normalizeExternalUrl(url) {
  if (!url) {
    return ''
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return `https://${url}`
}

function getGoogleMapsSearchUrl(query) {
  if (!query) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function getHotelMapUrl(hotel) {
  if (hotel.mapUrl) {
    return normalizeExternalUrl(hotel.mapUrl)
  }

  const query = [hotel.address, hotel.name, hotel.area]
    .filter(Boolean)
    .join(' ')
    .trim()

  return getGoogleMapsSearchUrl(query)
}

function sortHotelsByDate(hotels) {
  return [...hotels].sort((a, b) => {
    const dateA = a.checkIn ? new Date(`${a.checkIn}T00:00:00`) : new Date(0)
    const dateB = b.checkIn ? new Date(`${b.checkIn}T00:00:00`) : new Date(0)

    return dateA - dateB
  })
}

function getTripConfirmedHotelCount(trip) {
  return trip.hotels?.filter((hotel) => hotel.status === 'confirmed').length || 0
}

function getTripHotelTotal(trip) {
  return (trip.hotels || []).reduce((sum, hotel) => sum + getHotelTotal(hotel), 0)
}

function getLineValue(lines, keywords) {
  const matchedLine = lines.find((line) =>
    keywords.some((keyword) => line.toLowerCase().includes(keyword.toLowerCase()))
  )

  if (!matchedLine) {
    return ''
  }

  const parts = matchedLine.split(/[:：]/)

  if (parts.length > 1) {
    return parts.slice(1).join(':').trim()
  }

  let cleanedLine = matchedLine

  keywords.forEach((keyword) => {
    cleanedLine = cleanedLine.replace(new RegExp(keyword, 'ig'), '')
  })

  return cleanedLine.replace(/^[-–—\s]+/, '').trim()
}

function normalizeDateText(value) {
  if (!value) {
    return ''
  }

  const isoMatch = value.match(/\d{4}-\d{2}-\d{2}/)

  if (isoMatch) {
    return isoMatch[0]
  }

  const dateLikeMatch = value.match(
    /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)?[,]?\s*(?:\d{1,2}\s+)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/i
  )

  const rawDate = dateLikeMatch ? dateLikeMatch[0].replace(/^[A-Za-z]{3},\s*/, '') : value
  const parsedDate = new Date(rawDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }

  return parsedDate.toISOString().split('T')[0]
}

function normalizeCurrency(value) {
  if (!value) {
    return 'CAD'
  }

  const upperValue = value.toUpperCase()

  if (upperValue.includes('NT$') || upperValue.includes('NTD') || upperValue.includes('TWD')) {
    return 'TWD'
  }

  if (upperValue.includes('US$') || upperValue.includes('USD')) {
    return 'USD'
  }

  if (upperValue.includes('JPY') || upperValue.includes('¥')) {
    return 'JPY'
  }

  if (upperValue.includes('EUR') || upperValue.includes('€')) {
    return 'EUR'
  }

  if (upperValue.includes('CAD') || upperValue.includes('CA$')) {
    return 'CAD'
  }

  return 'CAD'
}

function extractAmount(text) {
  const importantLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) =>
      /total|amount|price|paid|payment|charge|住宿費|總計|合計|付款/i.test(line)
    )

  const searchText = importantLines.length > 0 ? importantLines.join('\n') : text
  const moneyMatch = searchText.match(
    /(CAD|CA\$|USD|US\$|TWD|NTD|NT\$|JPY|¥|EUR|€|\$)\s*([0-9][0-9,]*(?:\.\d{1,2})?)|([0-9][0-9,]*(?:\.\d{1,2})?)\s*(CAD|USD|TWD|NTD|JPY|EUR)/i
  )

  if (!moneyMatch) {
    return {
      amount: '',
      currency: 'CAD',
    }
  }

  const currency = normalizeCurrency(moneyMatch[1] || moneyMatch[4] || '')
  const amount = Number((moneyMatch[2] || moneyMatch[3] || '').replace(/,/g, ''))

  return {
    amount: Number.isNaN(amount) ? '' : amount,
    currency,
  }
}

function extractMapUrl(text) {
  const mapMatch = text.match(/https?:\/\/[^\s]+(?:maps\.google|goo\.gl\/maps|google\.com\/maps)[^\s]*/i)

  if (!mapMatch) {
    return ''
  }

  return mapMatch[0].replace(/[),.]+$/, '')
}

function parseHotelConfirmation(text, currentForm) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const name =
    getLineValue(lines, [
      'Hotel name',
      'Hotel',
      'Property name',
      'Property',
      'Accommodation',
      'Stay name',
      '住宿名稱',
      '飯店',
      '酒店',
    ]) || currentForm.name

  const checkIn =
    normalizeDateText(getLineValue(lines, ['Check-in', 'Check in', 'Arrival', '入住'])) ||
    currentForm.checkIn

  const checkOut =
    normalizeDateText(getLineValue(lines, ['Check-out', 'Check out', 'Departure', '退房'])) ||
    currentForm.checkOut

  const bookingRef =
    getLineValue(lines, [
      'Booking ID',
      'Booking number',
      'Booking reference',
      'Confirmation number',
      'Reservation number',
      '訂單編號',
      '預訂編號',
      '確認號碼',
    ]) || currentForm.bookingRef

  const address =
    getLineValue(lines, ['Address', 'Hotel address', 'Property address', '地址']) ||
    currentForm.address

  const phone =
    getLineValue(lines, ['Phone', 'Telephone', 'Hotel phone', 'Contact number', '電話']) ||
    currentForm.phone

  const roomsText = getLineValue(lines, ['Rooms', 'Number of rooms', '房間數', '客房'])
  const roomsMatch = roomsText.match(/\d+/)
  const rooms = roomsMatch ? Number(roomsMatch[0]) : currentForm.rooms

  const guestText = getLineValue(lines, ['Guests', 'Adults', '入住人數', '住客'])
  const guestMatch = guestText.match(/\d+/)
  const roomCapacity = guestMatch ? String(Math.min(Math.max(Number(guestMatch[0]), 1), 6)) : currentForm.roomCapacity

  const { amount, currency } = extractAmount(text)
  const nights = getNights({ checkIn, checkOut })
  const calculatedPricePerNight = amount && nights > 0 && rooms > 0 ? amount / nights / rooms : currentForm.pricePerNight
  const mapUrl = extractMapUrl(text) || currentForm.mapUrl

  const importedData = {
    name,
    checkIn,
    checkOut,
    rooms,
    roomCapacity,
    bookingRef,
    address,
    phone,
    mapUrl,
    status: 'confirmed',
    currency: amount ? currency : currentForm.currency,
    pricePerNight: calculatedPricePerNight ? Number(calculatedPricePerNight.toFixed(2)) : currentForm.pricePerNight,
    totalCost: amount || currentForm.totalCost,
  }

  if (!currentForm.area && address) {
    importedData.area = address.split(',')[0]
  }

  return importedData
}

export default function Hotels() {
  const {
    trips,
    activeTripId,
    setActiveTrip,
    addHotel,
    updateHotel,
    deleteHotel,
  } = useTripStore()

  const { user } = useAuthStore()
  const { t } = useTranslation()

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyHotel)
  const [error, setError] = useState('')
  const [showTripPicker, setShowTripPicker] = useState(false)
  const [showImportBox, setShowImportBox] = useState(false)
  const [importText, setImportText] = useState('')
  const [importMessage, setImportMessage] = useState('')

  const selectedTrip = trips.find((trip) => trip.id === activeTripId) || trips[0] || null
  const userCanEdit = canEditTrip(selectedTrip, user)
  const selectedHotels = sortHotelsByDate(selectedTrip?.hotels || [])
  const selectedHotelTotal = selectedTrip ? getTripHotelTotal(selectedTrip) : 0

  const selectTrip = (tripId) => {
    setActiveTrip(tripId)
    setShowTripPicker(false)
  }

  const resetImportTools = () => {
    setShowImportBox(false)
    setImportText('')
    setImportMessage('')
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

    setForm({
      ...emptyHotel,
      checkIn: selectedTrip.startDate || '',
      checkOut: selectedTrip.endDate || '',
    })

    setError('')
    resetImportTools()
    setModal({
      mode: 'add',
      tripId: selectedTrip.id,
      hotelId: '',
    })
  }

  const openEdit = (hotel) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setActiveTrip(selectedTrip.id)

    setForm({
      ...emptyHotel,
      ...hotel,
      totalCost: getHotelTotal(hotel),
    })

    setError('')
    resetImportTools()
    setModal({
      mode: 'edit',
      tripId: selectedTrip.id,
      hotelId: hotel.id,
    })
  }

  const closeModal = () => {
    setModal(null)
    setForm(emptyHotel)
    setError('')
    resetImportTools()
  }

  const updateForm = (key) => (value) => {
    setError('')

    setForm((currentForm) => {
      const updatedForm = {
        ...currentForm,
        [key]: value,
      }

      updatedForm.totalCost = getHotelTotal(updatedForm)

      return updatedForm
    })
  }

  const importConfirmation = () => {
    if (!userCanEdit) {
      setImportMessage(t('common.noEditPermission'))
      return
    }

    if (!importText.trim()) {
      setImportMessage(t('hotels.pasteFirst'))
      return
    }

    setForm((currentForm) => {
      const importedData = parseHotelConfirmation(importText, currentForm)
      const updatedForm = {
        ...currentForm,
        ...importedData,
      }

      updatedForm.totalCost = getHotelTotal(updatedForm)

      return updatedForm
    })

    setImportMessage(t('hotels.imported'))
  }

  const save = () => {
    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    if (!form.name || !form.checkIn || !form.checkOut) {
      setError(t('hotels.required'))
      return
    }

    if (!isDateRangeValid(form.checkIn, form.checkOut)) {
      setError(t('hotels.invalidDates'))
      return
    }

    const savedHotel = {
      ...form,
      rooms: Number(form.rooms || 1),
      roomCapacity: form.roomCapacity || '2',
      pricePerNight: form.pricePerNight === '' ? '' : Number(form.pricePerNight),
      currency: form.currency || 'CAD',
      totalCost: getHotelTotal(form),
    }

    setActiveTrip(modal.tripId)

    if (modal.mode === 'add') {
      addHotel(savedHotel)
    } else {
      updateHotel(modal.hotelId, savedHotel)
    }

    closeModal()
  }

  const removeHotel = (hotelId) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    const confirmed = window.confirm(t('hotels.deleteConfirm'))

    if (confirmed) {
      setActiveTrip(selectedTrip.id)
      deleteHotel(hotelId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-x-hidden">
      {showTripPicker && (
        <button
          type="button"
          aria-label="Close trip picker"
          onClick={() => setShowTripPicker(false)}
          className="fixed inset-0 z-30 bg-transparent"
        />
      )}

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 px-6 pt-12 pb-4 shadow-lg shadow-purple-900/10 relative z-40">
        <div className="max-w-lg mx-auto relative z-50">
          <div>
            <p className="text-purple-200 text-sm">{t('common.amazingTrip')}</p>
            <h1 className="text-white text-2xl font-bold mt-1">
              {t('hotels.title')}
            </h1>
            <p className="text-purple-100 text-sm mt-1">
              {t('hotels.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTripPicker((value) => !value)}
            className="mt-4 w-full bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="min-w-0">
              <p className="text-xs text-purple-100">{t('common.currentlyViewing')}</p>
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
            <div className="absolute left-0 right-0 top-full mt-3 z-50 max-w-full bg-white rounded-2xl shadow-xl border border-purple-100 p-2 max-h-72 overflow-y-auto">
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
                        isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
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
                            <CheckCircle2 size={15} className="text-purple-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {trip.destination || t('common.noDestination')} ·{' '}
                          {(trip.hotels || []).length} booking
                          {(trip.hotels || []).length === 1 ? '' : 's'}
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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 overflow-x-hidden">
        {!selectedTrip ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <BedDouble size={30} className="text-purple-500" />
            </div>

            <h2 className="font-semibold text-gray-800">{t('common.selectTrip')}</h2>
            <p className="text-sm text-gray-400 mt-2">
              {t('common.createTripFirst')}
            </p>
          </div>
        ) : (
          <>
            {!userCanEdit && selectedTrip && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <Lock size={18} className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  {t('common.viewOnlyHotels')}
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
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={14} />
                  {t('hotels.stay')}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="rounded-2xl bg-purple-50 p-3">
                  <p className="text-xs text-purple-500">{t('hotels.bookings')}</p>
                  <p className="text-xl font-bold text-purple-700 mt-1">
                    {selectedHotels.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-3">
                  <p className="text-xs text-green-500">Confirmed</p>
                  <p className="text-xl font-bold text-green-700 mt-1">
                    {getTripConfirmedHotelCount(selectedTrip)}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">{t('hotels.cost')}</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">
                    {formatMoney(selectedHotelTotal, 'CAD')}
                  </p>
                </div>
              </div>
            </div>

            {selectedHotels.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BedDouble size={30} className="text-purple-500" />
                </div>

                <h2 className="font-semibold text-gray-800">
                  {t('hotels.noHotelsTitle')}
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  {t('hotels.noHotelsBody')}
                </p>

                <button
                  type="button"
                  onClick={openAdd}
                  disabled={!userCanEdit}
                  className={`mt-5 rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 ${
                    userCanEdit
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={16} />
                  {t('hotels.addFirst')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedHotels.map((hotel) => {
                  const nights = getNights(hotel)
                  const totalCost = getHotelTotal(hotel)
                  const hotelMapUrl = getHotelMapUrl(hotel)

                  return (
                    <div
                      key={hotel.id}
                      className={`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 ${
                        hotel.status === 'cancelled' ? 'opacity-60 bg-gray-50' : ''
                      }`}
                    >
                      <div className="bg-white px-4 py-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl shrink-0">
                            🏨
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h2 className="font-bold text-gray-800 truncate">
                                {hotel.name}
                              </h2>

                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(
                                  hotel.status
                                )}`}
                              >
                                {getStatusLabel(hotel.status, t)}
                              </span>
                            </div>

                            {hotelMapUrl ? (
                              <a
                                href={hotelMapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full text-sm text-purple-600 active:bg-purple-50"
                              >
                                <MapPin size={12} className="shrink-0" />
                                <span className="truncate">
                                  {hotel.area || hotel.address || 'Open in Maps'}
                                </span>
                                <LinkIcon size={11} className="shrink-0 text-purple-400" />
                              </a>
                            ) : (
                              <p className="text-sm text-purple-600 flex items-center gap-1 mt-1 truncate">
                                <MapPin size={12} />
                                {hotel.area || 'No area'}
                              </p>
                            )}
                          </div>
                        </div>

                        {userCanEdit && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEdit(hotel)}
                              className="p-1 rounded-full hover:bg-gray-50"
                            >
                              <Pencil size={15} className="text-gray-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeHotel(hotel.id)}
                              className="p-1 rounded-full hover:bg-gray-50"
                            >
                              <Trash2 size={15} className="text-rose-400" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="px-4 pb-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-green-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-green-600">
                              <CalendarDays size={14} />
                              <p className="text-xs font-medium">{t('hotels.checkIn')}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {hotel.checkIn || t('common.notSet')}
                            </p>
                          </div>

                          <div className="bg-rose-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-rose-600">
                              <CalendarDays size={14} />
                              <p className="text-xs font-medium">{t('hotels.checkOut')}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {hotel.checkOut || t('common.notSet')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Users size={14} />
                              <span className="text-xs">{t('hotels.roomType')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {t('hotels.personRoom', { count: hotel.roomCapacity || '2' })}
                            </p>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <BedDouble size={14} />
                              <span className="text-xs">{t('hotels.roomsNights')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {hotel.rooms || 1} {Number(hotel.rooms || 1) > 1 ? t('hotels.rooms') : t('hotels.room')} · {nights}{' '}
                              {nights === 1 ? t('hotels.night') : t('hotels.nights')}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <CreditCard size={14} />
                              <span className="text-xs">{t('hotels.accommodationCost')}</span>
                            </div>

                            <p className="text-xs text-gray-500 mt-1">
                              {nights} {nights === 1 ? t('hotels.night') : t('hotels.nights')} ×{' '}
                              {hotel.rooms || 1} {Number(hotel.rooms || 1) > 1 ? t('hotels.rooms') : t('hotels.room')} ×{' '}
                              {formatMoney(hotel.pricePerNight || 0, hotel.currency)}
                            </p>
                          </div>

                          <p className="font-bold text-gray-800 shrink-0">
                            {formatMoney(totalCost, hotel.currency)}
                          </p>
                        </div>

                        {hotel.wifi && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                            <Wifi size={16} className="text-blue-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-blue-600 font-medium">WiFi</p>
                              <p className="text-sm font-mono text-gray-700">
                                {hotel.wifi}
                              </p>
                            </div>
                          </div>
                        )}

                        {(hotel.phone || hotel.address || hotelMapUrl) && (
                          <div className="border-t border-gray-50 pt-3 space-y-2">
                            {hotel.phone && (
                              <a
                                href={`tel:${hotel.phone}`}
                                className="text-xs text-gray-500 flex items-center gap-2"
                              >
                                <Phone size={13} />
                                {hotel.phone}
                              </a>
                            )}

                            {hotel.address && hotelMapUrl && (
                              <a
                                href={hotelMapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-gray-500 flex items-center gap-2 rounded-xl py-1 active:bg-purple-50"
                              >
                                <MapPin size={13} className="shrink-0" />
                                <span className="flex-1">{hotel.address}</span>
                                <LinkIcon size={12} className="text-purple-400 shrink-0" />
                              </a>
                            )}

                            {hotel.address && !hotelMapUrl && (
                              <p className="text-xs text-gray-500 flex items-center gap-2">
                                <MapPin size={13} />
                                {hotel.address}
                              </p>
                            )}

                            {hotelMapUrl && (
                              <a
                                href={hotelMapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-purple-600 font-medium flex items-center gap-2 rounded-xl py-1 active:bg-purple-50"
                              >
                                <LinkIcon size={13} />
                                {t('hotels.openGoogleMap')}
                              </a>
                            )}
                          </div>
                        )}

                        {hotel.notes && (
                          <div className="rounded-xl bg-amber-50 p-3">
                            <p className="text-xs font-medium text-amber-700 mb-1">
                              {t('timeline.notes')}
                            </p>
                            <p className="text-sm text-amber-800">{hotel.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <EditModal
          title={modal.mode === 'add' ? t('hotels.addBooking') : t('hotels.editBooking')}
          onClose={closeModal}
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-4 rounded-2xl bg-purple-50 p-4">
            <button
              type="button"
              onClick={() => setShowImportBox((value) => !value)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-purple-500">
                  <ClipboardPaste size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-purple-800">
                    {t('hotels.importTitle')}
                  </p>
                  <p className="text-xs text-purple-500 mt-0.5">
                    {t('hotels.importBody')}
                  </p>
                </div>
              </div>

              <ChevronDown
                size={18}
                className={`text-purple-500 shrink-0 transition ${
                  showImportBox ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showImportBox && (
              <div className="mt-4">
                <textarea
                  value={importText}
                  onChange={(event) => {
                    setImportText(event.target.value)
                    setImportMessage('')
                  }}
                  className="w-full min-h-36 rounded-xl border border-purple-100 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-purple-400 resize-none"
                  placeholder={t('hotels.importPlaceholder')}
                />

                {importMessage && (
                  <p className="text-xs text-purple-600 mt-2">
                    {importMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={importConfirmation}
                  className="mt-3 w-full bg-purple-500 text-white rounded-xl py-2.5 text-sm font-semibold"
                >
                  {t('hotels.autoFill')}
                </button>
              </div>
            )}
          </div>

          <InputField
            label={t('hotels.hotelName')}
            value={form.name}
            onChange={updateForm('name')}
            placeholder="Hilton Tokyo Bay"
          />

          <InputField
            label={t('hotels.area')}
            value={form.area}
            onChange={updateForm('area')}
            placeholder="Shinjuku, Tokyo"
          />

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('hotels.checkInDate')}
              type="date"
              value={form.checkIn}
              onChange={updateForm('checkIn')}
            />

            <InputField
              label={t('hotels.checkOutDate')}
              type="date"
              value={form.checkOut}
              onChange={updateForm('checkOut')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label={t('hotels.numberRooms')}
              type="number"
              value={form.rooms}
              onChange={updateForm('rooms')}
              placeholder="1"
            />

            <SelectField
              label={t('hotels.roomType')}
              value={form.roomCapacity}
              onChange={updateForm('roomCapacity')}
              options={ROOM_CAPACITY_OPTIONS.map((option) => ({
                ...option,
                label: t('hotels.personRoom', { count: option.value }),
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label={t('flights.currency')}
              value={form.currency}
              onChange={updateForm('currency')}
              options={CURRENCY_OPTIONS}
            />

            <InputField
              label={t('hotels.priceNight')}
              type="number"
              value={form.pricePerNight}
              onChange={updateForm('pricePerNight')}
              placeholder="0"
            />
          </div>

          <div className="mb-4 rounded-xl bg-purple-50 px-4 py-3">
            <p className="text-xs font-medium text-purple-600 mb-1">
              {t('hotels.autoTotal')}
            </p>
            <p className="text-sm font-semibold text-purple-800">
              {formatMoney(getHotelTotal(form), form.currency)}
            </p>
            <p className="text-xs text-purple-500 mt-1">
              {t('hotels.autoTotalBody')}
            </p>
          </div>

          <SelectField
            label={t('hotels.bookingStatus')}
            value={form.status}
            onChange={updateForm('status')}
            options={STATUS_OPTIONS.map((option) => ({
              ...option,
              label: t(`common.${option.value}`),
            }))}
          />

          <InputField
            label={t('hotels.bookingRef')}
            value={form.bookingRef}
            onChange={updateForm('bookingRef')}
            placeholder="Booking.com / Expedia / Hotel confirmation number"
          />

          <InputField
            label={t('timeline.mapsLink')}
            value={form.mapUrl}
            onChange={updateForm('mapUrl')}
            placeholder="https://maps.google.com/..."
          />

          <InputField
            label={t('hotels.wifiInfo')}
            value={form.wifi}
            onChange={updateForm('wifi')}
            placeholder="Network name / password"
          />

          <InputField
            label={t('hotels.phone')}
            value={form.phone}
            onChange={updateForm('phone')}
            placeholder="+81..."
          />

          <InputField
            label={t('hotels.address')}
            value={form.address}
            onChange={updateForm('address')}
            placeholder="Full hotel address"
          />

          <InputField
            label={t('timeline.notes')}
            value={form.notes}
            onChange={updateForm('notes')}
            placeholder="Check-in reminder, parking, breakfast, luggage storage..."
          />

          <button
            type="button"
            onClick={save}
            className="w-full bg-purple-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {modal.mode === 'add' ? t('hotels.saveBooking') : t('common.saveChanges')}
          </button>
        </EditModal>
      )}
    </div>
  )
}
