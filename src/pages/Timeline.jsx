import { useState } from 'react'
import {
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  MapPin,
  Link as LinkIcon,
  CalendarDays,
  CheckCircle2,
  X,
  EyeOff,
  MoreHorizontal,
  RotateCcw,
  Eye,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import EditModal from '../components/EditModal'
import { InputField, SelectField } from '../components/InputField'

const TYPE_OPTIONS = [
  { value: 'flight', label: '✈️ Flight' },
  { value: 'transport', label: '🚆 Transport' },
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'activity', label: '🎡 Activity' },
  { value: 'food', label: '🍜 Food' },
  { value: 'shopping', label: '🛍️ Shopping' },
  { value: 'rest', label: '☕ Rest' },
]

const TYPE_ICON = {
  flight: '✈️',
  transport: '🚆',
  hotel: '🏨',
  activity: '🎡',
  food: '🍜',
  shopping: '🛍️',
  rest: '☕',
}

const emptyTripForm = {
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  coverEmoji: '🌍',
  members: [],
}

const emptyDay = {
  day: '',
  date: '',
  title: '',
  status: 'planning',
}

const emptyItem = {
  time: '',
  icon: '📍',
  title: '',
  location: '',
  mapUrl: '',
  note: '',
  type: 'activity',
  status: 'planning',
}

function isDateRangeValid(startDate, endDate) {
  if (!startDate || !endDate) {
    return true
  }

  return new Date(endDate) >= new Date(startDate)
}

function calculateDateFromDayNumber(startDate, dayNumber) {
  if (!startDate || !dayNumber || Number(dayNumber) < 1) {
    return ''
  }

  const date = new Date(`${startDate}T00:00:00`)
  date.setDate(date.getDate() + Number(dayNumber) - 1)

  return date.toISOString().split('T')[0]
}

function isDayDateInsideTrip(startDate, endDate, date) {
  if (!startDate || !endDate || !date) {
    return true
  }

  const selectedDate = new Date(`${date}T00:00:00`)
  const tripStart = new Date(`${startDate}T00:00:00`)
  const tripEnd = new Date(`${endDate}T00:00:00`)

  return selectedDate >= tripStart && selectedDate <= tripEnd
}

function getTimeValue(time) {
  if (!time) {
    return Number.MAX_SAFE_INTEGER
  }

  const cleanedTime = String(time).trim()
  const matchedTime = cleanedTime.match(/^(\d{1,2}):(\d{2})/)

  if (!matchedTime) {
    return Number.MAX_SAFE_INTEGER
  }

  const hours = Number(matchedTime[1])
  const minutes = Number(matchedTime[2])

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.MAX_SAFE_INTEGER
  }

  return hours * 60 + minutes
}

function sortTimelineItemsByTime(items) {
  return [...(items || [])].sort((a, b) => {
    const timeDifference = getTimeValue(a.time) - getTimeValue(b.time)

    if (timeDifference !== 0) {
      return timeDifference
    }

    return String(a.title || '').localeCompare(String(b.title || ''))
  })
}

function sortTripsByStartDate(trips) {
  return [...trips].sort((a, b) => {
    const dateA = a.startDate ? new Date(`${a.startDate}T00:00:00`) : new Date(8640000000000000)
    const dateB = b.startDate ? new Date(`${b.startDate}T00:00:00`) : new Date(8640000000000000)

    return dateA - dateB
  })
}

