import { useEffect, useRef } from 'react'
import {
  canDeleteTrip,
  canSaveTripToCloud,
  deleteTripFromCloud,
  isLegacyDemoTrip,
  saveTripToCloud,
  subscribeToSharedTrips,
} from '../lib/tripCloud'
import { useTripStore } from '../store/tripStore'

function getCloudSafeTripId(trip, user) {
  if (trip.id === 'trip_default') {
    return `${user.uid}_trip_default`
  }

  return trip.id
}

function prepareLocalTripsForCloud(trips, user) {
  return trips
    .filter((trip) => !isLegacyDemoTrip(trip, user))
    .map((trip) => ({
      ...trip,
      id: getCloudSafeTripId(trip, user),
    }))
}

function sortTripsForDisplay(trips) {
  return [...trips].sort((a, b) => {
    const dateA = a.startDate ? new Date(`${a.startDate}T00:00:00`) : new Date(8640000000000000)
    const dateB = b.startDate ? new Date(`${b.startDate}T00:00:00`) : new Date(8640000000000000)

    if (dateA - dateB !== 0) {
      return dateA - dateB
    }

    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}

export function useTripCloudSync(user) {
  const applyingCloudRef = useRef(false)
  const lastTripsRef = useRef([])
  const writeTimerRef = useRef(null)
  const hasMigratedLocalTripsRef = useRef(false)

  useEffect(() => {
    if (!user?.email) {
      return undefined
    }

    const unsubscribe = subscribeToSharedTrips(
      user,
      async (cloudTrips) => {
        const currentTrips = useTripStore.getState().trips.filter(
          (trip) => !isLegacyDemoTrip(trip, user)
        )
        const displayCloudTrips = cloudTrips.filter((trip) => !isLegacyDemoTrip(trip, user))

        if (displayCloudTrips.length === 0 && currentTrips.length > 0 && !hasMigratedLocalTripsRef.current) {
          hasMigratedLocalTripsRef.current = true
          const cloudSafeTrips = prepareLocalTripsForCloud(currentTrips, user)
          applyingCloudRef.current = true
          useTripStore.getState().setTripsFromCloud(cloudSafeTrips)
          lastTripsRef.current = cloudSafeTrips
          applyingCloudRef.current = false
          await saveTripsIndividually(cloudSafeTrips, user)
          return
        }

        applyingCloudRef.current = true
        const sortedTrips = sortTripsForDisplay(displayCloudTrips)
        useTripStore.getState().setTripsFromCloud(sortedTrips)
        lastTripsRef.current = sortedTrips
        applyingCloudRef.current = false
      },
      (error) => {
        console.error('[Trip Cloud Subscribe Error]', {
          code: error.code,
          message: error.message,
        })
        useTripStore.getState().clearCloudError()
      }
    )

    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user?.email) {
      return undefined
    }

    lastTripsRef.current = useTripStore.getState().trips

    const unsubscribe = useTripStore.subscribe((state, previousState) => {
      if (applyingCloudRef.current || state.trips === previousState.trips) {
        return
      }

      window.clearTimeout(writeTimerRef.current)

      writeTimerRef.current = window.setTimeout(async () => {
        const currentIds = new Set(state.trips.map((trip) => trip.id))
        const deletedTripIds = lastTripsRef.current
          .filter((trip) => !currentIds.has(trip.id) && canDeleteTrip(trip, user))
          .map((trip) => trip.id)
        const tripsToSave = state.trips.filter(
          (trip) => !isLegacyDemoTrip(trip, user) && canSaveTripToCloud(trip, user)
        )

        try {
          const saveErrors = await saveTripsIndividually(tripsToSave, user)
          const deleteErrors = await deleteTripsIndividually(deletedTripIds)

          if (saveErrors.length > 0 || deleteErrors.length > 0) {
            throw new Error('Some trip changes could not sync to Firebase.')
          }

          lastTripsRef.current = state.trips
          useTripStore.getState().setCloudError('')
        } catch (error) {
          console.error('[Trip Cloud Save Error]', {
            code: error.code,
            message: error.message,
          })
          useTripStore.getState().setCloudError(
            'Some trip changes could not sync to Firebase. Owner-only sharing changes must be made by the trip owner.'
          )
        }
      }, 500)
    })

    return () => {
      window.clearTimeout(writeTimerRef.current)
      unsubscribe()
    }
  }, [user])
}

async function saveTripsIndividually(trips, user) {
  const results = await Promise.allSettled(
    trips.map((trip) => saveTripToCloud(trip, user))
  )

  return results.filter((result) => result.status === 'rejected')
}

async function deleteTripsIndividually(tripIds) {
  const results = await Promise.allSettled(
    tripIds.map((tripId) => deleteTripFromCloud(tripId))
  )

  return results.filter((result) => result.status === 'rejected')
}
