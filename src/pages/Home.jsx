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
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
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
    <div className="travel-screen px-3 py-3">
      <div className="travel-phone">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Hi, David <span className="text-base">👋</span>
              </h1>
              <p className="text-xs font-medium text-slate-400 mt-1">Explore the world</p>
            </div>

            <button
              type="button"
              onClick={openEditModal}
              className="h-10 w-10 rounded-full bg-white shadow-md shadow-slate-200 overflow-hidden border border-white"
              aria-label="Edit active trip"
            >
              <span className="block h-full w-full bg-gradient-to-br from-amber-100 to-slate-200 pt-2 text-center text-lg">
                {trip.coverEmoji || '🌍'}
              </span>
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <Search size={15} className="text-slate-400" />
            <span className="flex-1 text-xs text-slate-400">Search places</span>
            <div className="h-5 w-px bg-slate-200" />
            <SlidersHorizontal size={15} className="text-slate-500" />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Popular places</h2>
            <button type="button" className="text-[11px] font-semibold text-slate-400">
              View all
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <span className="travel-pill px-4 py-2 text-[11px] font-semibold">Most Viewed</span>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-semibold text-slate-400">
              Nearby
            </span>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-semibold text-slate-400">
              Latest
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {hasTrips && activeTrip ? (
            <div className="travel-hero-card min-h-72 p-4 flex flex-col justify-end">
              <button
                type="button"
                onClick={openEditModal}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/30 p-2 backdrop-blur"
                aria-label="Edit active trip"
              >
                <Pencil size={15} className="text-white" />
              </button>

              <div className="relative z-10 rounded-2xl bg-slate-950/42 p-3 backdrop-blur-sm">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-white">
                      {trip.name || trip.destination || 'Untitled Trip'}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-white/80">
                      <MapPin size={11} />
                      {trip.destination || 'No destination yet'}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-white/60">Days</p>
                    <p className="text-lg font-extrabold text-white">{tripDays || '--'}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-white/80">
                  <span>{trip.startDate || 'Start date'} → {trip.endDate || 'End date'}</span>
                  <span className="flex items-center gap-1">
                    <Star size={11} className="fill-white text-white" />
                    4.8
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="travel-hero-card min-h-72 p-6 flex flex-col items-center justify-center text-center">
              <div className="relative z-10">
                <div className="text-5xl mb-4">Travel 🌐</div>
                <h2 className="text-white text-xl font-bold">Find your dream destination</h2>
                <p className="text-white/75 text-sm mt-2">
                  Create your first trip from My Trips below.
                </p>
              </div>
            </div>
          )}

          <div className="travel-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-extrabold text-slate-900">My Trips</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tap to select, double tap to open timeline.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="bg-slate-950 text-white rounded-full p-2.5 shadow-lg shadow-slate-950/20"
                aria-label="Create trip"
              >
                <Plus size={18} />
              </button>
            </div>

          {sortedTrips.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">No trips created yet.</p>
              <p className="text-xs text-slate-400 mt-1">
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
                    className={`rounded-[1.25rem] border p-3.5 transition active:scale-[0.99] ${
                      isActive ? 'border-slate-900 bg-slate-50' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={(event) => handleTripCardTap(item.id, event)}
                        className="flex items-start gap-3 text-left flex-1 min-w-0"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center text-2xl shrink-0">
                          {item.coverEmoji || '🌍'}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 truncate">
                              {item.name || item.destination || 'Untitled Trip'}
                            </h3>

                            {isActive && (
                              <CheckCircle2 size={15} className="text-slate-950 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-slate-500 mt-1 truncate">
                            {item.destination || 'No destination'}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {item.startDate || 'Start date'} → {item.endDate || 'End date'}
                          </p>

                          <p className="text-[11px] text-slate-400 mt-2">
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
              className="travel-card w-full overflow-hidden text-left"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-900" />
                  <span className="font-bold text-slate-900">Trip Timeline</span>
                </div>

                <span className="text-slate-500 text-sm flex items-center gap-1">
                  Manage <ChevronRight size={14} />
                </span>
              </div>

              {plannedDays === 0 ? (
                <div className="px-5 pb-5">
                  <div className="rounded-2xl bg-sky-50 p-4">
                    <p className="text-sm font-bold text-slate-900">
                      No daily schedule yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tap here to add daily activities, times, locations, and notes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="px-5 pb-5">
                  <div className="rounded-2xl bg-sky-50 p-4">
                    <p className="text-sm font-bold text-slate-900">
                      {plannedDays} planned day{plannedDays === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {plannedItems} activit{plannedItems === 1 ? 'y' : 'ies'} added. Tap here to keep planning.
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    {timeline.slice(0, 2).map((day) => {
                      const itemCount = day.items?.length || 0

                      return (
                        <div
                          key={day.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
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
              className="travel-card w-full p-5 text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-slate-900" />
                  <span className="font-bold text-slate-900">Budget Overview</span>
                </div>

                <span className="text-slate-500 text-sm flex items-center gap-1">
                  Manage <ChevronRight size={14} />
                </span>
              </div>

              {budget.length === 0 ? (
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-slate-900">No budget set yet</p>
                  <p className="text-xs text-slate-500 mt-1">
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

            <div className="travel-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} className="text-slate-900" />
                <span className="font-bold text-slate-900">Travel Members</span>
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
              className="travel-input"
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
            className="w-full travel-pill py-3 font-semibold text-sm"
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
              className="travel-input"
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
            className="w-full travel-pill py-3 font-semibold text-sm"
          >
            Save Changes
          </button>
        </EditModal>
      )}
    </div>
  )
}