export default function Timeline() {
  const {
    trips,
    activeTripId,
    addTrip,
    updateTrip,
    setActiveTrip,
    deleteTrip,
    addDay,
    updateDay,
    deleteDay,
    addTimelineItem,
    updateTimelineItem,
    deleteTimelineItem,
  } = useTripStore()

  const [creatingTrip, setCreatingTrip] = useState(false)
  const [editingTrip, setEditingTrip] = useState(false)
  const [tripForm, setTripForm] = useState(emptyTripForm)
  const [tripError, setTripError] = useState('')
  const [memberInput, setMemberInput] = useState('')

  const [showDayCard, setShowDayCard] = useState(false)
  const [dayMode, setDayMode] = useState('add')
  const [editingDayId, setEditingDayId] = useState('')
  const [dayForm, setDayForm] = useState(emptyDay)
  const [dayError, setDayError] = useState('')

  const [itemModal, setItemModal] = useState(null)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [itemError, setItemError] = useState('')

  const [expanded, setExpanded] = useState({})
  const [openActionsTripId, setOpenActionsTripId] = useState('')
  const [showTripPicker, setShowTripPicker] = useState(false)

  const sortedTrips = sortTripsByStartDate(trips)
  const selectedTrip = trips.find((item) => item.id === activeTripId) || sortedTrips[0] || null
  const selectedTimeline = selectedTrip?.timeline || []

  const activePlannedDays = selectedTimeline.length
  const activeActivities = selectedTimeline.reduce(
    (sum, day) => sum + (day.items?.length || 0),
    0
  )
  const activeDoneActivities = selectedTimeline.reduce(
    (sum, day) =>
      sum + (day.items?.filter((item) => item.status === 'done').length || 0),
    0
  )

  const sortedTimeline = [...selectedTimeline].sort(
    (a, b) => Number(a.day) - Number(b.day)
  )

  const selectTrip = (tripId) => {
    setActiveTrip(tripId)
    setShowTripPicker(false)
    setShowDayCard(false)
    setDayError('')
    setOpenActionsTripId('')
  }

  const openCreateTrip = () => {
    setTripForm(emptyTripForm)
    setTripError('')
    setMemberInput('')
    setCreatingTrip(true)
    setEditingTrip(false)
    setShowTripPicker(false)
  }

  const openEditTrip = (targetTrip) => {
    setActiveTrip(targetTrip.id)

    setTripForm({
      name: targetTrip.name || '',
      destination: targetTrip.destination || '',
      startDate: targetTrip.startDate || '',
      endDate: targetTrip.endDate || '',
      coverEmoji: targetTrip.coverEmoji || '🌍',
      members: targetTrip.members || [],
    })

    setTripError('')
    setMemberInput('')
    setCreatingTrip(false)
    setEditingTrip(true)
    setOpenActionsTripId('')
  }

  const closeTripModal = () => {
    setCreatingTrip(false)
    setEditingTrip(false)
    setTripForm(emptyTripForm)
    setTripError('')
    setMemberInput('')
  }

  const addMemberToTripForm = () => {
    const cleanedMember = memberInput.trim()

    if (!cleanedMember) {
      return
    }

    const alreadyExists = tripForm.members.some(
      (member) => member.toLowerCase() === cleanedMember.toLowerCase()
    )

    if (alreadyExists) {
      setMemberInput('')
      return
    }

    setTripForm((form) => ({
      ...form,
      members: [...form.members, cleanedMember],
    }))

    setMemberInput('')
  }

  const removeMemberFromTripForm = (memberToRemove) => {
    setTripForm((form) => ({
      ...form,
      members: form.members.filter((member) => member !== memberToRemove),
    }))
  }

  const handleMemberInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      addMemberToTripForm()
    }
  }

  const saveNewTrip = () => {
    if (!tripForm.name || !tripForm.destination) {
      setTripError('Please enter Trip Name and Destination.')
      return
    }

    if (!isDateRangeValid(tripForm.startDate, tripForm.endDate)) {
      setTripError('End Date cannot be earlier than Start Date.')
      return
    }

    addTrip({
      ...tripForm,
      status: 'planning',
      isHidden: false,
    })

    closeTripModal()
  }

  const saveEditedTrip = () => {
    if (!tripForm.name || !tripForm.destination) {
      setTripError('Please enter Trip Name and Destination.')
      return
    }

    if (!isDateRangeValid(tripForm.startDate, tripForm.endDate)) {
      setTripError('End Date cannot be earlier than Start Date.')
      return
    }

    updateTrip(tripForm)
    closeTripModal()
  }

  const removeTrip = (tripId) => {
    const confirmed = window.confirm(
      'Delete this trip? Flights, hotels, budget, and schedules under this trip will also be deleted.'
    )

    if (confirmed) {
      deleteTrip(tripId)
      setOpenActionsTripId('')
    }
  }

  const toggleTripHidden = (targetTrip) => {
    setActiveTrip(targetTrip.id)
    updateTrip({
      isHidden: !targetTrip.isHidden,
    })
    setOpenActionsTripId('')
  }

  const toggleTripCompleted = (targetTrip) => {
    setActiveTrip(targetTrip.id)
    updateTrip({
      status: targetTrip.status === 'completed' ? 'planning' : 'completed',
    })
    setOpenActionsTripId('')
  }

  const toggleTripActions = (tripId) => {
    setOpenActionsTripId((current) => (current === tripId ? '' : tripId))
  }

  const openAddDayCard = () => {
    if (!selectedTrip) {
      return
    }

    setActiveTrip(selectedTrip.id)

    const nextDayNumber = selectedTimeline.length + 1
    const suggestedDate = calculateDateFromDayNumber(selectedTrip.startDate, nextDayNumber)

    setDayMode('add')
    setEditingDayId('')
    setDayForm({
      day: nextDayNumber,
      date: suggestedDate,
      title: '',
      status: 'planning',
    })
    setDayError('')
    setShowDayCard(true)
  }

  const openEditDayCard = (day) => {
    if (selectedTrip) {
      setActiveTrip(selectedTrip.id)
    }

    setDayMode('edit')
    setEditingDayId(day.id)
    setDayForm({
      ...emptyDay,
      ...day,
    })
    setDayError('')
    setShowDayCard(true)
  }

  const cancelDayCard = () => {
    setShowDayCard(false)
    setDayMode('add')
    setEditingDayId('')
    setDayForm(emptyDay)
    setDayError('')
  }

  const updateDayNumber = (value) => {
    const calculatedDate = calculateDateFromDayNumber(selectedTrip?.startDate, value)

    setDayError('')
    setDayForm((form) => ({
      ...form,
      day: value,
      date: calculatedDate || form.date,
    }))
  }

  const updateDayForm = (key, value) => {
    setDayError('')
    setDayForm((form) => ({
      ...form,
      [key]: value,
    }))
  }

  const saveDay = () => {
    if (!selectedTrip) {
      return
    }

    if (!dayForm.day || !dayForm.date || !dayForm.title) {
      setDayError('Please enter Day Number, Date, and Day Title.')
      return
    }

    if (!isDayDateInsideTrip(selectedTrip.startDate, selectedTrip.endDate, dayForm.date)) {
      setDayError('This date is outside the trip date range.')
      return
    }

    setActiveTrip(selectedTrip.id)

    const savedDay = {
      ...dayForm,
      day: Number(dayForm.day),
    }

    if (dayMode === 'add') {
      addDay(savedDay)
    } else {
      updateDay(editingDayId, savedDay)
    }

    cancelDayCard()
  }

  const updateItemForm = (key, value) => {
    setItemError('')
    setItemForm((form) => ({
      ...form,
      [key]: value,
    }))
  }

  const openAddItem = (dayId) => {
    if (selectedTrip) {
      setActiveTrip(selectedTrip.id)
    }

    setItemForm({
      ...emptyItem,
      dayId,
    })
    setItemError('')
    setItemModal({
      type: 'add',
      dayId,
    })
  }

  const openEditItem = (dayId, item) => {
    if (selectedTrip) {
      setActiveTrip(selectedTrip.id)
    }

    setItemForm({
      ...emptyItem,
      ...item,
      dayId,
    })
    setItemError('')
    setItemModal({
      type: 'edit',
      dayId,
      itemId: item.id,
    })
  }

  const saveItem = () => {
    if (!itemForm.title) {
      setItemError('Please enter an activity name.')
      return
    }

    if (selectedTrip) {
      setActiveTrip(selectedTrip.id)
    }

    const activityData = {
      ...itemForm,
      icon: TYPE_ICON[itemForm.type] || '📍',
    }

    if (itemModal.type === 'add') {
      addTimelineItem(itemModal.dayId, activityData)
    } else {
      updateTimelineItem(itemModal.dayId, itemModal.itemId, activityData)
    }

    setItemModal(null)
  }

  const removeDay = (dayId) => {
    const confirmed = window.confirm(
      'Delete this day? Activities under this day will also be deleted.'
    )

    if (confirmed) {
      if (selectedTrip) {
        setActiveTrip(selectedTrip.id)
      }
      deleteDay(dayId)
    }
  }

  const removeItem = (dayId, itemId) => {
    const confirmed = window.confirm('Delete this activity?')

    if (confirmed) {
      if (selectedTrip) {
        setActiveTrip(selectedTrip.id)
      }
      deleteTimelineItem(dayId, itemId)
    }
  }

  const toggleExpand = (id) => {
    setExpanded((current) => ({
      ...current,
      [id]: current[id] === false,
    }))
  }

  const toggleActivityDone = (dayId, item) => {
    if (selectedTrip) {
      setActiveTrip(selectedTrip.id)
    }

    updateTimelineItem(dayId, item.id, {
      ...item,
      status: item.status === 'done' ? 'planning' : 'done',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-x-hidden">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 pt-12 pb-6">
        <div className="max-w-lg mx-auto relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm">AMAZING TRIP</p>
              <h1 className="text-white text-2xl font-bold mt-1">
                Trip Management
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Select one trip and manage its daily schedule.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateTrip}
              className="bg-white/20 flex items-center gap-1 text-white text-sm px-3 py-2 rounded-xl shrink-0"
            >
              <Plus size={16} />
              Create
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTripPicker((value) => !value)}
            className="mt-4 w-full bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="min-w-0">
              <p className="text-xs text-blue-100">Currently Viewing</p>
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
            <>
              <button
                type="button"
                aria-label="Close trip picker"
                className="fixed inset-0 z-40 cursor-default bg-transparent"
                onClick={() => setShowTripPicker(false)}
              />

              <div
                className="absolute left-0 right-0 top-full mt-3 z-50 bg-white rounded-2xl shadow-xl border border-blue-100 p-2 max-h-72 overflow-y-auto"
                onClick={(event) => event.stopPropagation()}
              >
                {sortedTrips.length === 0 ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-sm font-medium text-gray-500">
                      No trips available
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Create a trip first, then add daily schedules.
                    </p>
                  </div>
                ) : (
                  sortedTrips.map((item) => {
                    const isSelected = selectedTrip?.id === item.id
                    const itemTimeline = item.timeline || []
                    const itemActivities = itemTimeline.reduce(
                      (sum, day) => sum + (day.items?.length || 0),
                      0
                    )

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectTrip(item.id)}
                        className={`w-full rounded-xl px-3 py-3 flex items-center gap-3 text-left ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-2xl shrink-0">
                          {item.coverEmoji || '🌍'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {item.name || item.destination || 'Untitled Trip'}
                            </p>

                            {isSelected && (
                              <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {item.destination || 'No destination'} · {itemTimeline.length} days · {itemActivities} activities
                          </p>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 overflow-x-hidden">
        {selectedTrip ? (
          <div
            className={`bg-white rounded-2xl shadow-sm overflow-hidden border ${
              selectedTrip.status === 'completed'
                ? 'border-green-200'
                : selectedTrip.isHidden
                  ? 'border-slate-200 opacity-80'
                  : 'border-blue-100'
            }`}
          >
            {openActionsTripId === selectedTrip.id && (
              <div className="grid grid-cols-4 text-xs font-semibold text-white">
                <button
                  type="button"
                  onClick={() => openEditTrip(selectedTrip)}
                  className="bg-blue-500 py-3 flex flex-col items-center gap-1"
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => toggleTripHidden(selectedTrip)}
                  className="bg-slate-500 py-3 flex flex-col items-center gap-1"
                >
                  {selectedTrip.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                  {selectedTrip.isHidden ? 'Show' : 'Hide'}
                </button>

                <button
                  type="button"
                  onClick={() => toggleTripCompleted(selectedTrip)}
                  className="bg-green-500 py-3 flex flex-col items-center gap-1"
                >
                  {selectedTrip.status === 'completed' ? (
                    <RotateCcw size={15} />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {selectedTrip.status === 'completed' ? 'Reopen' : 'Done'}
                </button>

                <button
                  type="button"
                  onClick={() => removeTrip(selectedTrip.id)}
                  className="bg-red-500 py-3 flex flex-col items-center gap-1"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl shadow-sm shrink-0">
                    {selectedTrip.coverEmoji || '🌍'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-gray-800 truncate">
                        {selectedTrip.name || selectedTrip.destination || 'Untitled Trip'}
                      </h2>

                      {selectedTrip.status === 'completed' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          Completed
                        </span>
                      )}

                      {selectedTrip.isHidden && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          Hidden
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {selectedTrip.destination || 'No destination'}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {selectedTrip.startDate || 'Start date'} → {selectedTrip.endDate || 'End date'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
                        {activePlannedDays} days
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
                        {activeActivities} activities
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleTripActions(selectedTrip.id)}
                  className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 shrink-0"
                >
                  <MoreHorizontal size={18} className="text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-3">🌍</div>
            <h2 className="font-semibold text-gray-800">No trips created yet</h2>
            <p className="text-sm text-gray-400 mt-2">
              Create your first trip, then start adding daily schedules.
            </p>

            <button
              type="button"
              onClick={openCreateTrip}
              className="mt-5 bg-blue-500 text-white rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center gap-2"
            >
              <Plus size={16} />
              Create Trip
            </button>
          </div>
        )}

        {selectedTrip && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">Currently Managing</p>
                  <h2 className="font-semibold text-gray-800 mt-1">
                    {selectedTrip.coverEmoji || '🌍'} {selectedTrip.name || selectedTrip.destination || 'Untitled Trip'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedTrip.startDate || 'Start date'} → {selectedTrip.endDate || 'End date'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddDayCard}
                  className="bg-blue-500 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Plus size={14} />
                  Daily Schedule
                </button>
              </div>
            </div>

            {showDayCard && (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {dayMode === 'add' ? 'Add Daily Schedule' : 'Edit Daily Schedule'}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Day Number auto-calculates the date from the trip start date.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={cancelDayCard}
                    className="text-xs text-gray-400"
                  >
                    Cancel
                  </button>
                </div>

                {dayError && (
                  <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {dayError}
                  </div>
                )}

                <InputField
                  label="Day Number"
                  type="number"
                  value={dayForm.day}
                  onChange={updateDayNumber}
                  placeholder="1"
                />

                <InputField
                  label="Date"
                  type="date"
                  value={dayForm.date}
                  onChange={(value) => updateDayForm('date', value)}
                />

                <InputField
                  label="Day Title"
                  value={dayForm.title}
                  onChange={(value) => updateDayForm('title', value)}
                  placeholder="Example: Sydney Opera House / Tokyo Day 1"
                />

                <button
                  type="button"
                  onClick={saveDay}
                  className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
                >
                  {dayMode === 'add' ? 'Add Daily Schedule' : 'Save Changes'}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <CalendarDays size={17} />
                  <span className="text-xs">Planned Days</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {activePlannedDays}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <CheckCircle2 size={17} />
                  <span className="text-xs">Done Activities</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {activeDoneActivities}
                </p>
              </div>
            </div>

            {selectedTimeline.length === 0 && !showDayCard && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-5xl mb-3">🗓️</div>
                <h2 className="font-semibold text-gray-800">
                  This trip has no daily schedule yet
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  Add Day 1, Day 2, or any custom travel day manually.
                </p>

                <button
                  type="button"
                  onClick={openAddDayCard}
                  className="mt-5 bg-blue-500 text-white rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Daily Schedule
                </button>
              </div>
            )}

            {sortedTimeline.map((day) => {
              const isOpen = expanded[day.id] !== false
              const sortedDayItems = sortTimelineItemsByTime(day.items || [])
              const itemCount = sortedDayItems.length
              const doneCount = sortedDayItems.filter(
                (item) => item.status === 'done'
              ).length

              return (
                <div key={day.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                    <div className="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                      D{day.day}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">
                        {day.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {day.date} · {doneCount}/{itemCount} done
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEditDayCard(day)}>
                        <Pencil size={15} className="text-gray-400" />
                      </button>

                      <button type="button" onClick={() => removeDay(day.id)}>
                        <Trash2 size={15} className="text-rose-400" />
                      </button>

                      <button type="button" onClick={() => toggleExpand(day.id)}>
                        {isOpen ? (
                          <ChevronUp size={18} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 py-3 space-y-1">
                      {sortedDayItems.length === 0 && (
                        <div className="rounded-2xl bg-gray-50 p-4 text-center">
                          <p className="text-sm text-gray-400">
                            No activities yet.
                          </p>
                        </div>
                      )}

                      {sortedDayItems.map((item, index) => (
                        <div key={item.id} className="flex gap-3 py-3">
                          <div className="text-xs text-gray-400 w-12 pt-1 shrink-0">
                            {item.time || '--:--'}
                          </div>

                          <div className="relative flex flex-col items-center mr-1">
                            <button
                              type="button"
                              onClick={() => toggleActivityDone(day.id, item)}
                              className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border ${
                                item.status === 'done'
                                  ? 'bg-green-500 border-green-500'
                                  : 'bg-white border-blue-300'
                              }`}
                            />

                            {index < sortedDayItems.length - 1 && (
                              <div
                                className="w-0.5 bg-blue-100 flex-1 mt-1"
                                style={{ minHeight: '34px' }}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="text-lg leading-none shrink-0">
                                  {item.icon}
                                </span>

                                <div className="min-w-0">
                                  <p
                                    className={`text-sm font-medium ${
                                      item.status === 'done'
                                        ? 'text-gray-400 line-through'
                                        : 'text-gray-800'
                                    }`}
                                  >
                                    {item.title}
                                  </p>

                                  {item.location && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <MapPin size={12} />
                                      {item.location}
                                    </p>
                                  )}

                                  {item.note && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {item.note}
                                    </p>
                                  )}

                                  {item.mapUrl && (
                                    <a
                                      href={item.mapUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-blue-500 mt-1 inline-flex items-center gap-1"
                                    >
                                      <LinkIcon size={12} />
                                      Open Map
                                    </a>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditItem(day.id, item)}
                                >
                                  <Pencil size={13} className="text-gray-300 hover:text-gray-500" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeItem(day.id, item.id)}
                                >
                                  <Trash2 size={13} className="text-gray-300 hover:text-rose-400" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => openAddItem(day.id)}
                        className="flex items-center gap-1 text-blue-500 text-sm mt-3 py-2"
                      >
                        <Plus size={15} />
                        Add Activity
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {selectedTimeline.length > 0 && (
              <button
                type="button"
                onClick={openAddDayCard}
                className="w-full bg-blue-50 text-blue-600 rounded-2xl py-4 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Another Day
              </button>
            )}
          </>
        )}
      </div>

      {(creatingTrip || editingTrip) && (
        <EditModal
          title={creatingTrip ? 'Create Trip' : 'Edit Trip'}
          onClose={closeTripModal}
        >
          {tripError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {tripError}
            </div>
          )}

          <InputField
            label="Trip Name"
            value={tripForm.name}
            onChange={(value) =>
              setTripForm((form) => ({ ...form, name: value }))
            }
          />

          <InputField
            label="Destination"
            value={tripForm.destination}
            onChange={(value) =>
              setTripForm((form) => ({ ...form, destination: value }))
            }
          />

          <InputField
            label="Cover Emoji"
            value={tripForm.coverEmoji}
            onChange={(value) =>
              setTripForm((form) => ({ ...form, coverEmoji: value }))
            }
          />

          <InputField
            label="Start Date"
            type="date"
            value={tripForm.startDate}
            onChange={(value) => {
              setTripError('')
              setTripForm((form) => ({ ...form, startDate: value }))
            }}
          />

          <InputField
            label="End Date"
            type="date"
            value={tripForm.endDate}
            onChange={(value) => {
              setTripError('')
              setTripForm((form) => ({ ...form, endDate: value }))
            }}
          />

          <div className="mb-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  Planning Members
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  Add people for planning now. Invite/login permissions will be connected later.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                value={memberInput}
                onChange={(event) => setMemberInput(event.target.value)}
                onKeyDown={handleMemberInputKeyDown}
                placeholder="Name or email"
              />

              <button
                type="button"
                onClick={addMemberToTripForm}
                className="bg-blue-500 text-white rounded-xl px-4 text-sm font-semibold flex items-center gap-1"
              >
                <Plus size={15} />
                Add
              </button>
            </div>

            {tripForm.members.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {tripForm.members.map((member) => (
                  <div
                    key={member}
                    className="bg-blue-50 text-blue-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-2"
                  >
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => removeMemberFromTripForm(member)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-3">
                No members added yet. You can still create this as a solo trip.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={creatingTrip ? saveNewTrip : saveEditedTrip}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm"
          >
            {creatingTrip ? 'Save Trip' : 'Save Changes'}
          </button>
        </EditModal>
      )}

      {itemModal && (
        <EditModal
          title={itemModal.type === 'add' ? 'Add Activity' : 'Edit Activity'}
          onClose={() => setItemModal(null)}
        >
          {itemError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {itemError}
            </div>
          )}

          <SelectField
            label="Type"
            value={itemForm.type}
            onChange={(value) => {
              updateItemForm('type', value)
              updateItemForm('icon', TYPE_ICON[value] || '📍')
            }}
            options={TYPE_OPTIONS}
          />

          <InputField
            label="Time"
            value={itemForm.time}
            onChange={(value) => updateItemForm('time', value)}
            placeholder="09:00"
          />

          <InputField
            label="Activity Name"
            value={itemForm.title}
            onChange={(value) => updateItemForm('title', value)}
            placeholder="Example: Visit Senso-ji Temple"
          />

          <InputField
            label="Location"
            value={itemForm.location}
            onChange={(value) => updateItemForm('location', value)}
            placeholder="Example: Tokyo Station"
          />

          <InputField
            label="Google Maps Link"
            value={itemForm.mapUrl}
            onChange={(value) => updateItemForm('mapUrl', value)}
            placeholder="https://maps.google.com/..."
          />

          <InputField
            label="Notes"
            value={itemForm.note}
            onChange={(value) => updateItemForm('note', value)}
            placeholder="Tickets, meeting point, reminders..."
          />

          <button
            type="button"
            onClick={saveItem}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            Save Activity
          </button>
        </EditModal>
      )}
    </div>
  )
}
