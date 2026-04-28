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
  Upload,
  Users,
  Wifi,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import { canEditTrip } from '../lib/tripCloud'
import { useTranslation } from '../lib/i18n'
import EditModal from '../components/EditModal'
import { InputField, SelectField } from '../components/InputField'
import FormSection from '../components/FormSection'

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

const PDFJS_SCRIPT_URL = '/pdfjs/pdf.min.js?v=20260428c'
const PDFJS_WORKER_URL = '/pdfjs/pdf.worker.min.js?v=20260428c'
let pdfJsLoadPromise = null

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

function getReadableError(error) {
  return [error?.name, error?.message].filter(Boolean).join(': ') || String(error || 'Unknown error')
}

function configurePdfJsWorker(pdfjsLib) {
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL
  }

  return pdfjsLib
}

function loadPdfJs() {
  if (window.pdfjsLib) {
    return Promise.resolve(configurePdfJsWorker(window.pdfjsLib))
  }

  if (pdfJsLoadPromise) {
    return pdfJsLoadPromise
  }

  pdfJsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${PDFJS_SCRIPT_URL}"]`)

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(configurePdfJsWorker(window.pdfjsLib)))
      existingScript.addEventListener('error', () => reject(new Error('PDF.js script failed to load.')))
      return
    }

    const script = document.createElement('script')
    script.src = PDFJS_SCRIPT_URL
    script.async = true
    script.onload = () => {
      if (window.pdfjsLib) {
        resolve(configurePdfJsWorker(window.pdfjsLib))
        return
      }

      reject(new Error('PDF.js loaded without browser API.'))
    }
    script.onerror = () => reject(new Error('PDF.js script failed to load.'))
    document.head.append(script)
  })

  return pdfJsLoadPromise
}

const MONTH_INDEX = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

