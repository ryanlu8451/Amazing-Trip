import { useEffect, useRef, useState } from 'react'
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

function mergeCloudAndLocalTrips(cloudTrips, localTrips) {
  const cloudTripsById = new Map(cloudTrips.map((trip) => [trip.id, trip]))
  const localOnlyTrips = localTrips.filter((trip) => !cloudTripsById.has(trip.id))

  return {
    mergedTrips: sortTripsForDisplay([...cloudTrips, ...localOnlyTrips]),
    localOnlyTrips,
  }
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
  const initialLocalPushKeyRef = useRef('')
  const [hasHydratedTrips, setHasHydratedTrips] = useState(() =>
    useTripStore.persist?.hasHydrated?.() ?? true
  )

  useEffect(() => {
    if (hasHydratedTrips) {
      return undefined
    }

    const unsubscribe = useTripStore.persist?.onFinishHydration?.(() => {
      setHasHydratedTrips(true)
    })

    if (useTripStore.persist?.hasHydrated?.()) {
      queueMicrotask(() => setHasHydratedTrips(true))
    }

    return unsubscribe
  }, [hasHydratedTrips])

  useEffect(() => {
    if (!user?.email || !hasHydratedTrips) {
      return undefined
    }

    const unsubscribe = subscribeToSharedTrips(
      user,
      async (cloudTrips) => {
        const currentTrips = useTripStore.getState().trips.filter(
          (trip) => !isLegacyDemoTrip(trip, user)
        )
        const displayCloudTrips = cloudTrips.filter((trip) => !isLegacyDemoTrip(trip, user))
        const cloudSafeCurrentTrips = prepareLocalTripsForCloud(currentTrips, user)
        const { mergedTrips, localOnlyTrips } = mergeCloudAndLocalTrips(
          displayCloudTrips,
          cloudSafeCurrentTrips
        )

        if (localOnlyTrips.length > 0) {
          applyingCloudRef.current = true
          useTripStore.getState().setTripsFromCloud(mergedTrips)
          lastTripsRef.current = mergedTrips
          applyingCloudRef.current = false
          const saveErrors = await saveTripsIndividually(localOnlyTrips, user)

          if (saveErrors.length > 0) {
            console.warn('[Trip Cloud Migration Partial Save]', saveErrors)
            useTripStore.getState().setCloudError(
              'Some local trips could not sync to Firebase. Keep this device online and refresh to retry.'
            )
          } else {
            useTripStore.getState().clearCloudError()
          }
          return
        }

        applyingCloudRef.current = true
        useTripStore.getState().setTripsFromCloud(sortTripsForDisplay(displayCloudTrips))
        lastTripsRef.current = sortTripsForDisplay(displayCloudTrips)
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
  }, [hasHydratedTrips, user])

  useEffect(() => {
    if (!user?.email || !hasHydratedTrips) {
      return
    }

    const localTrips = prepareLocalTripsForCloud(useTripStore.getState().trips, user).filter(
      (trip) => canSaveTripToCloud(trip, user)
    )
    const pushKey = `${user.email}:${localTrips.map((trip) => trip.id).join('|')}`

    if (localTrips.length === 0 || initialLocalPushKeyRef.current === pushKey) {
      return
    }

    initialLocalPushKeyRef.current = pushKey
    saveTripsIndividually(localTrips, user).then((saveErrors) => {
      if (saveErrors.length > 0) {
        console.warn('[Trip Cloud Initial Local Push Partial Failure]', saveErrors)
        useTripStore.getState().setCloudError(
          'Some local trips could not sync to Firebase. Keep this device online and refresh to retry.'
        )
        return
      }

      useTripStore.getState().clearCloudError()
    })
  }, [hasHydratedTrips, user])

  useEffect(() => {
    if (!user?.email || !hasHydratedTrips) {
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
          const deleteErrors = await deleteTripsIndividually(deletedTripIds, user)
          const activeTripSaveFailed = saveErrors.some(
            (errorResult) => errorResult.tripId === state.activeTripId
          )

          if (saveErrors.length > 0) {
            console.warn('[Trip Cloud Save Partial Failure]', saveErrors)
          }

          if (deleteErrors.length > 0) {
            console.warn('[Trip Cloud Delete Partial Failure]', deleteErrors)
          }

          const failedDeleteIds = new Set(deleteErrors.map((errorResult) => errorResult.tripId))
          deletedTripIds
            .filter((tripId) => !failedDeleteIds.has(tripId))
            .forEach((tripId) => useTripStore.getState().clearDeletedTrip(tripId))

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
  }, [hasHydratedTrips, user])
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

async function deleteTripsIndividually(tripIds, user) {
  const results = await Promise.allSettled(
    tripIds.map(async (tripId) => {
      await deleteTripFromCloud(tripId, user)
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
