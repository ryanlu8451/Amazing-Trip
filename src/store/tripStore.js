import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const createId = () => Date.now().toString()

const emptyTips = {
  emergency: [],
  docs: [],
  notes: '',
}

const defaultTripInfo = {
  id: 'trip_default',
  name: 'Amazing Trip',
  destination: '日本東京',
  startDate: '2025-07-01',
  endDate: '2025-07-08',
  coverEmoji: '🗼',
  members: ['爸爸', '媽媽', '小明', '小花'],
}

const defaultFlights = [
  {
    id: '1',
    direction: '去程',
    airline: '日本航空',
    code: 'JL809',
    fromCity: '台北',
    fromAirport: '桃園 TPE',
    depTime: '08:00',
    toCity: '東京',
    toAirport: '成田 NRT',
    arrTime: '12:30',
    date: '2025-07-01',
    duration: '3h 30m',
    seat: '經濟艙',
    status: 'confirmed',
  },
  {
    id: '2',
    direction: '回程',
    airline: '日本航空',
    code: 'JL802',
    fromCity: '東京',
    fromAirport: '成田 NRT',
    depTime: '14:00',
    toCity: '台北',
    toAirport: '桃園 TPE',
    arrTime: '16:30',
    date: '2025-07-08',
    duration: '3h 30m',
    seat: '經濟艙',
    status: 'confirmed',
  },
]

const defaultHotels = [
  {
    id: '1',
    name: '東京灣希爾頓',
    area: '台場・港區',
    checkIn: '2025-07-01',
    checkOut: '2025-07-08',
    rooms: 2,
    pricePerNight: 8000,
    phone: '+81-3-5500-5500',
    address: '東京都港區台場1-9-1',
    wifi: 'HiltonTokyo_Guest / tokyo2025',
    amenities: ['🏊 游泳池', '🏋️ 健身房', '🍳 早餐', '🅿️ 停車場'],
  },
]

const defaultBudget = [
  { id: '1', label: '機票', emoji: '✈️', amount: 48000 },
  { id: '2', label: '住宿', emoji: '🏨', amount: 32000 },
  { id: '3', label: '行程', emoji: '🎡', amount: 15000 },
  { id: '4', label: '交通', emoji: '🚆', amount: 8000 },
  { id: '5', label: '餐飲', emoji: '🍜', amount: 12000 },
  { id: '6', label: '雜支', emoji: '🛍️', amount: 5000 },
]

const defaultTimeline = [
  {
    id: '1',
    day: 1,
    date: '2025-07-01',
    title: '抵達東京',
    items: [
      { id: 'a1', time: '10:30', icon: '✈️', title: '降落成田機場', note: 'JL809 航班', type: 'flight' },
      { id: 'a2', time: '13:00', icon: '🚆', title: '成田特快車進市區', note: '約60分鐘', type: 'transport' },
      { id: 'a3', time: '15:00', icon: '🏨', title: 'Check-in 東京灣希爾頓', note: '港區台場', type: 'hotel' },
      { id: 'a4', time: '18:00', icon: '🍜', title: '晚餐｜新宿拉麵', note: '一蘭拉麵本店', type: 'food' },
    ],
  },
]

const defaultTips = {
  emergency: [
    { id: '1', label: '日本警察', number: '110', emoji: '🚔' },
    { id: '2', label: '救護車/消防', number: '119', emoji: '🚑' },
    { id: '3', label: '台灣駐日代表處', number: '+81-3-3280-7811', emoji: '🇹🇼' },
  ],
  docs: [
    { id: '1', label: '護照號碼', value: 'A12345678 (爸爸)', emoji: '🛂' },
    { id: '2', label: '旅遊保險單號', value: 'INS-2025-00123', emoji: '📋' },
    { id: '3', label: '訂房確認碼', value: 'HIL-TYO-88821', emoji: '🏨' },
  ],
  notes: '記得帶轉接頭！日本插座是兩孔扁型。',
}

const defaultTrip = {
  ...defaultTripInfo,
  flights: defaultFlights,
  hotels: defaultHotels,
  budget: defaultBudget,
  timeline: defaultTimeline,
  tips: defaultTips,
}

const emptyTripInfo = {
  id: '',
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  coverEmoji: '🌍',
  members: [],
}

function getTripInfo(trip) {
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    coverEmoji: trip.coverEmoji,
    members: trip.members,
  }
}

function getActiveTripState(activeTrip) {
  if (!activeTrip) {
    return {
      trip: emptyTripInfo,
      flights: [],
      hotels: [],
      budget: [],
      timeline: [],
      tips: emptyTips,
    }
  }

  return {
    trip: getTripInfo(activeTrip),
    flights: activeTrip.flights || [],
    hotels: activeTrip.hotels || [],
    budget: activeTrip.budget || [],
    timeline: activeTrip.timeline || [],
    tips: activeTrip.tips || emptyTips,
  }
}

