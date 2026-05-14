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
  Lock,
  MoreHorizontal,
  RotateCcw,
  Eye,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import {
  canDeleteTrip,
  canEditTrip,
  deleteTripFromCloud,
  getTripAccessFields,
  saveTripToCloud,
} from '../lib/tripCloud'
import { useTranslation } from '../lib/i18n'
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

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => {
  const hour = index + 1
  return {
    value: String(hour),
    label: String(hour).padStart(2, '0'),
  }
})

const MINUTE_OPTIONS = ['00', '15', '30', '45'].map((minute) => ({
  value: minute,
  label: minute,
}))

const PERIOD_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

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
  time: '09:00',
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

function getTimeParts(time) {
  const timeValue = String(time || '').trim()
  const matchedTime = timeValue.match(/^(\d{1,2}):(\d{2})/)
  const date = new Date()

  if (!matchedTime) {
    const currentHours = date.getHours()
    const roundedMinutes = String(Math.round(date.getMinutes() / 15) * 15)
      .padStart(2, '0')
      .replace('60', '00')

    return {
      hour: String(currentHours % 12 || 12),
      minute: MINUTE_OPTIONS.some((option) => option.value === roundedMinutes) ? roundedMinutes : '00',
      period: currentHours >= 12 ? 'PM' : 'AM',
    }
  }

  const hours = Number(matchedTime[1])
  const minutes = matchedTime[2]

  return {
    hour: String(hours % 12 || 12),
    minute: MINUTE_OPTIONS.some((option) => option.value === minutes) ? minutes : '00',
    period: hours >= 12 ? 'PM' : 'AM',
  }
}

function buildTimeValue(hour, minute, period) {
  let hours = Number(hour)

  if (period === 'PM' && hours < 12) {
    hours += 12
  }

  if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return `${String(hours).padStart(2, '0')}:${minute}`
}

function normalizeExternalUrl(url) {
  const cleanedUrl = String(url || '').trim()

  if (!cleanedUrl) {
    return ''
  }

  if (/^https?:\/\//i.test(cleanedUrl)) {
    return cleanedUrl
  }

  return `https://${cleanedUrl}`
}

