import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Wallet,
  ChevronRight,
  Users,
  Pencil,
  Plus,
  MapPin,
  Trash2,
  CheckCircle2,
  Settings,
  LogOut,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import EditModal from '../components/EditModal'
import { InputField } from '../components/InputField'

const emptyTripForm = {
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  coverEmoji: '🌍',
  members: [],
}

function CountdownBadge({ startDate }) {
  if (!startDate) {
    return <div className="text-white text-xl font-bold">Start planning ✨</div>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const departureDate = new Date(`${startDate}T00:00:00`)
  const days = Math.ceil((departureDate - today) / (1000 * 60 * 60 * 24))

  if (days > 0) {
    return (
      <div className="text-center">
        <div className="text-5xl font-bold text-white">{days}</div>
        <div className="text-white/80 text-sm mt-1">
          {days === 1 ? 'day to go' : 'days to go'}
        </div>
      </div>
    )
  }

  if (days === 0) {
    return <div className="text-white text-xl font-bold">🎉 Departing today!</div>
  }

  return <div className="text-white text-xl font-bold">In progress / started ✈️</div>
}

function getTripDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0
  }

  const days =
    Math.ceil(
      (new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) /
        (1000 * 60 * 60 * 24)
    ) + 1

  return days > 0 ? days : 0
}

function formatMembers(members) {
  return (members || []).join(', ')
}