const FIELD_LABEL_PATTERN =
  /^(hotel|property|accommodation|check|arrival|departure|booking|confirmation|reservation|address|phone|telephone|rooms?|guests?|adults?|total|amount|price|payment|paid|飯店|酒店|住宿|旅宿|入住|退房|訂單|預訂|確認|地址|電話|房間|客房|住客|成人|總計|合計|付款|金額)/i

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function cleanFieldValue(value) {
  return String(value || '')
    .replace(/^[\s:：#\-–—]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getLineValue(lines, keywords, options = {}) {
  const maxNextLines = options.maxNextLines ?? 2
  const blockedPattern = options.blockedPattern || null

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const matchedKeyword = keywords.find((keyword) =>
      line.toLowerCase().includes(keyword.toLowerCase())
    )

    if (!matchedKeyword) {
      continue
    }

    const inlineMatch = line.match(
      new RegExp(`${escapeRegex(matchedKeyword)}\\s*[:：#\\-–—]\\s*(.+)$`, 'i')
    )
    const valueFromLine = cleanFieldValue(
      inlineMatch?.[1] || line.replace(new RegExp(escapeRegex(matchedKeyword), 'ig'), '')
    )

    if (
      valueFromLine &&
      valueFromLine.toLowerCase() !== line.toLowerCase() &&
      !blockedPattern?.test(valueFromLine)
    ) {
      return valueFromLine
    }

    const nextValues = []

    for (let offset = 1; offset <= maxNextLines; offset += 1) {
      const nextLine = lines[index + offset]

      if (!nextLine) {
        break
      }

      if (blockedPattern?.test(nextLine)) {
        continue
      }

      if (FIELD_LABEL_PATTERN.test(nextLine) && nextValues.length > 0) {
        break
      }

      if (!FIELD_LABEL_PATTERN.test(nextLine) || options.allowLabelLikeValue) {
        nextValues.push(nextLine)
      }

      if (nextValues.length >= (options.maxValues || 1)) {
        break
      }
    }

    if (nextValues.length > 0) {
      return cleanFieldValue(nextValues.join(' '))
    }
  }

  return ''
}

function toIsoDate(year, month, day) {
  const fullYear = Number(year) < 100 ? Number(year) + 2000 : Number(year)
  const normalizedMonth = Number(month)
  const normalizedDay = Number(day)
  const date = new Date(fullYear, normalizedMonth - 1, normalizedDay)

  if (
    date.getFullYear() !== fullYear ||
    date.getMonth() !== normalizedMonth - 1 ||
    date.getDate() !== normalizedDay
  ) {
    return ''
  }

  return [
    String(fullYear).padStart(4, '0'),
    String(normalizedMonth).padStart(2, '0'),
    String(normalizedDay).padStart(2, '0'),
  ].join('-')
}

function normalizeDateText(value) {
  if (!value) {
    return ''
  }

  const normalizedValue = String(value)
    .replace(/[（(].*?[）)]/g, ' ')
    .replace(/星期[一二三四五六日天]|週[一二三四五六日天]/g, ' ')
    .replace(/\b(?:mon|tue|wed|thu|fri|sat|sun)(?:day)?\b,?/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const isoMatch = normalizedValue.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/)

  if (isoMatch) {
    return toIsoDate(isoMatch[1], isoMatch[2], isoMatch[3])
  }

  const chineseMatch = normalizedValue.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/)

  if (chineseMatch) {
    return toIsoDate(chineseMatch[1], chineseMatch[2], chineseMatch[3])
  }

  const yearFirstMatch = normalizedValue.match(/\b(\d{4})[/.](\d{1,2})[/.](\d{1,2})\b/)

  if (yearFirstMatch) {
    return toIsoDate(yearFirstMatch[1], yearFirstMatch[2], yearFirstMatch[3])
  }

  const monthNamePattern = Object.keys(MONTH_INDEX).join('|')
  const monthFirstMatch = normalizedValue.match(
    new RegExp(`\\b(${monthNamePattern})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{2,4})\\b`, 'i')
  )

  if (monthFirstMatch) {
    return toIsoDate(monthFirstMatch[3], MONTH_INDEX[monthFirstMatch[1].toLowerCase()], monthFirstMatch[2])
  }

  const dayFirstMatch = normalizedValue.match(
    new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNamePattern})\\.?[,]?\\s+(\\d{2,4})\\b`, 'i')
  )

  if (dayFirstMatch) {
    return toIsoDate(dayFirstMatch[3], MONTH_INDEX[dayFirstMatch[2].toLowerCase()], dayFirstMatch[1])
  }

  const numericMatch = normalizedValue.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/)

  if (numericMatch) {
    const first = Number(numericMatch[1])
    const second = Number(numericMatch[2])
    const month = first > 12 ? second : first
    const day = first > 12 ? first : second
    return toIsoDate(numericMatch[3], month, day)
  }

  return ''
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

function getMoneyMatches(line) {
  return [...line.matchAll(
    /(CAD|CA\$|USD|US\$|TWD|NTD|NT\$|JPY|¥|EUR|€|\$)\s*([0-9][0-9,]*(?:\.\d{1,2})?)|([0-9][0-9,]*(?:\.\d{1,2})?)\s*(CAD|USD|TWD|NTD|JPY|EUR|日圓|台幣|新台幣)/gi
  )]
}

function scoreMoneyLine(line) {
  let score = 0

  if (/grand total|total price|booking total|total amount|amount paid|total paid|總計|合計|總額|付款金額|已付款|實付|房價總額|住宿總價/i.test(line)) {
    score += 12
  }

  if (/total|amount|price|payment|paid|charge|住宿費|房費|金額|付款/i.test(line)) {
    score += 6
  }

  if (/tax|fee|deposit|discount|coupon|credit|saving|refund|per night|nightly|稅|服務費|押金|折扣|優惠|退款|每晚/i.test(line)) {
    score -= 8
  }

  return score
}

function extractAmount(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const candidates = lines.flatMap((line, index) => {
    const context = [lines[index - 1], line, lines[index + 1]].filter(Boolean).join(' ')
    const score = scoreMoneyLine(context)

    return getMoneyMatches(line).map((match) => {
      const amount = Number((match[2] || match[3] || '').replace(/,/g, ''))

      return {
        amount,
        currency: normalizeCurrency(match[1] || match[4] || line),
        score,
        index,
      }
    })
  }).filter((candidate) => candidate.amount > 0)

  if (candidates.length === 0) {
    return {
      amount: '',
      currency: 'CAD',
    }
  }

  const bestCandidate = candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score
    }

    if (b.amount !== a.amount) {
      return b.amount - a.amount
    }

    return a.index - b.index
  })[0]

  return {
    amount: Number.isNaN(bestCandidate.amount) ? '' : bestCandidate.amount,
    currency: bestCandidate.currency,
  }
}

function extractMapUrl(text) {
  const mapMatch = text.match(/https?:\/\/[^\s]+(?:maps\.google|goo\.gl\/maps|google\.com\/maps)[^\s]*/i)

  if (!mapMatch) {
    return ''
  }

  return mapMatch[0].replace(/[),.]+$/, '')
}

function extractDateCandidates(value) {
  const source = String(value || '')
  const candidates = [
    ...source.matchAll(/\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日?/g),
    ...source.matchAll(/\b\d{4}[/. -]\d{1,2}[/. -]\d{1,2}\b/g),
    ...source.matchAll(/\b(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\.?\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{2,4}\b/gi),
    ...source.matchAll(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\.?[,]?\s+\d{2,4}\b/gi),
    ...source.matchAll(/\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b/g),
  ]

  return [...new Set(candidates.map((match) => normalizeDateText(match[0])).filter(Boolean))]
}

function getDateFromField(lines, keywords) {
  const fieldValue = getLineValue(lines, keywords, { maxNextLines: 3, allowLabelLikeValue: true })
  const fieldDates = extractDateCandidates(fieldValue)

  if (fieldDates.length > 0) {
    return fieldDates[0]
  }

  return normalizeDateText(fieldValue)
}

function extractStayDates(lines) {
  let checkIn = getDateFromField(lines, [
    'Check-in date',
    'Check in date',
    'Check-in',
    'Check in',
    'Arrival date',
    'Arrival',
    '入住日期',
    '入住時間',
    '入住',
  ])
  let checkOut = getDateFromField(lines, [
    'Check-out date',
    'Check out date',
    'Check-out',
    'Check out',
    'Departure date',
    'Departure',
    '退房日期',
    '退房時間',
    '退房',
  ])

  if (checkIn && checkOut) {
    return { checkIn, checkOut }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const context = [lines[index], lines[index + 1], lines[index + 2]].filter(Boolean).join(' ')

    if (!checkIn && /check.?in|arrival|入住/i.test(context)) {
      checkIn = extractDateCandidates(context)[0] || checkIn
    }

    if (!checkOut && /check.?out|departure|退房/i.test(context)) {
      checkOut = extractDateCandidates(context)[0] || checkOut
    }

    if ((!checkIn || !checkOut) && /stay dates|dates of stay|住宿期間|入住.*退房|check.?in.*check.?out/i.test(context)) {
      const dateCandidates = extractDateCandidates(context)

      if (dateCandidates.length >= 2) {
        checkIn = checkIn || dateCandidates[0]
        checkOut = checkOut || dateCandidates[1]
      }
    }
  }

  return { checkIn, checkOut }
}

function extractHotelName(lines, currentName) {
  const specificName = getLineValue(lines, [
    'Hotel name',
    'Property name',
    'Accommodation name',
    'Name of accommodation',
    'Stay name',
    '住宿名稱',
    '飯店名稱',
    '酒店名稱',
    '旅宿名稱',
    '住宿設施名稱',
  ], {
    maxNextLines: 2,
    blockedPattern: /address|phone|booking|confirmation|check|入住|退房|地址|電話|訂單|確認/i,
  })

  if (specificName) {
    return specificName
  }

  const bookingTitle = lines.find((line) =>
    /your booking at|booking confirmed at|reservation at|您在|你的.*訂房|預訂成功/i.test(line)
  )
  const titleMatch = bookingTitle?.match(/(?:your booking at|booking confirmed at|reservation at)\s+(.+)$/i)

  return cleanFieldValue(titleMatch?.[1]) || currentName
}

function extractIntegerFromText(value) {
  const match = String(value || '').match(/\d+/)
  return match ? Number(match[0]) : ''
}

function extractRoomCount(lines, currentRooms) {
  const roomsText = getLineValue(lines, [
    'Number of rooms',
    'Rooms',
    'Room(s)',
    '客房數量',
    '房間數',
    '客房',
    '房間',
  ])
  const rooms = extractIntegerFromText(roomsText)

  if (rooms) {
    return rooms
  }

  const roomLine = lines.find((line) => /\b\d+\s*rooms?\b|\d+\s*(?:間客房|間房|房間)/i.test(line))
  return extractIntegerFromText(roomLine) || currentRooms
}

function extractGuestCapacity(lines, currentCapacity) {
  const guestText = getLineValue(lines, [
    'Number of guests',
    'Guests',
    'Adults',
    '入住人數',
    '住客人數',
    '住客',
    '成人',
  ])
  const guests = extractIntegerFromText(guestText)

  if (guests) {
    return String(Math.min(Math.max(guests, 1), 6))
  }

  const guestLine = lines.find((line) => /\b\d+\s*(?:adults?|guests?)\b|\d+\s*(?:位成人|位住客|人入住)/i.test(line))
  const guestCount = extractIntegerFromText(guestLine)
  return guestCount ? String(Math.min(Math.max(guestCount, 1), 6)) : currentCapacity
}

function extractBookingReference(lines, currentBookingRef) {
  const fieldValue = getLineValue(lines, [
    'Booking ID',
    'Booking number',
    'Booking reference',
    'Confirmation number',
    'Confirmation code',
    'Reservation number',
    'Reservation code',
    'Itinerary number',
    '訂單編號',
    '訂房編號',
    '預訂編號',
    '預約編號',
    '確認號碼',
    '確認編號',
  ], {
    maxNextLines: 1,
    blockedPattern: /pin|password|入住|退房|地址|電話/i,
  })
  const cleanRef = fieldValue.match(/[A-Z0-9][A-Z0-9-]{4,}/i)?.[0]

  return cleanRef || currentBookingRef
}

function detectPlatform(text) {
  const upperText = text.toUpperCase()

  if (upperText.includes('AIRBNB')) {
    return 'airbnb'
  }

  if (upperText.includes('AGODA')) {
    return 'agoda'
  }

  if (upperText.includes('BOOKING.COM')) {
    return 'booking'
  }

  return 'generic'
}

function parseAirbnbConfirmation(text, currentForm) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  // Airbnb specific patterns
  const reservationMatch = text.match(/Reservation\s+(?:ID|#|Number)[\s:]*([A-Z0-9]+)/i)
  const bookingRef = reservationMatch?.[1] ||
    getLineValue(lines, ['Reservation ID', 'Booking ID', 'Confirmation ID', '預約編號'], { maxNextLines: 1 }) ||
    currentForm.bookingRef

  // Airbnb typically lists the property name prominently
  const name = extractHotelName(lines, currentForm.name) ||
    getLineValue(lines, ['Property', 'Listing', '房源'], { maxNextLines: 1 }) ||
    currentForm.name

  // Extract dates from Airbnb format
  const stayDates = extractStayDates(lines)
  let checkIn = stayDates.checkIn || currentForm.checkIn
  let checkOut = stayDates.checkOut || currentForm.checkOut

  // Airbnb specific date patterns (e.g., "Check-in: January 15, 2025")
  if (!checkIn || !checkOut) {
    const checkInMatch = text.match(/Check[\s-]?in[\s:]*([^,\n]+)/i)
    const checkOutMatch = text.match(/Check[\s-]?out[\s:]*([^,\n]+)/i)

    if (checkInMatch) {
      checkIn = normalizeDateText(checkInMatch[1]) || checkIn
    }
    if (checkOutMatch) {
      checkOut = normalizeDateText(checkOutMatch[1]) || checkOut
    }
  }

  // Airbnb usually lists guest count, not room count
  const guestMatch = text.match(/(\d+)\s*(?:guest|person|traveller)/i)
  const guests = guestMatch ? Number(guestMatch[1]) : currentForm.rooms

  // Extract address from Airbnb
  const address =
    getLineValue(lines, ['Address', 'Location', '地址', '位置'], {
      maxNextLines: 2,
      maxValues: 2,
    }) ||
    currentForm.address

  // Extract price
  const priceMatch = text.match(/Total\s*(?:price|amount|cost)[\s:]*([A-Z]{3})\s*([0-9,]+(?:\.\d{2})?)/i)
  let amount
  let currency

  if (priceMatch) {
    currency = priceMatch[1]
    amount = Number(priceMatch[2].replace(/,/g, ''))
  } else {
    const { amount: extractedAmount, currency: extractedCurrency } = extractAmount(text)
    amount = extractedAmount
    currency = extractedCurrency || currentForm.currency
  }

  const nights = getNights({ checkIn, checkOut })
  const calculatedPricePerNight = amount && nights > 0 ? amount / nights : currentForm.pricePerNight

  return {
    name,
    checkIn,
    checkOut,
    rooms: guests > 0 ? guests : currentForm.rooms,
    roomCapacity: String(guests || currentForm.roomCapacity),
    bookingRef,
    address,
    phone: currentForm.phone,
    status: 'confirmed',
    currency,
    pricePerNight: calculatedPricePerNight ? Number(calculatedPricePerNight.toFixed(2)) : currentForm.pricePerNight,
    totalCost: amount || currentForm.totalCost,
  }
}

function parseAgodaConfirmation(text, currentForm) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  // Agoda specific patterns
  const confirmMatch = text.match(/(?:Confirmation\s+Number|確認號碼?)[\s:]*([A-Z0-9-]+)/i)
  const bookingRef = confirmMatch?.[1] ||
    getLineValue(lines, ['Confirmation Number', 'Reference Number', 'Booking Reference', '確認號', '訂位編號'], { maxNextLines: 1 }) ||
    currentForm.bookingRef

  // Hotel name (usually clearly labeled in Agoda)
  const name = extractHotelName(lines, currentForm.name) ||
    getLineValue(lines, ['Hotel', 'Property', 'Accommodation', '酒店'], { maxNextLines: 1 }) ||
    currentForm.name

  // Extract dates
  const stayDates = extractStayDates(lines)
  const checkIn = stayDates.checkIn || currentForm.checkIn
  const checkOut = stayDates.checkOut || currentForm.checkOut

  // Extract room details
  const rooms = extractRoomCount(lines, currentForm.rooms)
  const roomCapacity = extractGuestCapacity(lines, currentForm.roomCapacity)

  // Address information
  const address =
    getLineValue(lines, ['Address', 'Hotel address', '地址', '飯店地址'], {
      maxNextLines: 2,
      maxValues: 2,
    }) ||
    currentForm.address

  // Phone number
  const phone =
    getLineValue(lines, ['Phone', 'Telephone', 'Tel', '電話'], {
      maxNextLines: 1,
    }) ||
    currentForm.phone

  // Price extraction - Agoda usually shows total
  const { amount, currency } = extractAmount(text)
  const nights = getNights({ checkIn, checkOut })
  const calculatedPricePerNight = amount && nights > 0 && rooms > 0 ? amount / nights / rooms : currentForm.pricePerNight

  return {
    name,
    checkIn,
    checkOut,
    rooms,
    roomCapacity,
    bookingRef,
    address,
    phone,
    status: 'confirmed',
    currency: amount ? currency : currentForm.currency,
    pricePerNight: calculatedPricePerNight ? Number(calculatedPricePerNight.toFixed(2)) : currentForm.pricePerNight,
    totalCost: amount || currentForm.totalCost,
  }
}

function parseBookingComConfirmation(text, currentForm) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  // Booking.com specific patterns
  const bookingMatch = text.match(/(?:Booking\s+(?:Confirmation\s+)?Number|Booking\s+Reference)[\s:]*([A-Z0-9-]+)/i)
  const bookingRef = bookingMatch?.[1] ||
    getLineValue(lines, ['Booking Number', 'Confirmation Number', 'Booking Reference', '訂位編號'], { maxNextLines: 1 }) ||
    currentForm.bookingRef

  // Hotel name
  const name = extractHotelName(lines, currentForm.name) ||
    getLineValue(lines, ['Property name', 'Hotel', 'Accommodation', '飯店名稱'], { maxNextLines: 1 }) ||
    currentForm.name

  // Extract dates - Booking.com has clear check-in/check-out labels
  const stayDates = extractStayDates(lines)
  let checkIn = stayDates.checkIn || currentForm.checkIn
  let checkOut = stayDates.checkOut || currentForm.checkOut

  // Booking.com specific date patterns
  if (!checkIn || !checkOut) {
    const checkInMatch = text.match(/(?:Check-in|Check[\s-]?in)[\s:]*([^,\n]+)/i)
    const checkOutMatch = text.match(/(?:Check-out|Check[\s-]?out)[\s:]*([^,\n]+)/i)

    if (checkInMatch) {
      checkIn = normalizeDateText(checkInMatch[1]) || checkIn
    }
    if (checkOutMatch) {
      checkOut = normalizeDateText(checkOutMatch[1]) || checkOut
    }
  }

  // Room and guest info
  const rooms = extractRoomCount(lines, currentForm.rooms)
  const roomCapacity = extractGuestCapacity(lines, currentForm.roomCapacity)

  // Address
  const address =
    getLineValue(lines, ['Address', 'Property address', 'Street address', '地址'], {
      maxNextLines: 2,
      maxValues: 2,
    }) ||
    currentForm.address

  // Phone
  const phone =
    getLineValue(lines, ['Phone', 'Telephone', 'Contact number', '電話'], {
      maxNextLines: 1,
    }) ||
    currentForm.phone

  // Price - Booking.com often shows "Total price", "Amount paid", etc.
  const totalMatch = text.match(/(?:Total\s+(?:price|amount)|Amount\s+(?:to\s+)?pay)[\s:]*([A-Z]{3})\s*([0-9,]+(?:\.\d{2})?)/i)
  let amount
  let currency

  if (totalMatch) {
    currency = totalMatch[1]
    amount = Number(totalMatch[2].replace(/,/g, ''))
  } else {
    const { amount: extractedAmount, currency: extractedCurrency } = extractAmount(text)
    amount = extractedAmount
    currency = extractedCurrency || currentForm.currency
  }

  const nights = getNights({ checkIn, checkOut })
  const calculatedPricePerNight = amount && nights > 0 && rooms > 0 ? amount / nights / rooms : currentForm.pricePerNight

  return {
    name,
    checkIn,
    checkOut,
    rooms,
    roomCapacity,
    bookingRef,
    address,
    phone,
    status: 'confirmed',
    currency,
    pricePerNight: calculatedPricePerNight ? Number(calculatedPricePerNight.toFixed(2)) : currentForm.pricePerNight,
    totalCost: amount || currentForm.totalCost,
  }
}

function parseHotelConfirmation(text, currentForm) {
  const platform = detectPlatform(text)

  let importedData

  switch (platform) {
    case 'airbnb':
      importedData = parseAirbnbConfirmation(text, currentForm)
      break
    case 'agoda':
      importedData = parseAgodaConfirmation(text, currentForm)
      break
    case 'booking':
      importedData = parseBookingComConfirmation(text, currentForm)
      break
    default: {
      // Generic parsing fallback
      const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const name = extractHotelName(lines, currentForm.name)
      const stayDates = extractStayDates(lines)
      const checkIn = stayDates.checkIn || currentForm.checkIn
      const checkOut = stayDates.checkOut || currentForm.checkOut
      const bookingRef = extractBookingReference(lines, currentForm.bookingRef)

      const address =
        getLineValue(lines, ['Hotel address', 'Property address', 'Address', '地址', '飯店地址', '酒店地址'], {
          maxNextLines: 3,
          maxValues: 2,
        }) ||
        currentForm.address

      const phone =
        getLineValue(lines, ['Phone', 'Telephone', 'Hotel phone', 'Contact number', '電話', '聯絡電話'], {
          maxNextLines: 2,
        }) ||
        currentForm.phone

      const rooms = extractRoomCount(lines, currentForm.rooms)
      const roomCapacity = extractGuestCapacity(lines, currentForm.roomCapacity)

      const { amount, currency } = extractAmount(text)
      const nights = getNights({ checkIn, checkOut })
      const calculatedPricePerNight = amount && nights > 0 && rooms > 0 ? amount / nights / rooms : currentForm.pricePerNight
      const mapUrl = extractMapUrl(text) || currentForm.mapUrl

      importedData = {
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
      break
    }
  }

  if (!currentForm.area && importedData.address) {
    importedData.area = importedData.address.split(',')[0]
  }

  return importedData
}

async function extractTextFromPdf(file) {
  const pdfjsLib = await loadPdfJs()
  const fileData = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(fileData),
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  const pageTexts = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const rows = textContent.items.reduce((lineGroups, item) => {
      const y = Math.round(item.transform[5])
      const matchingLine = lineGroups.find((line) => Math.abs(line.y - y) <= 3)

      if (matchingLine) {
        matchingLine.items.push(item)
        return lineGroups
      }

      lineGroups.push({
        y,
        items: [item],
      })

      return lineGroups
    }, [])
    const pageText = rows
      .sort((a, b) => b.y - a.y)
      .map((line) =>
        line.items
          .sort((a, b) => a.transform[4] - b.transform[4])
          .map((item) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      )
      .filter(Boolean)
      .join('\n')

    if (pageText) {
      pageTexts.push(pageText)
    }
  }

  return pageTexts.join('\n')
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
  const [importFileName, setImportFileName] = useState('')
  const [isImportingPdf, setIsImportingPdf] = useState(false)
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(false)

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
    setImportFileName('')
    setIsImportingPdf(false)
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

    setOptionalDetailsOpen(false)
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

    setOptionalDetailsOpen(false)
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
    setOptionalDetailsOpen(false)
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

  const applyImportedHotelText = (text) => {
    if (!userCanEdit) {
      setImportMessage(t('common.noEditPermission'))
      return
    }

    if (!text.trim()) {
      setImportMessage(t('hotels.pasteFirst'))
      return
    }

    setForm((currentForm) => {
      const importedData = parseHotelConfirmation(text, currentForm)
      const updatedForm = {
        ...currentForm,
        ...importedData,
      }

      updatedForm.totalCost = getHotelTotal(updatedForm)

      return updatedForm
    })

    setOptionalDetailsOpen(true)
    setImportMessage(t('hotels.imported'))
  }

  const importConfirmation = () => {
    applyImportedHotelText(importText)
  }

  const importPdfFile = async (file) => {
    if (!file) {
      return
    }

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setImportMessage(t('hotels.pdfOnly'))
      return
    }

    setIsImportingPdf(true)
    setImportFileName(file.name)
    setImportMessage(t('hotels.readingPdf'))

    try {
      const pdfText = await extractTextFromPdf(file)
      setImportText(pdfText)
      applyImportedHotelText(pdfText)
    } catch (error) {
      setImportMessage(t('hotels.pdfReadFailedDetail', { error: getReadableError(error) }))
    } finally {
      setIsImportingPdf(false)
    }
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
                <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-white px-4 py-5 text-center active:bg-purple-50">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-purple-50 text-purple-500">
                    <Upload size={20} />
                  </div>
                  <p className="text-sm font-semibold text-purple-800">
                    {isImportingPdf ? t('hotels.readingPdf') : t('hotels.choosePdf')}
                  </p>
                  <p className="mt-1 text-xs text-purple-500">
                    {importFileName || t('hotels.choosePdfBody')}
                  </p>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    disabled={isImportingPdf}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      importPdfFile(file)
                      event.target.value = ''
                    }}
                  />
                </label>

                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-purple-100" />
                  <span className="text-xs font-medium text-purple-400">
                    {t('hotels.orPasteText')}
                  </span>
                  <div className="h-px flex-1 bg-purple-100" />
                </div>

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

          <FormSection
            title={t('form.requiredInfo')}
            description={t('hotels.requiredSectionBody')}
            defaultOpen
            tone="purple"
          >
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
          </FormSection>

          <FormSection
            title={t('hotels.stayCostSection')}
            description={t('hotels.stayCostSectionBody')}
            defaultOpen
            tone="purple"
          >
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
          </FormSection>

          <FormSection
            title={t('form.optionalDetails')}
            description={t('hotels.optionalSectionBody')}
            open={optionalDetailsOpen}
            onOpenChange={setOptionalDetailsOpen}
            tone="gray"
          >
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
          </FormSection>

          <div className="sticky bottom-0 -mx-5 mt-2 border-t border-gray-100 bg-white px-5 py-4">
            <button
              type="button"
              onClick={save}
              className="w-full bg-purple-500 text-white rounded-xl py-3 font-semibold text-sm shadow-sm"
            >
              {modal.mode === 'add' ? t('hotels.saveBooking') : t('common.saveChanges')}
            </button>
          </div>
        </EditModal>
      )}
    </div>
  )
}
