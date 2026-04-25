import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const tripsCollection = db ? collection(db, 'trips') : null

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function normalizeTripForCloud(trip, user) {
  const userEmail = normalizeEmail(user?.email)
  const ownerId = trip.ownerId || user?.uid || ''
  const ownerEmail = normalizeEmail(trip.ownerEmail || userEmail)
  const existingEmails = Array.isArray(trip.memberEmails) ? trip.memberEmails : []
  const memberEmails = [
    ...new Set([
      ownerEmail,
      userEmail,
      ...existingEmails.map(normalizeEmail),
    ].filter(Boolean)),
  ]
  const memberRoles = {
    ...(trip.memberRoles || {}),
  }

  if (ownerEmail && !memberRoles[ownerEmail]) {
    memberRoles[ownerEmail] = 'owner'
  }

  if (userEmail && !memberRoles[userEmail]) {
    memberRoles[userEmail] = ownerId === user?.uid ? 'owner' : 'editor'
  }

  return {
    ...trip,
    ownerId,
    ownerEmail,
    memberEmails,
    memberRoles,
    updatedAt: Date.now(),
  }
}

export function canEditTrip(trip, user) {
  const userEmail = normalizeEmail(user?.email)

  if (!trip || !userEmail) {
    return false
  }

  if (trip.ownerId === user?.uid || normalizeEmail(trip.ownerEmail) === userEmail) {
    return true
  }

  const role = trip.memberRoles?.[userEmail]
  return role === 'owner' || role === 'editor'
}

export async function saveTripToCloud(trip, user) {
  if (!tripsCollection || !trip?.id || !user?.email) {
    return
  }

  const cloudTrip = normalizeTripForCloud(trip, user)

  await setDoc(
    doc(tripsCollection, trip.id),
    {
      ...cloudTrip,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function deleteTripFromCloud(tripId) {
  if (!tripsCollection || !tripId) {
    return
  }

  await deleteDoc(doc(tripsCollection, tripId))
}

export function subscribeToSharedTrips(user, onTrips, onError) {
  const userEmail = normalizeEmail(user?.email)

  if (!tripsCollection || !userEmail) {
    return () => {}
  }

  const sharedTripsQuery = query(
    tripsCollection,
    where('memberEmails', 'array-contains', userEmail)
  )

  return onSnapshot(
    sharedTripsQuery,
    (snapshot) => {
      const trips = snapshot.docs.map((tripDoc) => ({
        id: tripDoc.id,
        ...tripDoc.data(),
      }))

      onTrips(trips)
    },
    onError
  )
}
