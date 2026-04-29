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
const VALID_MEMBER_ROLES = new Set(['owner', 'editor', 'viewer'])

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isLegacyDemoTrip(trip, user) {
  return Boolean(
    trip &&
      (trip.id === 'trip_default' || trip.id === `${user?.uid}_trip_default`) &&
      trip.name === 'Amazing Trip' &&
      trip.destination === '日本東京'
  )
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
  const sourceMemberRoles = trip.memberRoles || {}
  const memberRoles = memberEmails.reduce((roles, email) => {
    const role = sourceMemberRoles[email]
    roles[email] = VALID_MEMBER_ROLES.has(role) ? role : 'viewer'
    return roles
  }, {})

  if (ownerEmail) {
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
    tripType: trip.tripType || 'solo',
    status: trip.status || 'planning',
    isHidden: Boolean(trip.isHidden),
    tips: trip.tips || {
      emergency: [],
      docs: [],
      notes: '',
    },
    flights: Array.isArray(trip.flights) ? trip.flights : [],
    hotels: Array.isArray(trip.hotels) ? trip.hotels : [],
    budget: Array.isArray(trip.budget) ? trip.budget : [],
    timeline: Array.isArray(trip.timeline) ? trip.timeline : [],
    members: Array.isArray(trip.members) ? trip.members : [],
    updatedAt: Date.now(),
  }
}

export function canEditTrip(trip, user) {
  const userEmail = normalizeEmail(user?.email)

  if (!trip || !userEmail) {
    return false
  }

  if (!trip.ownerId && !trip.ownerEmail) {
    return true
  }

  if (trip.ownerId === user?.uid || normalizeEmail(trip.ownerEmail) === userEmail) {
    return true
  }

  const role = trip.memberRoles?.[userEmail]
  return role === 'owner' || role === 'editor'
}

export function canDeleteTrip(trip, user) {
  const userEmail = normalizeEmail(user?.email)

  if (!trip || !user?.uid || !userEmail) {
    return false
  }

  if (!trip.ownerId && !trip.ownerEmail) {
    return true
  }

  return trip.ownerId === user.uid || normalizeEmail(trip.ownerEmail) === userEmail
}

export function canManageTripMembers(trip, user) {
  const userEmail = normalizeEmail(user?.email)

  if (!trip || !user?.uid || !userEmail) {
    return false
  }

  if (!trip.ownerId && !trip.ownerEmail) {
    return true
  }

  return trip.ownerId === user.uid && normalizeEmail(trip.ownerEmail) === userEmail
}

export function canSaveTripToCloud(trip, user) {
  if (!trip?.ownerId && !trip?.ownerEmail) {
    return true
  }

  return canEditTrip(trip, user)
}

export async function saveTripToCloud(trip, user) {
  if (!tripsCollection || !trip?.id || !user?.email) {
    return
  }

  const cloudTrip = normalizeTripForCloud(trip, user)

  await setDoc(doc(tripsCollection, trip.id), {
    ...cloudTrip,
    updatedAt: serverTimestamp(),
  })
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
