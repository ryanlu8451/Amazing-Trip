import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const tripsCollection = db ? collection(db, 'trips') : null
const VALID_MEMBER_ROLES = new Set(['owner', 'editor', 'viewer'])

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function getUserTripsCollection(userOrEmail) {
  const userEmail = normalizeEmail(typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email)

  if (!db || !userEmail) {
    return null
  }

  return collection(db, 'users', userEmail, 'trips')
}

export function getTripAccessFields(user, existingTrip = {}) {
  const userEmail = normalizeEmail(user?.email || existingTrip.ownerEmail)
  const ownerId = existingTrip.ownerId || user?.uid || ''
  const ownerEmail = normalizeEmail(existingTrip.ownerEmail || userEmail)
  const existingEmails = Array.isArray(existingTrip.memberEmails)
    ? existingTrip.memberEmails.map(normalizeEmail)
    : []
  const memberEmails = [...new Set([ownerEmail, userEmail, ...existingEmails].filter(Boolean))]
  const sourceMemberRoles = existingTrip.memberRoles || {}
  const memberRoles = memberEmails.reduce((roles, email) => {
    const role = sourceMemberRoles[email]
    roles[email] = VALID_MEMBER_ROLES.has(role) ? role : 'viewer'
    return roles
  }, {})

  if (ownerEmail) {
    memberRoles[ownerEmail] = 'owner'
  }

  if (userEmail && !memberRoles[userEmail]) {
    memberRoles[userEmail] = ownerEmail === userEmail ? 'owner' : 'editor'
  }

  return {
    ownerId,
    ownerEmail,
    memberEmails,
    memberRoles,
  }
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
  const accessFields = getTripAccessFields(user, trip)

  return {
    ...trip,
    ...accessFields,
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

  if (!trip || !userEmail) {
    return false
  }

  if (!trip.ownerId && !trip.ownerEmail) {
    return true
  }

  return normalizeEmail(trip.ownerEmail) === userEmail
}

export function canSaveTripToCloud(trip, user) {
  if (!trip?.ownerId && !trip?.ownerEmail) {
    return true
  }

  return canEditTrip(trip, user)
}

export async function saveTripToCloud(trip, user) {
  const userEmail = normalizeEmail(user?.email)
  const userTripsCollection = getUserTripsCollection(user)

  if (!userTripsCollection || !trip?.id || !userEmail) {
    return
  }

  const cloudTrip = normalizeTripForCloud(trip, user)
  const memberEmails = cloudTrip.memberEmails?.length ? cloudTrip.memberEmails : [userEmail]
  const targetEmails = [...new Set([userEmail, cloudTrip.ownerEmail, ...memberEmails].filter(Boolean))]
  const cloudPayload = {
    ...cloudTrip,
    updatedAt: serverTimestamp(),
  }
  const optionalWrites = [
    tripsCollection ? setDoc(doc(tripsCollection, trip.id), cloudPayload) : Promise.resolve(),
    ...targetEmails
      .filter((email) => email !== userEmail)
      .map((email) => {
        const targetCollection = getUserTripsCollection(email)
        return targetCollection ? setDoc(doc(targetCollection, trip.id), cloudPayload) : Promise.resolve()
      }),
  ]

  await setDoc(doc(userTripsCollection, trip.id), cloudPayload)

  await Promise.allSettled(optionalWrites)
}

export async function deleteTripFromCloud(tripId, user) {
  const userTripsCollection = getUserTripsCollection(user)

  if (!tripId || (!userTripsCollection && !tripsCollection)) {
    return
  }

  if (userTripsCollection) {
    await deleteDoc(doc(userTripsCollection, tripId))
  }

  if (tripsCollection) {
    await Promise.allSettled([deleteDoc(doc(tripsCollection, tripId))])
  }
}

export async function deleteTripForUserFromCloud(tripId, userOrEmail) {
  const userTripsCollection = getUserTripsCollection(userOrEmail)

  if (!tripId || !userTripsCollection) {
    return
  }

  await deleteDoc(doc(userTripsCollection, tripId))
}

export function subscribeToSharedTrips(user, onTrips, onError) {
  const userEmail = normalizeEmail(user?.email)
  const userTripsCollection = getUserTripsCollection(user)

  if (!userTripsCollection || !userEmail) {
    return () => {}
  }

  return onSnapshot(
    userTripsCollection,
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