function updateActiveTripSection(state, sectionName, newSectionValue) {
  const updatedTrips = state.trips.map((trip) => {
    if (trip.id === state.activeTripId) {
      return {
        ...trip,
        [sectionName]: newSectionValue,
      }
    }

    return trip
  })

  const activeTrip = updatedTrips.find((trip) => trip.id === state.activeTripId)

  return {
    trips: updatedTrips,
    ...getActiveTripState(activeTrip),
  }
}

function getStateFromTrips(trips, activeTripId) {
  const activeTrip =
    trips.find((trip) => trip.id === activeTripId) ||
    trips[0] ||
    null

  return {
    trips,
    activeTripId: activeTrip ? activeTrip.id : '',
    ...getActiveTripState(activeTrip),
  }
}

export const useTripStore = create(
  persist(
    (set) => ({
      trips: [defaultTrip],
      activeTripId: defaultTrip.id,
      cloudReady: false,
      cloudError: '',

      // Backward-compatible active trip data
      trip: getTripInfo(defaultTrip),
      flights: defaultFlights,
      hotels: defaultHotels,
      budget: defaultBudget,
      timeline: defaultTimeline,
      tips: defaultTips,

      setTripsFromCloud: (cloudTrips) => {
        set((state) => ({
          ...getStateFromTrips(cloudTrips, state.activeTripId),
          cloudReady: true,
          cloudError: '',
        }))
      },

      setCloudError: (message) => {
        set({
          cloudReady: true,
          cloudError: message,
        })
      },

      // Trip management
      addTrip: (tripData) => {
        const newTrip = {
          id: createId(),
          name: tripData.name || 'My Amazing Trip',
          destination: tripData.destination || '',
          startDate: tripData.startDate || '',
          endDate: tripData.endDate || '',
          coverEmoji: tripData.coverEmoji || '🌍',
          members: tripData.members || [],
          flights: [],
          hotels: [],
          budget: [],
          timeline: [],
          tips: emptyTips,
          status: tripData.status || 'planning',
          isHidden: Boolean(tripData.isHidden),
          ownerId: tripData.ownerId || '',
          ownerEmail: tripData.ownerEmail || '',
          memberEmails: tripData.memberEmails || [],
          memberRoles: tripData.memberRoles || {},
        }

        set((state) => ({
          trips: [...state.trips, newTrip],
          activeTripId: newTrip.id,
          ...getActiveTripState(newTrip),
        }))
      },

      setActiveTrip: (tripId) => {
        set((state) => {
          const activeTrip = state.trips.find((trip) => trip.id === tripId)

          return {
            activeTripId: tripId,
            ...getActiveTripState(activeTrip),
          }
        })
      },

      deleteTrip: (tripId) => {
        set((state) => {
          const remainingTrips = state.trips.filter((trip) => trip.id !== tripId)

          return {
            ...getStateFromTrips(remainingTrips, state.activeTripId),
          }
        })
      },

      updateTrip: (data) => {
        set((state) => {
          const updatedTrips = state.trips.map((trip) => {
            if (trip.id === state.activeTripId) {
              return {
                ...trip,
                ...data,
              }
            }

            return trip
          })

          const activeTrip = updatedTrips.find((trip) => trip.id === state.activeTripId)

          return {
            trips: updatedTrips,
            ...getActiveTripState(activeTrip),
          }
        })
      },

      // Flights
      addFlight: (flight) => {
        set((state) => {
          const newFlights = [...state.flights, { ...flight, id: createId() }]
          return updateActiveTripSection(state, 'flights', newFlights)
        })
      },

      updateFlight: (id, data) => {
        set((state) => {
          const newFlights = state.flights.map((flight) =>
            flight.id === id ? { ...flight, ...data } : flight
          )

          return updateActiveTripSection(state, 'flights', newFlights)
        })
      },

      deleteFlight: (id) => {
        set((state) => {
          const newFlights = state.flights.filter((flight) => flight.id !== id)
          return updateActiveTripSection(state, 'flights', newFlights)
        })
      },

      // Hotels
      addHotel: (hotel) => {
        set((state) => {
          const newHotels = [...state.hotels, { ...hotel, id: createId() }]
          return updateActiveTripSection(state, 'hotels', newHotels)
        })
      },

      updateHotel: (id, data) => {
        set((state) => {
          const newHotels = state.hotels.map((hotel) =>
            hotel.id === id ? { ...hotel, ...data } : hotel
          )

          return updateActiveTripSection(state, 'hotels', newHotels)
        })
      },

      deleteHotel: (id) => {
        set((state) => {
          const newHotels = state.hotels.filter((hotel) => hotel.id !== id)
          return updateActiveTripSection(state, 'hotels', newHotels)
        })
      },

      // Budget
      addBudgetItem: (item) => {
        set((state) => {
          const newBudget = [...state.budget, { ...item, id: createId() }]
          return updateActiveTripSection(state, 'budget', newBudget)
        })
      },

      updateBudgetItem: (id, data) => {
        set((state) => {
          const newBudget = state.budget.map((item) =>
            item.id === id ? { ...item, ...data } : item
          )

          return updateActiveTripSection(state, 'budget', newBudget)
        })
      },

      deleteBudgetItem: (id) => {
        set((state) => {
          const newBudget = state.budget.filter((item) => item.id !== id)
          return updateActiveTripSection(state, 'budget', newBudget)
        })
      },

      // Timeline
      addDay: (day) => {
        set((state) => {
          const newTimeline = [
            ...state.timeline,
            {
              ...day,
              id: createId(),
              items: [],
            },
          ]

          return updateActiveTripSection(state, 'timeline', newTimeline)
        })
      },

      updateDay: (id, data) => {
        set((state) => {
          const newTimeline = state.timeline.map((day) =>
            day.id === id ? { ...day, ...data } : day
          )

          return updateActiveTripSection(state, 'timeline', newTimeline)
        })
      },

      deleteDay: (id) => {
        set((state) => {
          const newTimeline = state.timeline.filter((day) => day.id !== id)
          return updateActiveTripSection(state, 'timeline', newTimeline)
        })
      },

      addTimelineItem: (dayId, item) => {
        set((state) => {
          const newTimeline = state.timeline.map((day) => {
            if (day.id === dayId) {
              return {
                ...day,
                items: [...day.items, { ...item, id: createId() }],
              }
            }

            return day
          })

          return updateActiveTripSection(state, 'timeline', newTimeline)
        })
      },

      updateTimelineItem: (dayId, itemId, data) => {
        set((state) => {
          const newTimeline = state.timeline.map((day) => {
            if (day.id === dayId) {
              return {
                ...day,
                items: day.items.map((item) =>
                  item.id === itemId ? { ...item, ...data } : item
                ),
              }
            }

            return day
          })

          return updateActiveTripSection(state, 'timeline', newTimeline)
        })
      },

      deleteTimelineItem: (dayId, itemId) => {
        set((state) => {
          const newTimeline = state.timeline.map((day) => {
            if (day.id === dayId) {
              return {
                ...day,
                items: day.items.filter((item) => item.id !== itemId),
              }
            }

            return day
          })

          return updateActiveTripSection(state, 'timeline', newTimeline)
        })
      },

      // Tips
      updateTips: (data) => {
        set((state) => {
          const newTips = {
            ...state.tips,
            ...data,
          }

          return updateActiveTripSection(state, 'tips', newTips)
        })
      },

      addEmergency: (item) => {
        set((state) => {
          const newTips = {
            ...state.tips,
            emergency: [...state.tips.emergency, { ...item, id: createId() }],
          }

          return updateActiveTripSection(state, 'tips', newTips)
        })
      },

      deleteEmergency: (id) => {
        set((state) => {
          const newTips = {
            ...state.tips,
            emergency: state.tips.emergency.filter((item) => item.id !== id),
          }

          return updateActiveTripSection(state, 'tips', newTips)
        })
      },

      addDoc: (item) => {
        set((state) => {
          const newTips = {
            ...state.tips,
            docs: [...state.tips.docs, { ...item, id: createId() }],
          }

          return updateActiveTripSection(state, 'tips', newTips)
        })
      },

      deleteDoc: (id) => {
        set((state) => {
          const newTips = {
            ...state.tips,
            docs: state.tips.docs.filter((item) => item.id !== id),
          }

          return updateActiveTripSection(state, 'tips', newTips)
        })
      },
    }),
    {
      name: 'amazing-trip-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),

      migrate: (persistedState) => {
        if (persistedState && persistedState.trips) {
          return persistedState
        }

        const oldTripInfo = persistedState?.trip || defaultTripInfo

        const migratedTrip = {
          id: 'trip_default',
          name: oldTripInfo.name || 'Amazing Trip',
          destination: oldTripInfo.destination || '',
          startDate: oldTripInfo.startDate || '',
          endDate: oldTripInfo.endDate || '',
          coverEmoji: oldTripInfo.coverEmoji || '🌍',
          members: oldTripInfo.members || [],
          flights: persistedState?.flights || defaultFlights,
          hotels: persistedState?.hotels || defaultHotels,
          budget: persistedState?.budget || defaultBudget,
          timeline: persistedState?.timeline || defaultTimeline,
          tips: persistedState?.tips || defaultTips,
        }

        return {
          trips: [migratedTrip],
          activeTripId: migratedTrip.id,
          ...getActiveTripState(migratedTrip),
        }
      },

      merge: (persistedState, currentState) => {
        const mergedState = {
          ...currentState,
          ...persistedState,
        }

        const activeTrip = mergedState.trips?.find(
          (trip) => trip.id === mergedState.activeTripId
        )

        return {
          ...mergedState,
          ...getActiveTripState(activeTrip),
        }
      },
    }
  )
)
