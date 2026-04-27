import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, LockKeyhole, LoaderCircle } from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import { normalizeEmail } from '../lib/tripCloud'
import { useTranslation } from '../lib/i18n'

export default function Invite() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { trips, activeTripId, cloudReady, setActiveTrip } = useTripStore()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const normalizedUserEmail = normalizeEmail(user?.email)
  const invitedTrip = trips.find((trip) => trip.id === tripId)
  const userCanAccessTrip = invitedTrip?.memberEmails
    ?.map(normalizeEmail)
    .includes(normalizedUserEmail)

  useEffect(() => {
    if (!invitedTrip || !userCanAccessTrip || activeTripId === invitedTrip.id) {
      return
    }

    setActiveTrip(invitedTrip.id)
  }, [activeTripId, invitedTrip, setActiveTrip, userCanAccessTrip])

  const isLoadingInvite = !cloudReady
  const inviteAccepted = invitedTrip && userCanAccessTrip
  const inviteUnavailable = cloudReady && !inviteAccepted

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {isLoadingInvite && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <LoaderCircle size={24} className="animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('invite.loadingTitle')}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {t('invite.loadingBody')}
              </p>
            </div>
          )}

          {inviteAccepted && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-500">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                {t('invite.acceptedEyebrow')}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                {invitedTrip.name || t('common.untitledTrip')}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {t('invite.acceptedBody')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mt-6 w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white"
              >
                {t('invite.openTrip')}
              </button>
            </div>
          )}

          {inviteUnavailable && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
                <LockKeyhole size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('invite.unavailableTitle')}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                {t('invite.unavailableBody', { email: normalizedUserEmail })}
              </p>
              <Link
                to="/"
                className="mt-6 block w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white"
              >
                {t('invite.backHome')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