function parseMembers(value) {
  return value
    .split(/[,、，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function isDateRangeValid(startDate, endDate) {
  if (!startDate || !endDate) {
    return true
  }

  return new Date(`${endDate}T00:00:00`) >= new Date(`${startDate}T00:00:00`)
}

function getTripStartTime(trip) {
  if (!trip.startDate) {
    return Number.MAX_SAFE_INTEGER
  }

  const startDate = new Date(`${trip.startDate}T00:00:00`)

  if (Number.isNaN(startDate.getTime())) {
    return Number.MAX_SAFE_INTEGER
  }

  return startDate.getTime()
}

function sortTripsByStartDate(trips) {
  return [...trips].sort((a, b) => {
    const startA = getTripStartTime(a)
    const startB = getTripStartTime(b)

    if (startA !== startB) {
      return startA - startB
    }

    return (a.name || a.destination || '').localeCompare(b.name || b.destination || '')
  })
}

export default function Home() {
  const navigate = useNavigate()

  const {
    trips,
    activeTripId,
    trip,
    budget,
    timeline,
    addTrip,
    setActiveTrip,
    deleteTrip,
    updateTrip,
  } = useTripStore()
  const { user, logOut } = useAuthStore()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [createForm, setCreateForm] = useState(emptyTripForm)
  const [editForm, setEditForm] = useState(trip)
  const [createError, setCreateError] = useState('')
  const [editError, setEditError] = useState('')
  const lastTripTapRef = useRef({ tripId: '', time: 0 })

  const sortedTrips = sortTripsByStartDate(trips)
  const hasTrips = trips.length > 0
  const activeTrip = trips.find((item) => item.id === activeTripId)
  const total = budget.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const tripDays = getTripDays(trip.startDate, trip.endDate)
  const plannedDays = timeline.length
  const plannedItems = timeline.reduce((sum, day) => sum + (day.items?.length || 0), 0)

  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-teal-500',
  ]

  const openCreateModal = () => {
    setCreateForm(emptyTripForm)
    setCreateError('')
    setCreating(true)
  }

  const saveNewTrip = () => {
    if (!createForm.name || !createForm.destination) {
      setCreateError('Please enter a trip name and destination.')
      return
    }

    if (!isDateRangeValid(createForm.startDate, createForm.endDate)) {
      setCreateError('End date cannot be earlier than start date.')
      return
    }

    addTrip(createForm)
    setCreating(false)
  }

  const openEditModal = () => {
    setEditForm(trip)
    setEditError('')
    setEditing(true)
  }

  const saveEditTrip = () => {
    if (!editForm.name || !editForm.destination) {
      setEditError('Please enter a trip name and destination.')
      return
    }

    if (!isDateRangeValid(editForm.startDate, editForm.endDate)) {
      setEditError('End date cannot be earlier than start date.')
      return
    }

    updateTrip(editForm)
    setEditing(false)
  }

  const removeTrip = (tripId) => {
    const confirmed = window.confirm(
      'Delete this trip? Flights, hotels, budget, and schedules under this trip will also be deleted.'
    )

    if (confirmed) {
      deleteTrip(tripId)
    }
  }

  const selectTrip = (tripId) => {
    setActiveTrip(tripId)
  }

  const openTripTimeline = (tripId) => {
    setActiveTrip(tripId)
    navigate('/timeline')
  }

  const handleTripCardTap = (tripId, event) => {
    const now = event.timeStamp
    const lastTap = lastTripTapRef.current
    const isDoubleTap = lastTap.tripId === tripId && now - lastTap.time < 380

    if (isDoubleTap) {
      lastTripTapRef.current = { tripId: '', time: 0 }
      openTripTimeline(tripId)
      return
    }

    lastTripTapRef.current = { tripId, time: now }
    selectTrip(tripId)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 overflow-x-hidden">
      <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 px-6 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-blue-200 text-sm font-medium tracking-wide">AMAZING TRIP</p>
              <h1 className="text-white text-2xl font-bold mt-1">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Plan, organize, and share every trip in one place.
              </p>
            </div>

            <button
              type="button"
              onClick={logOut}
              className="bg-white/20 text-white rounded-full p-2 shrink-0"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>

          {user && (
            <div className="mb-5 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="w-9 h-9 rounded-full border border-white/50"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
                  {(user.name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {user.name || 'Signed in'}
                </p>
                <p className="text-blue-100 text-xs truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {hasTrips && activeTrip ? (
            <div className="bg-white/15 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-4xl">{trip.coverEmoji}</span>
                    <div>
                      <h2 className="text-white text-xl font-bold">
                        {trip.name || trip.destination || 'Untitled Trip'}
                      </h2>
                      <p className="text-blue-100 text-sm flex items-center gap-1 mt-1">
                        <MapPin size={14} />
                        {trip.destination || 'No destination yet'}
                      </p>
                    </div>
                  </div>

                  <p className="text-blue-100 text-sm mt-3">
                    {trip.startDate || 'Start date'} → {trip.endDate || 'End date'}
                    {tripDays > 0 ? ` · ${tripDays} ${tripDays === 1 ? 'day' : 'days'}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openEditModal}
                  className="bg-white/20 p-2 rounded-full"
                  aria-label="Edit active trip"
                >
                  <Pencil size={16} className="text-white" />
                </button>
              </div>

              <div className="text-center pt-2">
                <CountdownBadge startDate={trip.startDate} />

                <div className="flex justify-center flex-wrap gap-2 mt-4">
                  {(trip.members || []).map((member) => (
                    <div
                      key={member}
                      className="bg-white/20 rounded-full px-3 py-1 text-white text-xs"
                    >
                      {member}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/trip-settings')}
                  className="mt-5 w-full bg-white text-blue-600 rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <Settings size={17} />
                  Manage Trip Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/15 rounded-2xl p-5 text-center backdrop-blur">
              <div className="text-5xl mb-3">🌍</div>
              <h2 className="text-white text-xl font-bold">No trips yet</h2>
              <p className="text-blue-100 text-sm mt-2">
                Use the + button in My Trips below to create your first trip.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 overflow-x-hidden">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-800">My Trips</h2>
              <p className="text-xs text-gray-400 mt-1">
                Trips are sorted by departure date. Tap to select, double tap to open timeline.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="bg-blue-50 text-blue-600 rounded-full p-2"
              aria-label="Create trip"
            >
              <Plus size={18} />
            </button>
          </div>

          {sortedTrips.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-500">No trips created yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Tap the + button above to start planning.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTrips.map((item) => {
                const isActive = item.id === activeTripId

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition active:scale-[0.99] ${
                      isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={(event) => handleTripCardTap(item.id, event)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0"
                      >
                        <div className="text-3xl shrink-0">{item.coverEmoji || '🌍'}</div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800 truncate">
                              {item.name || item.destination || 'Untitled Trip'}
                            </h3>

                            {isActive && (
                              <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {item.destination || 'No destination'}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            {item.startDate || 'Start date'} → {item.endDate || 'End date'}
                          </p>

                          <p className="text-[11px] text-blue-400 mt-2">
                            {isActive ? 'Selected · Double tap to open timeline' : 'Tap to select · Double tap to open timeline'}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeTrip(item.id)}
                        className="p-2 rounded-full hover:bg-red-50 shrink-0"
                        aria-label="Delete trip"
                      >
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {hasTrips && (
          <>
            <button
              type="button"
              onClick={() => navigate('/timeline')}
              className="w-full bg-white rounded-2xl shadow-sm overflow-hidden text-left"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  <span className="font-semibold text-gray-800">Trip Timeline</span>
                </div>

                <span className="text-blue-500 text-sm flex items-center gap-1">
                  Manage <ChevronRight size={14} />
                </span>
              </div>

              {plannedDays === 0 ? (
                <div className="px-5 pb-5">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-700">
                      No daily schedule yet
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Tap here to add daily activities, times, locations, and notes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-5 pb-5">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-700">
                      {plannedDays} planned day{plannedDays === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      {plannedItems} activit{plannedItems === 1 ? 'y' : 'ies'} added. Tap here to keep planning.
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {timeline.slice(0, 2).map((day) => {
                      const itemCount = day.items?.length || 0

                      return (
                        <div
                          key={day.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              Day {day.day} · {day.title || 'Untitled Day'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {day.date || 'No date'} · {itemCount}{' '}
                              {itemCount === 1 ? 'activity' : 'activities'}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/budget')}
              className="w-full bg-white rounded-2xl shadow-sm p-5 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-green-500" />
                  <span className="font-semibold text-gray-800">Budget Overview</span>
                </div>

                <span className="text-green-500 text-sm flex items-center gap-1">
                  Manage <ChevronRight size={14} />
                </span>
              </div>

              {budget.length === 0 ? (
                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="text-sm font-semibold text-green-700">No budget set yet</p>
                  <p className="text-xs text-green-600 mt-1">
                    Add planned budgets or actual spending for flights, hotels, food, and more.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    Budget Items Total: {Number(total || 0).toLocaleString()}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {budget.slice(0, 4).map((item, index) => {
                      const styles = [
                        'bg-blue-50 text-blue-700',
                        'bg-purple-50 text-purple-700',
                        'bg-orange-50 text-orange-700',
                        'bg-gray-50 text-gray-600',
                      ]

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl p-3 ${styles[index % styles.length]}`}
                        >
                          <div className="text-xs mb-1">
                            {item.emoji} {item.label}
                          </div>
                          <div className="font-semibold text-sm">
                            {Number(item.amount || 0).toLocaleString()}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </button>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-rose-500" />
                <span className="font-semibold text-gray-800">Travel Members</span>
              </div>

              {(trip.members || []).length === 0 ? (
                <p className="text-sm text-gray-400">No travel members added yet.</p>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {(trip.members || []).map((member, index) => (
                    <div key={member} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-12 h-12 ${colors[index % colors.length]} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                      >
                        {member[0]}
                      </div>
                      <span className="text-xs text-gray-600">{member}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {creating && (
        <EditModal title="Create Trip" onClose={() => setCreating(false)}>
          {createError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {createError}
            </div>
          )}

          <InputField
            label="Trip Name"
            value={createForm.name}
            onChange={(value) => setCreateForm((form) => ({ ...form, name: value }))}
            placeholder="Japan Trip"
          />

          <InputField
            label="Destination"
            value={createForm.destination}
            onChange={(value) => setCreateForm((form) => ({ ...form, destination: value }))}
            placeholder="Tokyo, Japan"
          />

          <InputField
            label="Cover Emoji"
            value={createForm.coverEmoji}
            onChange={(value) => setCreateForm((form) => ({ ...form, coverEmoji: value }))}
            placeholder="🌍"
          />

          <InputField
            label="Start Date"
            type="date"
            value={createForm.startDate}
            onChange={(value) => {
              setCreateError('')
              setCreateForm((form) => ({ ...form, startDate: value }))
            }}
          />

          <InputField
            label="End Date"
            type="date"
            value={createForm.endDate}
            onChange={(value) => {
              setCreateError('')
              setCreateForm((form) => ({ ...form, endDate: value }))
            }}
          />

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Members (comma-separated)
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              value={formatMembers(createForm.members)}
              onChange={(event) =>
                setCreateForm((form) => ({
                  ...form,
                  members: parseMembers(event.target.value),
                }))
              }
              placeholder="Ryan, Alex, Cindy"
            />
          </div>

          <button
            type="button"
            onClick={saveNewTrip}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm"
          >
            Save Trip
          </button>
        </EditModal>
      )}

      {editing && (
        <EditModal title="Edit Trip" onClose={() => setEditing(false)}>
          {editError && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {editError}
            </div>
          )}

          <InputField
            label="Trip Name"
            value={editForm.name}
            onChange={(value) => setEditForm((form) => ({ ...form, name: value }))}
          />

          <InputField
            label="Destination"
            value={editForm.destination}
            onChange={(value) => setEditForm((form) => ({ ...form, destination: value }))}
          />

          <InputField
            label="Cover Emoji"
            value={editForm.coverEmoji}
            onChange={(value) => setEditForm((form) => ({ ...form, coverEmoji: value }))}
          />

          <InputField
            label="Start Date"
            type="date"
            value={editForm.startDate}
            onChange={(value) => {
              setEditError('')
              setEditForm((form) => ({ ...form, startDate: value }))
            }}
          />

          <InputField
            label="End Date"
            type="date"
            value={editForm.endDate}
            onChange={(value) => {
              setEditError('')
              setEditForm((form) => ({ ...form, endDate: value }))
            }}
          />

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Members (comma-separated)
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
              value={formatMembers(editForm.members || [])}
              onChange={(event) =>
                setEditForm((form) => ({
                  ...form,
                  members: parseMembers(event.target.value),
                }))
              }
              placeholder="Ryan, Alex, Cindy"
            />
          </div>

          <button
            type="button"
            onClick={saveEditTrip}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm"
          >
            Save Changes
          </button>
        </EditModal>
      )}
    </div>
  )
}
