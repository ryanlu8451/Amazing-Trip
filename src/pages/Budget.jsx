import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Pencil,
  PieChart,
  Plus,
  ReceiptText,
  Trash2,
  Wallet,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
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
    setAllocationForm(emptyAllocation)
    setError('')
    setAllocationModal({
      mode: 'add',
      itemId: '',
    })
  }

  const openEditAllocation = (item) => {
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

    if (!allocationForm.label || Number(allocationForm.amount || 0) <= 0) {
      setError('Please select a category and enter an amount.')
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
    setExpenseForm(emptyExpense)
    setError('')
    setExpenseModal({
      mode: 'add',
      itemId: '',
    })
  }

  const openEditExpense = (item) => {
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

    if (!expenseForm.label || Number(expenseForm.amount || 0) <= 0) {
      setError('Please select a category and enter an amount.')
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

    const confirmed = window.confirm('Delete this budget item?')

    if (confirmed) {
      setActiveTrip(selectedTrip.id)
      deleteBudgetItem(itemId)
    }
  }

  const openSourceEditor = (summary) => {
    if (!selectedTrip) {
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
        title: 'Edit Flight Spending',
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
        title: 'Edit Accommodation Spending',
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
              Budget
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Select one trip and manage budget, spending, and balance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTripPicker((value) => !value)}
            className="mt-4 w-full bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="min-w-0">
              <p className="text-xs text-white/70">Currently Viewing</p>
              <p className="text-white text-sm font-semibold truncate mt-0.5">
                {selectedTrip
                  ? `${selectedTrip.coverEmoji || '🌍'} ${
                      selectedTrip.name || selectedTrip.destination || 'Untitled Trip'
                    }`
                  : 'Select a trip'}
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
                    No trips available
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a trip first from Home or Trip Management.
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
                            {trip.name || trip.destination || 'Untitled Trip'}
                          </p>

                          {isSelected && (
                            <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {trip.destination || 'No destination'}
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
            <h2 className="font-semibold text-gray-800">No trip selected</h2>
            <p className="text-sm text-gray-400 mt-2">
              Create or select a trip first, then manage its budget.
            </p>
          </div>
        ) : (
          <>
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
                    Budget Overview
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {formatMoney(budgetLimit, budgetCurrency)}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isOverBudget ? 'text-white/75' : 'text-gray-400'
                    }`}
                  >
                    Total budget for this trip
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openSettings}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold shrink-0 ${
                    isOverBudget
                      ? 'bg-white text-red-600'
                      : 'bg-green-50 text-green-600'
                  }`}
                >
                  Set
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
                    Paid
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
                    Balance
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
                    Projected spending may exceed your budget after pending items are paid.
                  </p>
                </div>
              )}

              {isOverBudget && (
                <div className="mt-4 rounded-2xl bg-white/15 px-4 py-3 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-white mt-0.5 shrink-0" />
                  <p className="text-xs text-white">
                    Paid spending is over budget. Review actual spending below.
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <PieChart size={17} />
                  <span className="text-xs">Allocated</span>
                </div>
                <p className="text-xl font-bold text-gray-800 mt-2">
                  {formatMoney(allocatedTotal, budgetCurrency)}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <ReceiptText size={17} />
                  <span className="text-xs">Pending</span>
                </div>
                <p className="text-xl font-bold text-gray-800 mt-2">
                  {formatMoney(pendingTotal, budgetCurrency)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-800">Budget Allocation</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Plan how your total budget should be split.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddAllocation}
                  className="bg-green-50 text-green-600 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={14} />
                  Allocate
                </button>
              </div>

              {allocationItems.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-5 text-center">
                  <PieChart size={28} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    No budget allocation yet.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add categories like flights, hotels, food, and transportation.
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
                      </div>
                    )
                  })}

                  {budgetLimit > 0 && allocatedTotal > budgetLimit && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 flex items-start gap-2">
                      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-600">
                        Allocation is higher than your total budget.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div>
                  <h2 className="font-semibold text-gray-800">Actual Spending</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Tap a spending row to edit its source amounts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddExpense}
                  className="bg-green-50 text-green-600 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus size={14} />
                  Expense
                </button>
              </div>

              {actualSummaries.length === 0 ? (
                <div className="p-6 text-center">
                  <CreditCard size={30} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">
                    No actual spending yet.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add flight, hotel, or manual expenses to start tracking.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {actualSummaries.map((item) => (
                    <button
                      key={`${item.source}-${item.category}-${item.label}`}
                      type="button"
                      onClick={() => openSourceEditor(item)}
                      className="w-full px-5 py-4 text-left active:bg-green-50 hover:bg-gray-50 transition"
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
                              <Pencil size={12} className="text-gray-300 shrink-0" />
                            </div>

                            <p className="text-xs text-gray-400 mt-0.5">
                              Paid {formatMoney(item.paid, budgetCurrency)} · Pending{' '}
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
                <span className="font-bold text-gray-800">Projected Total</span>
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
                  <h2 className="font-semibold text-gray-800">Manual Expenses</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    These are expenses you added manually.
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
                              {item.paymentStatus === 'pending' ? 'Pending' : 'Paid'}
                              {item.note ? ` · ${item.note}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-gray-800">
                            {formatMoney(item.amount, budgetCurrency)}
                          </span>

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
        <EditModal title="Set Total Budget" onClose={() => setSettingsModal(false)}>
          <SelectField
            label="Budget Currency"
            value={settingsForm.budgetCurrency}
            onChange={(value) =>
              setSettingsForm((form) => ({ ...form, budgetCurrency: value }))
            }
            options={CURRENCY_OPTIONS}
          />

          <InputField
            label="Total Budget"
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
            Save Budget
          </button>
        </EditModal>
      )}

      {allocationModal && (
        <EditModal
          title={allocationModal.mode === 'add' ? 'Add Allocation' : 'Edit Allocation'}
          onClose={() => setAllocationModal(null)}
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <SelectField
            label="Category"
            value={allocationForm.category}
            onChange={(value) => updateCategoryForm('allocation', value)}
            options={CATEGORY_OPTIONS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />

          {allocationForm.category === 'custom' && (
            <>
              <InputField
                label="Custom Emoji"
                value={allocationForm.emoji}
                onChange={(value) =>
                  setAllocationForm((form) => ({ ...form, emoji: value }))
                }
                placeholder="✨"
              />

              <InputField
                label="Custom Category Name"
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
              label="Category Name"
              value={allocationForm.label}
              onChange={(value) =>
                setAllocationForm((form) => ({ ...form, label: value }))
              }
              placeholder="Category name"
            />
          )}

          <InputField
            label="Allocated Amount"
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
            {allocationModal.mode === 'add' ? 'Save Allocation' : 'Save Changes'}
          </button>
        </EditModal>
      )}

      {expenseModal && (
        <EditModal
          title={expenseModal.mode === 'add' ? 'Add Expense' : 'Edit Expense'}
          onClose={() => setExpenseModal(null)}
        >
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <SelectField
            label="Category"
            value={expenseForm.category}
            onChange={(value) => updateCategoryForm('expense', value)}
            options={CATEGORY_OPTIONS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />

          {expenseForm.category === 'custom' && (
            <>
              <InputField
                label="Custom Emoji"
                value={expenseForm.emoji}
                onChange={(value) =>
                  setExpenseForm((form) => ({ ...form, emoji: value }))
                }
                placeholder="✨"
              />

              <InputField
                label="Custom Category Name"
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
              label="Expense Name"
              value={expenseForm.label}
              onChange={(value) =>
                setExpenseForm((form) => ({ ...form, label: value }))
              }
              placeholder="Expense name"
            />
          )}

          <InputField
            label="Amount"
            type="number"
            value={expenseForm.amount}
            onChange={(value) =>
              setExpenseForm((form) => ({ ...form, amount: value }))
            }
            placeholder="0"
          />

          <SelectField
            label="Payment Status"
            value={expenseForm.paymentStatus}
            onChange={(value) =>
              setExpenseForm((form) => ({ ...form, paymentStatus: value }))
            }
            options={PAYMENT_STATUS_OPTIONS}
          />

          <InputField
            label="Note"
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
            {expenseModal.mode === 'add' ? 'Save Expense' : 'Save Changes'}
          </button>
        </EditModal>
      )}

      {sourceModal && (
        <EditModal title={sourceModal.title} onClose={() => setSourceModal(null)}>
          {sourceEditForm.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-5 text-center mb-4">
              <p className="text-sm font-medium text-gray-500">
                No source items found.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Add flights or hotels first, then edit imported spending here.
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
                      label="Currency"
                      value={item.currency}
                      onChange={(value) => updateSourceItem(item.id, 'currency', value)}
                      options={CURRENCY_OPTIONS}
                    />

                    <InputField
                      label="Amount"
                      type="number"
                      value={item.amount}
                      onChange={(value) => updateSourceItem(item.id, 'amount', value)}
                      placeholder="0"
                    />
                  </div>

                  <SelectField
                    label="Booking Status"
                    value={item.status}
                    onChange={(value) => updateSourceItem(item.id, 'status', value)}
                    options={BOOKING_STATUS_OPTIONS}
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
            Save Imported Spending
          </button>
        </EditModal>
      )}
    </div>
  )
}
