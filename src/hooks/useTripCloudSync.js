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

function getComparableTrip(trip) {
  return Object.fromEntries(
    Object.entries(trip || {}).filter(([key]) => key !== 'updatedAt')
  )
}

function hasTripChanged(currentTrip, previousTrip) {
  if (!previousTrip) {
    return true
  }

  return JSON.stringify(getComparableTrip(currentTrip)) !== JSON.stringify(getComparableTrip(previousTrip))
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
          const saveErrors = await saveTripsIndividually(cloudSafeTrips, user)

          if (saveErrors.length > 0) {
            console.warn('[Trip Cloud Migration Partial Save]', saveErrors)
          }
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
        const previousTripsById = new Map(lastTripsRef.current.map((trip) => [trip.id, trip]))
        const deletedTripIds = lastTripsRef.current
          .filter((trip) => !currentIds.has(trip.id) && canDeleteTrip(trip, user))
          .map((trip) => trip.id)
        const tripsToSave = state.trips.filter(
          (trip) =>
            !isLegacyDemoTrip(trip, user) &&
            canSaveTripToCloud(trip, user) &&
            hasTripChanged(trip, previousTripsById.get(trip.id))
        )

        try {
          const saveErrors = await saveTripsIndividually(tripsToSave, user)
          const deleteErrors = await deleteTripsIndividually(deletedTripIds)
          const activeTripSaveFailed = saveErrors.some(
            (errorResult) => errorResult.tripId === state.activeTripId
          )

          if (saveErrors.length > 0) {
            console.warn('[Trip Cloud Save Partial Failure]', saveErrors)
          }

          if (deleteErrors.length > 0) {
            console.warn('[Trip Cloud Delete Partial Failure]', deleteErrors)
          }

          lastTripsRef.current = state.trips
          if (activeTripSaveFailed) {
            useTripStore.getState().setCloudError(
              'This trip could not sync to Firebase. Refresh and make sure you are using an account with edit access.'
            )
          } else {
            useTripStore.getState().clearCloudError()
          }
        } catch (error) {
          console.error('[Trip Cloud Save Error]', {
            code: error.code,
            message: error.message,
          })
          useTripStore.getState().setCloudError(
            'Trip changes could not sync to Firebase. Refresh and make sure this account still has access.'
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
    trips.map(async (trip) => {
      await saveTripToCloud(trip, user)
      return trip.id
    })
  )

  return results
    .map((result, index) => ({
      status: result.status,
      tripId: trips[index]?.id,
      reason: result.status === 'rejected' ? result.reason : undefined,
    }))
    .filter((result) => result.status === 'rejected')
}

async function deleteTripsIndividually(tripIds) {
  const results = await Promise.allSettled(
    tripIds.map(async (tripId) => {
      await deleteTripFromCloud(tripId)
      return tripId
    })
  )

  return results
    .map((result, index) => ({
      status: result.status,
      tripId: tripIds[index],
      reason: result.status === 'rejected' ? result.reason : undefined,
    }))
    .filter((result) => result.status === 'rejected')
}