function getGoogleMapsSearchUrl(query) {
  const cleanedQuery = String(query || '').trim()

  if (!cleanedQuery) {
    return ''
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedQuery)}`
}

function getActivityMapUrl(item) {
  if (item.mapUrl) {
    return normalizeExternalUrl(item.mapUrl)
  }

  const query = [item.location, item.title]
    .filter(Boolean)
    .join(' ')
    .trim()

  return getGoogleMapsSearchUrl(query)
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
  const { user } = useAuthStore()
  const { t } = useTranslation()

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
  const userCanEdit = canEditTrip(selectedTrip, user)
  const userCanDelete = canDeleteTrip(selectedTrip, user)
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
  const itemTimeParts = getTimeParts(itemForm.time)

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
    if (!canEditTrip(targetTrip, user)) {
      setTripError(t('common.noEditPermission'))
      return
    }

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

  const saveNewTrip = async () => {
    if (!tripForm.name || !tripForm.destination) {
      setTripError(t('timeline.tripRequired'))
      return
    }

    if (!isDateRangeValid(tripForm.startDate, tripForm.endDate)) {
      setTripError(t('timeline.invalidDates'))
      return
    }

    const newTrip = addTrip({
      ...tripForm,
      ...getTripAccessFields(user),
      status: 'planning',
      isHidden: false,
    })

    try {
      await saveTripToCloud(newTrip, user)
    } catch (error) {
      console.error('[Trip Create Save Error]', {
        code: error.code,
        message: error.message,
      })
    }

    closeTripModal()
  }

  const saveEditedTrip = () => {
    if (!userCanEdit) {
      setTripError(t('common.noEditPermission'))
      return
    }

    if (!tripForm.name || !tripForm.destination) {
      setTripError(t('timeline.tripRequired'))
      return
    }

    if (!isDateRangeValid(tripForm.startDate, tripForm.endDate)) {
      setTripError(t('timeline.invalidDates'))
      return
    }

    updateTrip(tripForm)
    closeTripModal()
  }

  const removeTrip = async (tripId) => {
    if (!userCanDelete) {
      setTripError(t('common.ownerOnlyDelete'))
      return
    }

    const confirmed = window.confirm(
      t('timeline.deleteTripConfirm')
    )

    if (confirmed) {
      const deletedTrip = deleteTrip(tripId)
      setOpenActionsTripId('')

      try {
        await deleteTripFromCloud(deletedTrip?.id || tripId, user)
      } catch (error) {
        console.error('[Trip Delete Error]', {
          code: error.code,
          message: error.message,
        })
      }
    }
  }

  const toggleTripHidden = (targetTrip) => {
    if (!canEditTrip(targetTrip, user)) {
      setTripError(t('common.noEditPermission'))
      return
    }

    setActiveTrip(targetTrip.id)
    updateTrip({
      isHidden: !targetTrip.isHidden,
    })
    setOpenActionsTripId('')
  }

  const toggleTripCompleted = (targetTrip) => {
    if (!canEditTrip(targetTrip, user)) {
      setTripError(t('common.noEditPermission'))
      return
    }

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

    if (!userCanEdit) {
      setDayError(t('common.noEditPermission'))
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
    if (!userCanEdit) {
      setDayError(t('common.noEditPermission'))
      return
    }

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

    if (!userCanEdit) {
      setDayError(t('common.noEditPermission'))
      return
    }

    if (!dayForm.day || !dayForm.date || !dayForm.title) {
      setDayError(t('timeline.dayRequired'))
      return
    }

    if (!isDayDateInsideTrip(selectedTrip.startDate, selectedTrip.endDate, dayForm.date)) {
      setDayError(t('timeline.dayOutsideRange'))
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
    if (!userCanEdit) {
      setItemError(t('common.noEditPermission'))
      return
    }

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
    if (!userCanEdit) {
      setItemError(t('common.noEditPermission'))
      return
    }

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
    if (!userCanEdit) {
      setItemError(t('common.noEditPermission'))
      return
    }

    if (!itemForm.title) {
      setItemError(t('timeline.activityRequired'))
      return
    }

    if (selectedTrip) {
      setActiveTrip(selectedTrip.id)
    }

    const activityData = {
      ...itemForm,
      icon: TYPE_ICON[itemForm.type] || '📍',
      mapUrl: normalizeExternalUrl(itemForm.mapUrl),
    }

    if (itemModal.type === 'add') {
      addTimelineItem(itemModal.dayId, activityData)
    } else {
      updateTimelineItem(itemModal.dayId, itemModal.itemId, activityData)
    }

    setItemModal(null)
  }

  const removeDay = (dayId) => {
    if (!userCanEdit) {
      setDayError(t('common.noEditPermission'))
      return
    }

    const confirmed = window.confirm(
      t('timeline.deleteDayConfirm')
    )

    if (confirmed) {
      if (selectedTrip) {
        setActiveTrip(selectedTrip.id)
      }
      deleteDay(dayId)
    }
  }

  const removeItem = (dayId, itemId) => {
    if (!userCanEdit) {
      setItemError(t('common.noEditPermission'))
      return
    }

    const confirmed = window.confirm(t('timeline.deleteActivityConfirm'))

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
    if (!userCanEdit) {
      setItemError(t('common.noEditPermission'))
      return
    }

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
                {t('timeline.title')}
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                {t('timeline.subtitle')}
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateTrip}
              className="bg-white/20 flex items-center gap-1 text-white text-sm px-3 py-2 rounded-xl shrink-0"
            >
              <Plus size={16} />
              {t('timeline.create')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowTripPicker((value) => !value)}
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
                      {t('common.noTripsAvailable')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('timeline.noTripsBody')}
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
                            {item.name || item.destination || t('common.untitledTrip')}
                            </p>

                            {isSelected && (
                              <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {item.destination || t('common.noDestination')} · {itemTimeline.length} {t('timeline.days')} · {itemActivities} {t('timeline.activities')}
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
                  disabled={!userCanEdit}
                  className={`py-3 flex flex-col items-center gap-1 ${
                    userCanEdit ? 'bg-blue-500' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Pencil size={15} />
                  {t('common.edit')}
                </button>

                <button
                  type="button"
                  onClick={() => toggleTripHidden(selectedTrip)}
                  disabled={!userCanEdit}
                  className={`py-3 flex flex-col items-center gap-1 ${
                    userCanEdit ? 'bg-slate-500' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {selectedTrip.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                  {selectedTrip.isHidden ? t('common.show') : t('common.hide')}
                </button>

                <button
                  type="button"
                  onClick={() => toggleTripCompleted(selectedTrip)}
                  disabled={!userCanEdit}
                  className={`py-3 flex flex-col items-center gap-1 ${
                    userCanEdit ? 'bg-green-500' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {selectedTrip.status === 'completed' ? (
                    <RotateCcw size={15} />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {selectedTrip.status === 'completed' ? t('common.reopen') : t('common.done')}
                </button>

                <button
                  type="button"
                  onClick={() => removeTrip(selectedTrip.id)}
                  disabled={!userCanDelete}
                  className={`py-3 flex flex-col items-center gap-1 ${
                    userCanDelete ? 'bg-red-500' : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={15} />
                  {t('common.delete')}
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
                        {selectedTrip.name || selectedTrip.destination || t('common.untitledTrip')}
                      </h2>

                      {selectedTrip.status === 'completed' && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                          {t('common.completed')}
                        </span>
                      )}

                      {selectedTrip.isHidden && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {t('common.hidden')}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {selectedTrip.destination || t('common.noDestination')}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {selectedTrip.startDate || t('common.startDate')} → {selectedTrip.endDate || t('common.endDate')}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
                        {activePlannedDays} {t('timeline.days')}
                      </span>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
                        {activeActivities} {t('timeline.activities')}
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

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={openAddDayCard}
                  disabled={!userCanEdit}
                  className={`rounded-xl px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 ${
                    userCanEdit
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={14} />
                  {t('timeline.addDailySchedule')}
                </button>

                <button
                  type="button"
                  onClick={() => openEditTrip(selectedTrip)}
                  disabled={!userCanEdit}
                  className={`rounded-xl px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1 ${
                    userCanEdit
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Pencil size={14} />
                  {t('common.edit')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-3">🌍</div>
            <h2 className="font-semibold text-gray-800">{t('home.noTripsCreated')}</h2>
            <p className="text-sm text-gray-400 mt-2">
              {t('timeline.noTripsBody')}
            </p>

            <button
              type="button"
              onClick={openCreateTrip}
              className="mt-5 bg-blue-500 text-white rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center gap-2"
            >
              <Plus size={16} />
              {t('home.createTrip')}
            </button>
          </div>
        )}

        {selectedTrip && (
          <>
            {!userCanEdit && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <Lock size={18} className="text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  {t('common.viewOnlySchedule')}
                </p>
              </div>
            )}

            {showDayCard && (
              <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-800">
                      {dayMode === 'add' ? t('timeline.addDailySchedule') : t('timeline.editDailySchedule')}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {t('timeline.dayAutoDate')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={cancelDayCard}
                    className="text-xs text-gray-400"
                  >
                    {t('common.cancel')}
                  </button>
                </div>

                {dayError && (
                  <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {dayError}
                  </div>
                )}

                <InputField
                  label={t('timeline.dayNumber')}
                  type="number"
                  value={dayForm.day}
                  onChange={updateDayNumber}
                  placeholder="1"
                />

                <InputField
                  label={t('common.date')}
                  type="date"
                  value={dayForm.date}
                  onChange={(value) => updateDayForm('date', value)}
                />

                <InputField
                  label={t('timeline.dayTitle')}
                  value={dayForm.title}
                  onChange={(value) => updateDayForm('title', value)}
                  placeholder={t('timeline.dayTitlePlaceholder')}
                />

                <button
                  type="button"
                  onClick={saveDay}
                  className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
                >
                  {dayMode === 'add' ? t('timeline.addDailySchedule') : t('common.saveChanges')}
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <CalendarDays size={17} />
                  <span className="text-xs">{t('timeline.plannedDays')}</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 mt-2">
                  {activePlannedDays}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center gap-2 text-gray-500">
                  <CheckCircle2 size={17} />
                  <span className="text-xs">{t('timeline.doneActivities')}</span>
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
                  {t('timeline.noScheduleTitle')}
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                  {t('timeline.noScheduleBody')}
                </p>

                <button
                  type="button"
                  onClick={openAddDayCard}
                  disabled={!userCanEdit}
                  className={`mt-5 rounded-xl px-5 py-3 text-sm font-semibold inline-flex items-center gap-2 ${
                    userCanEdit
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus size={16} />
                  {t('timeline.addDailySchedule')}
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
                        {day.date} · {t('timeline.doneCount', { done: doneCount, total: itemCount })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {userCanEdit && (
                        <>
                          <button type="button" onClick={() => openEditDayCard(day)}>
                            <Pencil size={15} className="text-gray-400" />
                          </button>

                          <button type="button" onClick={() => removeDay(day.id)}>
                            <Trash2 size={15} className="text-rose-400" />
                          </button>
                        </>
                      )}

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
                            {t('timeline.noActivities')}
                          </p>
                        </div>
                      )}

                      {sortedDayItems.map((item, index) => {
                        const activityMapUrl = getActivityMapUrl(item)
                        const ActivityContent = activityMapUrl ? 'a' : 'div'

                        return (
                          <div key={item.id} className="flex gap-3 py-3">
                            <div className="text-xs text-gray-400 w-12 pt-1 shrink-0">
                              {item.time || '--:--'}
                            </div>

                            <div className="relative flex flex-col items-center mr-1">
                              <button
                                type="button"
                                onClick={() => toggleActivityDone(day.id, item)}
                                disabled={!userCanEdit}
                                className={`w-4 h-4 rounded-full mt-0.5 shrink-0 border ${
                                  item.status === 'done'
                                    ? 'bg-green-500 border-green-500'
                                    : 'bg-white border-blue-300'
                                } ${userCanEdit ? '' : 'cursor-default'}`}
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
                                <ActivityContent
                                  href={activityMapUrl || undefined}
                                  target={activityMapUrl ? '_blank' : undefined}
                                  rel={activityMapUrl ? 'noreferrer' : undefined}
                                  aria-label={activityMapUrl ? t('timeline.openMap') : undefined}
                                  className={`flex items-start gap-2 min-w-0 rounded-xl -m-2 p-2 flex-1 ${
                                    activityMapUrl ? 'active:bg-blue-50' : ''
                                  }`}
                                >
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

                                    {activityMapUrl && (
                                      <p className="text-xs text-blue-500 mt-1 inline-flex items-center gap-1">
                                        <LinkIcon size={12} />
                                        {t('timeline.tapOpenMap')}
                                      </p>
                                    )}
                                  </div>
                                </ActivityContent>

                                {userCanEdit && (
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
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      <button
                        type="button"
                        onClick={() => openAddItem(day.id)}
                        disabled={!userCanEdit}
                        className={`flex items-center gap-1 text-sm mt-3 py-2 ${
                          userCanEdit ? 'text-blue-500' : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus size={15} />
                        {t('timeline.addActivity')}
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
                disabled={!userCanEdit}
                className={`w-full rounded-2xl py-4 font-semibold text-sm flex items-center justify-center gap-2 ${
                  userCanEdit
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={16} />
                {t('timeline.addAnotherDay')}
              </button>
            )}
          </>
        )}
      </div>

      {(creatingTrip || editingTrip) && (
        <EditModal
          title={creatingTrip ? t('home.createTrip') : t('home.editTrip')}
          onClose={closeTripModal}
        >
          {tripError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {tripError}
            </div>
          )}

          <InputField
            label={t('home.tripName')}
            value={tripForm.name}
            onChange={(value) =>
              setTripForm((form) => ({ ...form, name: value }))
            }
          />

          <InputField
            label={t('home.destination')}
            value={tripForm.destination}
            onChange={(value) =>
              setTripForm((form) => ({ ...form, destination: value }))
            }
          />

          <InputField
            label={t('home.coverEmoji')}
            value={tripForm.coverEmoji}
            onChange={(value) =>
              setTripForm((form) => ({ ...form, coverEmoji: value }))
            }
          />

          <InputField
            label={t('common.startDate')}
            type="date"
            value={tripForm.startDate}
            onChange={(value) => {
              setTripError('')
              setTripForm((form) => ({ ...form, startDate: value }))
            }}
          />

          <InputField
            label={t('common.endDate')}
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
                  {t('timeline.planningMembers')}
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  {t('timeline.planningMembersHint')}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                value={memberInput}
                onChange={(event) => setMemberInput(event.target.value)}
                onKeyDown={handleMemberInputKeyDown}
                placeholder={t('timeline.memberPlaceholder')}
              />

              <button
                type="button"
                onClick={addMemberToTripForm}
                className="bg-blue-500 text-white rounded-xl px-4 text-sm font-semibold flex items-center gap-1"
              >
                <Plus size={15} />
                {t('common.add')}
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
                {t('timeline.noMembersYet')}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={creatingTrip ? saveNewTrip : saveEditedTrip}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm"
          >
            {creatingTrip ? t('home.saveTrip') : t('common.saveChanges')}
          </button>
        </EditModal>
      )}

      {itemModal && (
        <EditModal
          title={itemModal.type === 'add' ? t('timeline.addActivity') : t('timeline.editActivity')}
          onClose={() => setItemModal(null)}
        >
          {itemError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {itemError}
            </div>
          )}

          <SelectField
            label={t('timeline.type')}
            value={itemForm.type}
            onChange={(value) => {
              updateItemForm('type', value)
              updateItemForm('icon', TYPE_ICON[value] || '📍')
            }}
            options={TYPE_OPTIONS.map((option) => ({
              ...option,
              label: `${TYPE_ICON[option.value]} ${t(`timeline.type.${option.value}`)}`,
            }))}
          />

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t('timeline.time')}
            </label>
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
              <select
                value={itemTimeParts.hour}
                onChange={(event) =>
                  updateItemForm(
                    'time',
                    buildTimeValue(event.target.value, itemTimeParts.minute, itemTimeParts.period)
                  )
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 bg-white"
                aria-label={t('timeline.timeHour')}
              >
                {HOUR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={itemTimeParts.minute}
                onChange={(event) =>
                  updateItemForm(
                    'time',
                    buildTimeValue(itemTimeParts.hour, event.target.value, itemTimeParts.period)
                  )
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 bg-white"
                aria-label={t('timeline.timeMinute')}
              >
                {MINUTE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={itemTimeParts.period}
                onChange={(event) =>
                  updateItemForm(
                    'time',
                    buildTimeValue(itemTimeParts.hour, itemTimeParts.minute, event.target.value)
                  )
                }
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-blue-400 bg-white"
                aria-label={t('timeline.timePeriod')}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <InputField
            label={t('timeline.activityName')}
            value={itemForm.title}
            onChange={(value) => updateItemForm('title', value)}
            placeholder={t('timeline.activityPlaceholder')}
          />

          <InputField
            label={t('timeline.location')}
            value={itemForm.location}
            onChange={(value) => updateItemForm('location', value)}
            placeholder={t('timeline.locationPlaceholder')}
          />

          <InputField
            label={t('timeline.mapsLink')}
            value={itemForm.mapUrl}
            onChange={(value) => updateItemForm('mapUrl', value)}
            placeholder="https://maps.google.com/..."
          />

          <InputField
            label={t('timeline.notes')}
            value={itemForm.note}
            onChange={(value) => updateItemForm('note', value)}
            placeholder={t('timeline.notesPlaceholder')}
          />

          <button
            type="button"
            onClick={saveItem}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {t('timeline.saveActivity')}
          </button>
        </EditModal>
      )}
    </div>
  )
}
