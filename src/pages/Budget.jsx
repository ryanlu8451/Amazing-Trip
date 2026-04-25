import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  Pencil,
  PieChart,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import { canEditTrip } from '../lib/tripCloud'
import { useTranslation } from '../lib/i18n'
import EditModal from '../components/EditModal'
import { InputField, SelectField } from '../components/InputField'

const CATEGORY_OPTIONS = [
  { value: 'flight', label: '✈️ Flights', emoji: '✈️', defaultLabel: 'Flights' },
  { value: 'hotel', label: '🏨 Accommodation', emoji: '🏨', defaultLabel: 'Accommodation' },
  { value: 'transport', label: '🚆 Transportation', emoji: '🚆', defaultLabel: 'Transportation' },
  { value: 'food', label: '🍜 Food', emoji: '🍜', defaultLabel: 'Food' },
  { value: 'activity', label: '🎡 Activities', emoji: '🎡', defaultLabel: 'Activities' },
  { value: 'shopping', label: '🛍️ Shopping', emoji: '🛍️', defaultLabel: 'Shopping' },
  { value: 'insurance', label: '🛡️ Insurance', emoji: '🛡️', defaultLabel: 'Insurance' },
  { value: 'misc', label: '💼 Miscellaneous', emoji: '💼', defaultLabel: 'Miscellaneous' },
  { value: 'custom', label: '✨ Custom Category', emoji: '✨', defaultLabel: '' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
]

const BOOKING_STATUS_OPTIONS = [
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

const COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-gray-400',
  'bg-teal-500',
  'bg-orange-500',
]

const emptyBudgetSettings = {
  budgetLimit: '',
  budgetCurrency: 'CAD',
}

const emptyAllocation = {
  itemType: 'allocation',
  category: 'flight',
  label: 'Flights',
  emoji: '✈️',
  amount: '',
}

const emptyExpense = {
  itemType: 'expense',
  category: 'misc',
  label: 'Miscellaneous',
  emoji: '💼',
  amount: '',
  paymentStatus: 'paid',
  note: '',
}

function getCategoryMeta(category) {
  const foundCategory = CATEGORY_OPTIONS.find((item) => item.value === category)

  if (foundCategory) {
    return foundCategory
  }

  return CATEGORY_OPTIONS.find((item) => item.value === 'misc')
}

function formatMoney(amount, currency) {
  return `${currency || 'CAD'} ${Number(amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`
}

function getHotelNights(hotel) {
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
  if (hotel.totalCost !== undefined && hotel.totalCost !== null && Number(hotel.totalCost) > 0) {
    return Number(hotel.totalCost)
  }

  return getHotelNights(hotel) * Number(hotel.rooms || 0) * Number(hotel.pricePerNight || 0)
}

function getFlightActualSummary(trip) {
  const flights = trip?.flights || []

  const paid = flights
    .filter((flight) => flight.status === 'confirmed')
    .reduce((sum, flight) => sum + Number(flight.price || 0), 0)

  const pending = flights
    .filter((flight) => flight.status === 'pending')
    .reduce((sum, flight) => sum + Number(flight.price || 0), 0)

  return {
    source: 'auto-flight',
    category: 'flight',
    emoji: '✈️',
    label: 'Flights',
    paid,
    pending,
    total: paid + pending,
  }
}

function getHotelActualSummary(trip) {
  const hotels = trip?.hotels || []

  const paid = hotels
    .filter((hotel) => hotel.status === 'confirmed')
    .reduce((sum, hotel) => sum + getHotelTotal(hotel), 0)

  const pending = hotels
    .filter((hotel) => hotel.status === 'pending')
    .reduce((sum, hotel) => sum + getHotelTotal(hotel), 0)

  return {
    source: 'auto-hotel',
    category: 'hotel',
    emoji: '🏨',
    label: 'Accommodation',
    paid,
    pending,
    total: paid + pending,
  }
}

function getManualExpenseSummaries(expenses) {
  const summaries = {}

  expenses.forEach((expense) => {
    const key = expense.category || expense.label || expense.id
    const meta = getCategoryMeta(expense.category)

    if (!summaries[key]) {
      summaries[key] = {
        source: 'manual',
        category: expense.category || 'misc',
        emoji: expense.emoji || meta.emoji,
        label: expense.label || meta.defaultLabel,
        paid: 0,
        pending: 0,
        total: 0,
      }
    }

    if (expense.paymentStatus === 'pending') {
      summaries[key].pending += Number(expense.amount || 0)
    } else {
      summaries[key].paid += Number(expense.amount || 0)
    }

    summaries[key].total += Number(expense.amount || 0)
  })

  return Object.values(summaries)
}

function getBudgetLimit(trip) {
  return Number(trip?.budgetLimit || trip?.totalBudget || 0)
}

function getBudgetCurrency(trip) {
  return trip?.budgetCurrency || trip?.currency || 'CAD'
}

function getAllocationItems(trip) {
  return (trip?.budget || []).filter((item) => item.itemType !== 'expense')
}

function getExpenseItems(trip) {
  return (trip?.budget || []).filter((item) => item.itemType === 'expense')
}

function getVisibleActualSummaries(trip) {
  const manualExpenses = getExpenseItems(trip)
  const summaries = [
    getFlightActualSummary(trip),
    getHotelActualSummary(trip),
    ...getManualExpenseSummaries(manualExpenses),
  ]

  return summaries.filter((item) => item.total > 0)
}

export default function Budget() {
  const {
    trips,
    activeTripId,
    setActiveTrip,
    updateTrip,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    updateFlight,
    updateHotel,
  } = useTripStore()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const [showTripPicker, setShowTripPicker] = useState(false)
  const [settingsModal, setSettingsModal] = useState(false)
  const [allocationModal, setAllocationModal] = useState(null)
  const [expenseModal, setExpenseModal] = useState(null)
  const [sourceModal, setSourceModal] = useState(null)

  const [settingsForm, setSettingsForm] = useState(emptyBudgetSettings)
  const [allocationForm, setAllocationForm] = useState(emptyAllocation)
  const [expenseForm, setExpenseForm] = useState(emptyExpense)
  const [sourceEditForm, setSourceEditForm] = useState([])
  const [error, setError] = useState('')

  const selectedTrip = trips.find((trip) => trip.id === activeTripId) || trips[0] || null
  const userCanEdit = canEditTrip(selectedTrip, user)

  const budgetCurrency = getBudgetCurrency(selectedTrip)
  const budgetLimit = getBudgetLimit(selectedTrip)
  const allocationItems = getAllocationItems(selectedTrip)
  const expenseItems = getExpenseItems(selectedTrip)
  const actualSummaries = getVisibleActualSummaries(selectedTrip)

  const allocatedTotal = allocationItems.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  const paidTotal = actualSummaries.reduce(
    (sum, item) => sum + Number(item.paid || 0),
    0
  )

  const pendingTotal = actualSummaries.reduce(
    (sum, item) => sum + Number(item.pending || 0),
    0
  )

  const projectedTotal = paidTotal + pendingTotal
  const balance = budgetLimit - paidTotal
  const projectedBalance = budgetLimit - projectedTotal
  const isOverBudget = budgetLimit > 0 && paidTotal > budgetLimit
  const isProjectedOverBudget = budgetLimit > 0 && projectedTotal > budgetLimit

  const selectTrip = (tripId) => {
    setActiveTrip(tripId)
    setShowTripPicker(false)
  }

  const openSettings = () => {
    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setShowTripPicker(false)
    setSettingsForm({
      budgetLimit: selectedTrip?.budgetLimit || selectedTrip?.totalBudget || '',
      budgetCurrency,
    })
    setError('')
    setSettingsModal(true)
  }

  const saveSettings = () => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setActiveTrip(selectedTrip.id)
    updateTrip({
      budgetLimit: Number(settingsForm.budgetLimit || 0),
      budgetCurrency: settingsForm.budgetCurrency || 'CAD',
    })

    setSettingsModal(false)
  }

  const updateCategoryForm = (mode, category) => {
    const meta = getCategoryMeta(category)

    if (mode === 'allocation') {
      setAllocationForm((form) => ({
        ...form,
        category,
        emoji: meta.emoji,
        label: category === 'custom' ? '' : meta.defaultLabel,
      }))
    } else {
      setExpenseForm((form) => ({
        ...form,
        category,
        emoji: meta.emoji,
        label: category === 'custom' ? '' : meta.defaultLabel,
      }))
    }
  }

  const openAddAllocation = () => {
    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setAllocationForm(emptyAllocation)
    setError('')
    setAllocationModal({
      mode: 'add',
      itemId: '',
    })
  }

  const openEditAllocation = (item) => {
    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    const meta = getCategoryMeta(item.category || 'custom')

    setAllocationForm({
      ...emptyAllocation,
      ...item,
      category: item.category || 'custom',
      emoji: item.emoji || meta.emoji,
      label: item.label || meta.defaultLabel,
    })
    setError('')
    setAllocationModal({
      mode: 'edit',
      itemId: item.id,
    })
  }

  const saveAllocation = () => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    if (!allocationForm.label || Number(allocationForm.amount || 0) <= 0) {
      setError(t('budget.required'))
      return
    }

    const savedItem = {
      ...allocationForm,
      itemType: 'allocation',
      amount: Number(allocationForm.amount || 0),
    }

    setActiveTrip(selectedTrip.id)

    if (allocationModal.mode === 'add') {
      addBudgetItem(savedItem)
    } else {
      updateBudgetItem(allocationModal.itemId, savedItem)
    }

    setAllocationModal(null)
  }

  const openAddExpense = () => {
    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setExpenseForm(emptyExpense)
    setError('')
    setExpenseModal({
      mode: 'add',
      itemId: '',
    })
  }

  const openEditExpense = (item) => {
    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    const meta = getCategoryMeta(item.category || 'custom')

    setExpenseForm({
      ...emptyExpense,
      ...item,
      category: item.category || 'custom',
      emoji: item.emoji || meta.emoji,
      label: item.label || meta.defaultLabel,
      paymentStatus: item.paymentStatus || 'paid',
    })
    setError('')
    setExpenseModal({
      mode: 'edit',
      itemId: item.id,
    })
  }

  const saveExpense = () => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    if (!expenseForm.label || Number(expenseForm.amount || 0) <= 0) {
      setError(t('budget.required'))
      return
    }

    const savedItem = {
      ...expenseForm,
      itemType: 'expense',
      amount: Number(expenseForm.amount || 0),
    }

    setActiveTrip(selectedTrip.id)

    if (expenseModal.mode === 'add') {
      addBudgetItem(savedItem)
    } else {
      updateBudgetItem(expenseModal.itemId, savedItem)
    }

    setExpenseModal(null)
  }

  const removeBudgetItem = (itemId) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    const confirmed = window.confirm(t('budget.deleteConfirm'))

    if (confirmed) {
      setActiveTrip(selectedTrip.id)
      deleteBudgetItem(itemId)
    }
  }

  const openSourceEditor = (summary) => {
    if (!selectedTrip) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    if (summary.source === 'auto-flight') {
      setSourceEditForm(
        (selectedTrip.flights || []).map((flight) => ({
          id: flight.id,
          title: `${flight.airline || 'Flight'} ${flight.code || ''}`.trim(),
          subtitle: `${flight.fromAirport || 'From'} → ${flight.toAirport || 'To'}`,
          amount: flight.price || '',
          currency: flight.currency || budgetCurrency,
          status: flight.status || 'pending',
        }))
      )

      setSourceModal({
        type: 'flight',
        title: t('budget.editFlightSpending'),
      })
      return
    }

    if (summary.source === 'auto-hotel') {
      setSourceEditForm(
        (selectedTrip.hotels || []).map((hotel) => ({
          id: hotel.id,
          title: hotel.name || 'Hotel Booking',
          subtitle: `${hotel.checkIn || 'Check-in'} → ${hotel.checkOut || 'Check-out'}`,
          amount: getHotelTotal(hotel) || '',
          currency: hotel.currency || budgetCurrency,
          status: hotel.status || 'pending',
        }))
      )

      setSourceModal({
        type: 'hotel',
        title: t('budget.editHotelSpending'),
      })
      return
    }

    const matchedExpense = expenseItems.find(
      (item) => item.category === summary.category || item.label === summary.label
    )

    if (matchedExpense) {
      openEditExpense(matchedExpense)
    }
  }

  const updateSourceItem = (itemId, key, value) => {
    setSourceEditForm((items) =>
      items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    )
  }

  const saveSourceEditor = () => {
    if (!selectedTrip || !sourceModal) {
      return
    }

    if (!userCanEdit) {
      setError(t('common.noEditPermission'))
      return
    }

    setActiveTrip(selectedTrip.id)

    sourceEditForm.forEach((item) => {
      if (sourceModal.type === 'flight') {
        const originalFlight = (selectedTrip.flights || []).find(
          (flight) => flight.id === item.id
        )

        if (originalFlight) {
          updateFlight(item.id, {
            ...originalFlight,
            price: item.amount === '' ? '' : Number(item.amount),
            currency: item.currency || budgetCurrency,
            status: item.status || originalFlight.status || 'pending',
          })
        }
      }

      if (sourceModal.type === 'hotel') {
        const originalHotel = (selectedTrip.hotels || []).find(
          (hotel) => hotel.id === item.id
        )

        if (originalHotel) {
          updateHotel(item.id, {
            ...originalHotel,
            totalCost: item.amount === '' ? 0 : Number(item.amount),
            currency: item.currency || budgetCurrency,
            status: item.status || originalHotel.status || 'pending',
          })
        }
      }
    })

    setSourceModal(null)
    setSourceEditForm([])
  }

  const headerClassName = isOverBudget
    ? 'relative z-40 bg-gradient-to-br from-red-500 to-rose-700 px-6 pt-12 pb-4 shadow-lg shadow-red-900/10'
    : 'relative z-40 bg-gradient-to-br from-green-500 to-teal-600 px-6 pt-12 pb-4 shadow-lg shadow-green-900/10'

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

      <div className={headerClassName}>
        <div className="max-w-lg mx-auto relative w-full">
          <div>
            <p className="text-green-100 text-sm">AMAZING TRIP</p>
            <h1 className="text-white text-2xl font-bold mt-1">
              {t('budget.title')}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {t('budget.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTripPicker((value) => !value)}
            className="mt-4 w-full bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="min-w-0">
              <p className="text-xs text-white/70">{t('common.currentlyViewing')}</p>
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
            <div className="absolute left-0 right-0 top-full mt-3 z-50 bg-white rounded-2xl shadow-xl border border-green-100 p-2 max-h-72 overflow-y-auto">
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
                        isSelected ? 'bg-green-50' : 'hover:bg-gray-50'
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
                            <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {trip.destination || t('common.noDestination')}
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
            <Wallet size={34} className="text-green-500 mx-auto mb-3" />
            <h2 className="font-semibold text-gray-800">{t('common.selectTrip')}</h2>
            <p className="text-sm text-gray-400 mt-2">
              Create or select a trip first, then manage its budget.
            </p>
          </div>
        ) : (
          <>
            {!userCanEdit && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <Lock size={18} className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
              {t('common.viewOnlyBudget')}
                </p>
              </div>
            )}

            <div
              className={`rounded-3xl shadow-sm p-5 ${
                isOverBudget ? 'bg-red-500 text-white' : 'bg-white text-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={`text-xs ${
                      isOverBudget ? 'text-white/75' : 'text-gray-400'
                    }`}
                  >
                    {t('budget.overview')}
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {formatMoney(budgetLimit, budgetCurrency)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isOverBudget ? 'text-white/75' : 'text-gray-400'
                    }`}
                  >
                    {t('budget.totalBudgetBody')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openSettings}
                  disabled={!userCanEdit}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold shrink-0 ${
                    !userCanEdit
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : isOverBudget
                      ? 'bg-white text-red-600'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  {t('budget.set')}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div
                  className={`rounded-2xl p-4 ${
                    isOverBudget ? 'bg-white/15' : 'bg-green-50'
                  }`}
                >
                  <p
                    className={`text-xs ${
                      isOverBudget ? 'text-white/75' : 'text-green-600'
                    }`}
                  >
                    {t('budget.paid')}
                  </p>
                  <p className="text-xl font-bold mt-1">
                    {formatMoney(paidTotal, budgetCurrency)}
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-4 ${
                    isOverBudget ? 'bg-white/15' : 'bg-gray-50'
                  }`}
                >
                  <p
                    className={`text-xs ${
                      isOverBudget ? 'text-white/75' : 'text-gray-500'
                    }`}
                  >
                    {t('budget.balance')}
                  </p>
                  <p
                    className={`text-xl font-bold mt-1 ${
                      !isOverBudget && balance < 0 ? 'text-red-600' : ''
                    }`}
                  >
                    {formatMoney(balance, budgetCurrency)}
                  </p>
                </div>
              </div>

              {isProjectedOverBudget && !isOverBudget && (
                <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    {t('budget.projectedWarning')}
                  </p>
                </div>
              )}

              {isOverBudget && (
                <div className="mt-4 rounded-2xl bg-white/15 px-4 py-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-white mt-0.5 shrink-0" />
                  <p className="text-xs text-white">
                    {t('budget.overWarning')}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <PieChart size={17} />
                  <span className="text-xs">{t('budget.allocated')}</span>
                </div>
                <p className="text-xl font-bold text-gray-800 mt-2">
                  {formatMoney(allocatedTotal, budgetCurrency)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <ReceiptText size={17} />
                  <span className="text-xs">{t('common.pending')}</span>
                </div>
                <p className="text-xl font-bold text-gray-800 mt-2">
                  {formatMoney(pendingTotal, budgetCurrency)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">{t('budget.allocation')}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('budget.allocationBody')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddAllocation}
                  disabled={!userCanEdit}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 ${
                    userCanEdit
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={14} />
                  {t('budget.allocate')}
                </button>
              </div>

              {allocationItems.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-5 text-center">
                  <PieChart size={28} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    {t('budget.noAllocationTitle')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('budget.noAllocationBody')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allocationItems.map((item, index) => {
                    const amount = Number(item.amount || 0)
                    const pct = budgetLimit > 0 ? Math.round((amount / budgetLimit) * 100) : 0
                    const meta = getCategoryMeta(item.category)

                    return (
                      <div key={item.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">
                            {item.emoji || meta.emoji} {item.label || meta.defaultLabel}
                          </span>
                          <span className="text-gray-500">
                            {formatMoney(amount, budgetCurrency)}
                            <span className="text-gray-300"> ({pct}%)</span>
                          </span>
                        </div>

                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${COLORS[index % COLORS.length]}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>

                        {userCanEdit && (
                          <div className="flex items-center justify-end gap-3 mt-2">
                            <button
                              type="button"
                              onClick={() => openEditAllocation(item)}
                            >
                              <Pencil size={14} className="text-gray-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeBudgetItem(item.id)}
                            >
                              <Trash2 size={14} className="text-rose-400" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {budgetLimit > 0 && allocatedTotal > budgetLimit && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-600">
                        {t('budget.allocationHigh')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div>
                  <h2 className="font-semibold text-gray-800">{t('budget.actualSpending')}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('budget.actualSpendingBody')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddExpense}
                  disabled={!userCanEdit}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 ${
                    userCanEdit
                      ? 'bg-green-50 text-green-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={14} />
                  {t('budget.expense')}
                </button>
              </div>

              {actualSummaries.length === 0 ? (
                <div className="p-6 text-center">
                  <CreditCard size={30} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    {t('budget.noSpendingTitle')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('budget.noSpendingBody')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {actualSummaries.map((item) => (
                    <button
                      key={`${item.source}-${item.category}-${item.label}`}
                      type="button"
                      onClick={() => openSourceEditor(item)}
                      disabled={!userCanEdit}
                      className={`w-full px-5 py-4 text-left transition ${
                        userCanEdit
                          ? 'active:bg-green-50 hover:bg-gray-50'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
                            {item.emoji}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {item.label}
                              </p>
                              {userCanEdit && (
                                <Pencil size={12} className="text-gray-300 shrink-0" />
                              )}
                            </div>

                            <p className="text-xs text-gray-400 mt-0.5">
                              {t('budget.paid')} {formatMoney(item.paid, budgetCurrency)} · {t('common.pending')}{' '}
                              {formatMoney(item.pending, budgetCurrency)}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-gray-800 shrink-0">
                          {formatMoney(item.total, budgetCurrency)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between px-5 py-4 bg-gray-50">
                <span className="font-bold text-gray-800">{t('budget.projectedTotal')}</span>
                <span
                  className={`font-bold text-lg ${
                    projectedBalance < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatMoney(projectedTotal, budgetCurrency)}
                </span>
              </div>
            </div>

            {expenseItems.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-800">{t('budget.manualExpenses')}</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('budget.manualExpensesBody')}
                  </p>
                </div>

                <div className="divide-y divide-gray-50">
                  {expenseItems.map((item) => {
                    const meta = getCategoryMeta(item.category)

                    return (
                      <div
                        key={item.id}
                        className="px-5 py-4 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl">{item.emoji || meta.emoji}</span>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {item.label || meta.defaultLabel}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.paymentStatus === 'pending' ? t('common.pending') : t('budget.paid')}
                              {item.note ? ` · ${item.note}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-gray-800">
                            {formatMoney(item.amount, budgetCurrency)}
                          </span>

                          {userCanEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditExpense(item)}
                              >
                                <Pencil size={14} className="text-gray-400" />
                              </button>

                              <button
                                type="button"
                                onClick={() => removeBudgetItem(item.id)}
                              >
                                <Trash2 size={14} className="text-rose-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {settingsModal && (
        <EditModal title={t('budget.setTotal')} onClose={() => setSettingsModal(false)}>
          <SelectField
            label={t('budget.budgetCurrency')}
            value={settingsForm.budgetCurrency}
            onChange={(value) =>
              setSettingsForm((form) => ({ ...form, budgetCurrency: value }))
            }
            options={CURRENCY_OPTIONS}
          />

          <InputField
            label={t('budget.totalBudget')}
            type="number"
            value={settingsForm.budgetLimit}
            onChange={(value) =>
              setSettingsForm((form) => ({ ...form, budgetLimit: value }))
            }
            placeholder="0"
          />

          <button
            type="button"
            onClick={saveSettings}
            className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {t('budget.saveBudget')}
          </button>
        </EditModal>
      )}

      {allocationModal && (
        <EditModal
          title={allocationModal.mode === 'add' ? t('budget.addAllocation') : t('budget.editAllocation')}
          onClose={() => setAllocationModal(null)}
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <SelectField
            label={t('budget.category')}
            value={allocationForm.category}
            onChange={(value) => updateCategoryForm('allocation', value)}
            options={CATEGORY_OPTIONS.map((item) => ({
              value: item.value,
              label: `${item.emoji} ${t(`budget.category.${item.value}`)}`,
            }))}
          />

          {allocationForm.category === 'custom' && (
            <>
              <InputField
                label={t('budget.customEmoji')}
                value={allocationForm.emoji}
                onChange={(value) =>
                  setAllocationForm((form) => ({ ...form, emoji: value }))
                }
                placeholder="✨"
              />

              <InputField
                label={t('budget.customCategory')}
                value={allocationForm.label}
                onChange={(value) =>
                  setAllocationForm((form) => ({ ...form, label: value }))
                }
                placeholder="Example: Souvenirs"
              />
            </>
          )}

          {allocationForm.category !== 'custom' && (
            <InputField
              label={t('budget.categoryName')}
              value={allocationForm.label}
              onChange={(value) =>
                setAllocationForm((form) => ({ ...form, label: value }))
              }
              placeholder="Category name"
            />
          )}

          <InputField
            label={t('budget.allocatedAmount')}
            type="number"
            value={allocationForm.amount}
            onChange={(value) =>
              setAllocationForm((form) => ({ ...form, amount: value }))
            }
            placeholder="0"
          />

          <button
            type="button"
            onClick={saveAllocation}
            className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {allocationModal.mode === 'add' ? t('budget.saveAllocation') : t('common.saveChanges')}
          </button>
        </EditModal>
      )}

      {expenseModal && (
        <EditModal
          title={expenseModal.mode === 'add' ? t('budget.addExpense') : t('budget.editExpense')}
          onClose={() => setExpenseModal(null)}
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <SelectField
            label={t('budget.category')}
            value={expenseForm.category}
            onChange={(value) => updateCategoryForm('expense', value)}
            options={CATEGORY_OPTIONS.map((item) => ({
              value: item.value,
              label: `${item.emoji} ${t(`budget.category.${item.value}`)}`,
            }))}
          />

          {expenseForm.category === 'custom' && (
            <>
              <InputField
                label={t('budget.customEmoji')}
                value={expenseForm.emoji}
                onChange={(value) =>
                  setExpenseForm((form) => ({ ...form, emoji: value }))
                }
                placeholder="✨"
              />

              <InputField
                label={t('budget.customCategory')}
                value={expenseForm.label}
                onChange={(value) =>
                  setExpenseForm((form) => ({ ...form, label: value }))
                }
                placeholder="Example: Souvenirs"
              />
            </>
          )}

          {expenseForm.category !== 'custom' && (
            <InputField
              label={t('budget.expenseName')}
              value={expenseForm.label}
              onChange={(value) =>
                setExpenseForm((form) => ({ ...form, label: value }))
              }
              placeholder="Expense name"
            />
          )}

          <InputField
            label={t('budget.amount')}
            type="number"
            value={expenseForm.amount}
            onChange={(value) =>
              setExpenseForm((form) => ({ ...form, amount: value }))
            }
            placeholder="0"
          />

          <SelectField
            label={t('budget.paymentStatus')}
            value={expenseForm.paymentStatus}
            onChange={(value) =>
              setExpenseForm((form) => ({ ...form, paymentStatus: value }))
            }
            options={PAYMENT_STATUS_OPTIONS.map((option) => ({
              ...option,
              label: option.value === 'paid' ? t('budget.paid') : t('common.pending'),
            }))}
          />

          <InputField
            label={t('budget.note')}
            value={expenseForm.note}
            onChange={(value) =>
              setExpenseForm((form) => ({ ...form, note: value }))
            }
            placeholder="Optional note"
          />

          <button
            type="button"
            onClick={saveExpense}
            className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {expenseModal.mode === 'add' ? t('budget.saveExpense') : t('common.saveChanges')}
          </button>
        </EditModal>
      )}

      {sourceModal && (
        <EditModal title={sourceModal.title} onClose={() => setSourceModal(null)}>
          {sourceEditForm.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-5 text-center mb-4">
              <p className="text-sm font-medium text-gray-500">
                {t('budget.noSourceTitle')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {t('budget.noSourceBody')}
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              {sourceEditForm.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-100 p-4"
                >
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-800">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label={t('flights.currency')}
                      value={item.currency}
                      onChange={(value) => updateSourceItem(item.id, 'currency', value)}
                      options={CURRENCY_OPTIONS}
                    />

                    <InputField
                      label={t('budget.amount')}
                      type="number"
                      value={item.amount}
                      onChange={(value) => updateSourceItem(item.id, 'amount', value)}
                      placeholder="0"
                    />
                  </div>

                  <SelectField
                    label={t('hotels.bookingStatus')}
                    value={item.status}
                    onChange={(value) => updateSourceItem(item.id, 'status', value)}
                    options={BOOKING_STATUS_OPTIONS.map((option) => ({
                      ...option,
                      label: t(`common.${option.value}`),
                    }))}
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={saveSourceEditor}
            className="w-full bg-green-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {t('budget.saveImported')}
          </button>
        </EditModal>
      )}
    </div>
  )
}
